package com.papyrus.book;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebBackForwardList;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ConnectException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.net.URLEncoder;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;

import javax.net.ssl.SSLException;

/**
 * Native shell for papyrus-book. The reader UI stays in local assets; only file
 * export and tightly allowlisted book-source requests cross the JS/native boundary.
 */
public class MainActivity extends Activity {
    private static final int FILE_REQUEST = 4107;
    private static final String READER_URL = "file:///android_asset/reader/index.html";
    private static final String BRIDGE_NAME = "PapyrusAndroid";
    private static final String USER_AGENT = "papyrus-book/1.0";
    private static final int TIMEOUT_MILLIS = 20_000;
    private static final int MAX_REDIRECTS = 5;
    private static final int MAX_SEARCH_BYTES = 8 * 1024 * 1024;
    private static final int MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

    private WebView webView;
    private WebChromeClient chromeClient;
    private FrameLayout root;
    private FrameLayout fullscreenContainer;
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private ValueCallback<Uri[]> fileCallback;
    private final ExecutorService networkExecutor = Executors.newSingleThreadExecutor();
    private final ExecutorService exportExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Set<HttpURLConnection> activeConnections =
            Collections.synchronizedSet(new HashSet<>());
    private volatile boolean destroyed;
    private boolean immersiveFullscreen;
    private boolean readerPageReady;
    private int safeAreaLeft;
    private int safeAreaTop;
    private int safeAreaRight;
    private int safeAreaBottom;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureEdgeToEdge();
        applyLightSystemBars();

        root = new FrameLayout(this);
        root.setBackgroundColor(getResources().getColor(R.color.window_background));
        root.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        fullscreenContainer = new FrameLayout(this);
        fullscreenContainer.setBackgroundColor(0xFF000000);
        fullscreenContainer.setVisibility(View.GONE);
        root.addView(fullscreenContainer, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        webView = new WebView(this);
        webView.setBackgroundColor(getResources().getColor(R.color.window_background));
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);
        configureWebView();
        applySystemBarPadding();
        WebBackForwardList restored = savedInstanceState == null
                ? null : webView.restoreState(savedInstanceState);
        if (restored == null || restored.getSize() == 0) {
            webView.loadUrl(READER_URL);
        }
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.addJavascriptInterface(new PapyrusBridge(), BRIDGE_NAME);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                readerPageReady = true;
                pushSafeAreaToWebView();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
                if (scheme.equals("file") || scheme.equals("blob") || scheme.equals("data")) {
                    return false;
                }
                if (scheme.equals("http") || scheme.equals("https")) {
                    openExternal(uri);
                    return true;
                }
                return true;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
                if (scheme.equals("http") || scheme.equals("https")) {
                    // Permit only trusted HTTPS subresources such as Gutenberg covers.
                    // Remote documents and every other network request stay offline.
                    if (!request.isForMainFrame() && isTrustedHttpsUri(uri)) {
                        return null;
                    }
                    return blockedResponse();
                }
                return null;
            }
        });
        chromeClient = new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,
                        params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] {
                        "application/epub+zip", "application/pdf", "text/plain", "text/markdown",
                        "text/html", "application/xml", "text/xml", "application/octet-stream", "*/*"
                });
                try {
                    startActivityForResult(intent, FILE_REQUEST);
                    return true;
                } catch (ActivityNotFoundException error) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    toast(getString(R.string.choose_books));
                    return false;
                }
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullscreenView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                fullscreenView = view;
                fullscreenCallback = callback;
                fullscreenContainer.addView(view, new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
                fullscreenContainer.setVisibility(View.VISIBLE);
                webView.setVisibility(View.GONE);
                getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            }

            @Override
            public void onHideCustomView() {
                if (fullscreenView == null) return;
                fullscreenContainer.removeView(fullscreenView);
                fullscreenContainer.setVisibility(View.GONE);
                fullscreenView = null;
                webView.setVisibility(View.VISIBLE);
                if (fullscreenCallback != null) fullscreenCallback.onCustomViewHidden();
                fullscreenCallback = null;
                applyLightSystemBars();
                webView.requestApplyInsets();
            }
        };
        webView.setWebChromeClient(chromeClient);
    }

    private WebResourceResponse blockedResponse() {
        return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
    }

    private void configureEdgeToEdge() {
        getWindow().setStatusBarColor(0x00000000);
        getWindow().setNavigationBarColor(0x00000000);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
        }
    }

    private void applySystemBarPadding() {
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            int left;
            int top;
            int right;
            int bottom;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout());
                left = safe.left;
                top = safe.top;
                right = safe.right;
                bottom = safe.bottom;
            } else {
                left = insets.getSystemWindowInsetLeft();
                top = insets.getSystemWindowInsetTop();
                right = insets.getSystemWindowInsetRight();
                bottom = insets.getSystemWindowInsetBottom();
            }
            safeAreaLeft = left;
            safeAreaTop = top;
            safeAreaRight = right;
            safeAreaBottom = bottom;
            pushSafeAreaToWebView();
            return insets;
        });
        webView.requestApplyInsets();
    }

    private void pushSafeAreaToWebView() {
        if (!readerPageReady || destroyed || webView == null) return;
        String script = "(function(){var s=document.documentElement.style;"
                + "s.setProperty('--papyrus-safe-left','" + safeAreaLeft + "px');"
                + "s.setProperty('--papyrus-safe-top','" + safeAreaTop + "px');"
                + "s.setProperty('--papyrus-safe-right','" + safeAreaRight + "px');"
                + "s.setProperty('--papyrus-safe-bottom','" + safeAreaBottom + "px');"
                + "document.documentElement.dataset.nativeSafeArea='true';})()";
        try {
            webView.evaluateJavascript(script, null);
        } catch (RuntimeException ignored) {
            // The WebView may be going away with the Activity.
        }
    }

    private void applyLightSystemBars() {
        getWindow().setStatusBarColor(0x00000000);
        getWindow().setNavigationBarColor(0x00000000);
        int flags = View.SYSTEM_UI_FLAG_VISIBLE;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            flags |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }
        getWindow().getDecorView().setSystemUiVisibility(flags);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            int appearance = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            if (getWindow().getDecorView().getWindowInsetsController() != null) {
                getWindow().getDecorView().getWindowInsetsController()
                        .setSystemBarsAppearance(appearance, appearance);
            }
        }
    }

    private void setImmersiveFullscreen(boolean enabled) {
        immersiveFullscreen = enabled;
        View decor = getWindow().getDecorView();
        if (enabled) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                decor.getWindowInsetsController().hide(WindowInsets.Type.systemBars());
                decor.getWindowInsetsController().setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            } else {
                decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            }
        } else {
            applyLightSystemBars();
        }
        webView.requestApplyInsets();
        webView.evaluateJavascript("window.PapyrusNative&&window.PapyrusNative.onFullscreen(" + enabled + ")", null);
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
            // A missing browser must never crash the reader.
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_REQUEST || fileCallback == null) return;
        ValueCallback<Uri[]> callback = fileCallback;
        fileCallback = null;
        if (resultCode != Activity.RESULT_OK || data == null) {
            callback.onReceiveValue(null);
            return;
        }
        ArrayList<Uri> uris = new ArrayList<>();
        if (data.getClipData() != null) {
            for (int i = 0; i < data.getClipData().getItemCount(); i++) {
                uris.add(data.getClipData().getItemAt(i).getUri());
            }
        } else if (data.getData() != null) {
            uris.add(data.getData());
        }
        callback.onReceiveValue(uris.toArray(new Uri[0]));
    }

    @Override
    public void onBackPressed() {
        if (fullscreenView != null) {
            if (chromeClient != null) chromeClient.onHideCustomView();
            return;
        }
        if (immersiveFullscreen) {
            setImmersiveFullscreen(false);
            return;
        }
        webView.evaluateJavascript(
                "(function(){return !!(window.PapyrusBack && window.PapyrusBack());})()",
                handled -> {
                    if (!destroyed && !"true".equals(handled)) finish();
                });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onPause() {
        webView.onPause();
        webView.evaluateJavascript("window.dispatchEvent(new Event('visibilitychange'));", null);
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        if (fullscreenView == null && !immersiveFullscreen) applyLightSystemBars();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (fullscreenView == null && !immersiveFullscreen) applyLightSystemBars();
        webView.requestApplyInsets();
    }

    @Override
    protected void onDestroy() {
        destroyed = true;
        networkExecutor.shutdownNow();
        exportExecutor.shutdownNow();
        disconnectActiveConnections();
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileCallback = null;
        if (fullscreenCallback != null) fullscreenCallback.onCustomViewHidden();
        fullscreenCallback = null;
        if (webView != null) {
            webView.removeJavascriptInterface(BRIDGE_NAME);
            webView.destroy();
        }
        mainHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    private void disconnectActiveConnections() {
        synchronized (activeConnections) {
            for (HttpURLConnection connection : activeConnections) {
                connection.disconnect();
            }
            activeConnections.clear();
        }
    }

    private void toast(String message) {
        if (destroyed) return;
        mainHandler.post(() -> {
            if (!destroyed && !isFinishing()) {
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private final class PapyrusBridge {
        @JavascriptInterface
        public void setFullscreen(boolean enabled) {
            if (destroyed) return;
            mainHandler.post(() -> {
                if (!destroyed && !isFinishing()) setImmersiveFullscreen(enabled);
            });
        }

        @JavascriptInterface
        public void saveFile(String requestedName, String encoded, String requestedMime) {
            if (destroyed) return;
            if (encoded == null || encoded.isEmpty()) {
                toast(getString(R.string.export_error));
                return;
            }
            try {
                exportExecutor.execute(() -> {
                    try {
                        byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
                        String name = safeFilename(requestedName, "papyrus-reading-data.json");
                        String mime = requestedMime == null || requestedMime.trim().isEmpty()
                                ? "application/octet-stream" : requestedMime;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            saveToMediaStore(name, mime, bytes);
                        } else {
                            saveToAppDownloads(name, bytes);
                        }
                        int message = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                                ? R.string.export_success : R.string.export_success_legacy;
                        toast(getString(message));
                    } catch (Exception error) {
                        toast(getString(R.string.export_error));
                    }
                });
            } catch (RejectedExecutionException ignored) {
                // The activity is shutting down; no UI callback is safe or needed.
            }
        }

        @JavascriptInterface
        public void searchBooks(String query, String requestId) {
            String callbackId = requestId == null ? "" : requestId;
            if (destroyed) return;
            try {
                networkExecutor.execute(() -> {
                    try {
                        postPayload("onSearch", performSearch(query, callbackId));
                    } catch (NetworkException error) {
                        postError("onSearch", callbackId, error.code, error.message);
                    } catch (RuntimeException error) {
                        postError("onSearch", callbackId, "INTERNAL_ERROR", "书源请求失败，请重试");
                    }
                });
            } catch (RejectedExecutionException ignored) {
                // The activity is shutting down; no UI callback is safe or needed.
            }
        }

        @JavascriptInterface
        public void downloadBook(String url, String filename, String requestId) {
            String callbackId = requestId == null ? "" : requestId;
            if (destroyed) return;
            try {
                networkExecutor.execute(() -> {
                    try {
                        postPayload("onDownload", performDownload(url, filename, callbackId));
                    } catch (NetworkException error) {
                        postError("onDownload", callbackId, error.code, error.message);
                    } catch (RuntimeException error) {
                        postError("onDownload", callbackId, "INTERNAL_ERROR", "下载失败，请重试");
                    }
                });
            } catch (RejectedExecutionException ignored) {
                // The activity is shutting down; no UI callback is safe or needed.
            }
        }
    }

    private JSONObject performSearch(String query, String requestId) throws NetworkException {
        ensureActive();
        String keyword = query == null ? "" : query.trim();
        if (keyword.isEmpty()) {
            throw new NetworkException("INVALID_QUERY", "请输入搜索关键词");
        }
        if (keyword.length() > 200) {
            throw new NetworkException("INVALID_QUERY", "搜索关键词过长");
        }
        String target;
        try {
            target = "https://gutendex.com/books?search=" + URLEncoder.encode(keyword, "UTF-8");
        } catch (java.io.UnsupportedEncodingException error) {
            throw new NetworkException("INTERNAL_ERROR", "书源请求失败，请重试");
        }

        HttpURLConnection connection = null;
        try {
            connection = openTrustedConnection(target, false);
            ensureActive();
            int status = connection.getResponseCode();
            if (status != HttpURLConnection.HTTP_OK) {
                throw new NetworkException("HTTP_ERROR", "服务器返回 HTTP " + status + "，请稍后重试");
            }
            checkContentLength(connection, MAX_SEARCH_BYTES);
            byte[] body;
            try (InputStream input = connection.getInputStream()) {
                body = readLimited(input, MAX_SEARCH_BYTES);
            }
            JSONArray books = new JSONObject(new String(body, java.nio.charset.StandardCharsets.UTF_8))
                    .getJSONArray("results");
            JSONArray results = new JSONArray();
            for (int i = 0; i < books.length(); i++) {
                JSONObject book = books.optJSONObject(i);
                if (book != null) results.put(normalizeBook(book));
            }
            JSONObject response = new JSONObject();
            response.put("ok", true);
            response.put("requestId", requestId);
            response.put("results", results);
            return response;
        } catch (SocketTimeoutException error) {
            throw timeoutError();
        } catch (UnknownHostException | ConnectException error) {
            throw unavailableError();
        } catch (SSLException error) {
            throw unavailableError();
        } catch (IOException error) {
            throw ioError(error);
        } catch (JSONException error) {
            throw new NetworkException("INVALID_RESPONSE", "书源返回的数据无法解析，请重试");
        } finally {
            closeConnection(connection);
        }
    }

    private JSONObject normalizeBook(JSONObject book) throws JSONException {
        int id = book.optInt("id", 0);
        ArrayList<String> authors = new ArrayList<>();
        JSONArray authorItems = book.optJSONArray("authors");
        if (authorItems != null) {
            for (int i = 0; i < authorItems.length(); i++) {
                JSONObject author = authorItems.optJSONObject(i);
                String name = author == null ? "" : stringValue(author, "name").trim();
                if (!name.isEmpty()) authors.add(name);
            }
        }
        String summary = firstText(book, "summary", "description");
        if (summary.isEmpty()) {
            JSONArray summaries = book.optJSONArray("summaries");
            if (summaries != null && summaries.length() > 0) {
                Object first = summaries.opt(0);
                if (first instanceof String) summary = ((String) first).trim();
            }
        }

        JSONObject formats = new JSONObject();
        JSONObject sourceFormats = book.optJSONObject("formats");
        if (sourceFormats != null) {
            putFormat(formats, sourceFormats, "application/epub+zip", "epub");
            putFormat(formats, sourceFormats, "text/plain", "txt");
            putFormat(formats, sourceFormats, "text/plain; charset=utf-8", "txt");
            putFormat(formats, sourceFormats, "text/html", "html");
            putFormat(formats, sourceFormats, "image/jpeg", "image");
        }

        JSONObject normalized = new JSONObject();
        normalized.put("id", id);
        normalized.put("title", stringValue(book, "title"));
        normalized.put("author", android.text.TextUtils.join(", ", authors));
        normalized.put("summary", summary);
        normalized.put("languages", book.optJSONArray("languages") != null
                ? book.getJSONArray("languages") : new JSONArray());
        normalized.put("downloads", book.has("downloads")
                ? book.optInt("downloads", 0) : book.optInt("download_count", 0));
        normalized.put("formats", formats);
        normalized.put("sourceUrl", "https://gutendex.com/books/" + id);
        return normalized;
    }

    private void putFormat(JSONObject target, JSONObject source, String apiMime, String key)
            throws JSONException {
        Object value = source.opt(apiMime);
        if (value instanceof String && !((String) value).trim().isEmpty()) {
            target.put(key, value);
        }
    }

    private String stringValue(JSONObject object, String key) {
        Object value = object.opt(key);
        return value instanceof String ? (String) value : "";
    }

    private String firstText(JSONObject object, String... keys) {
        for (String key : keys) {
            Object value = object.opt(key);
            if (value instanceof String && !((String) value).trim().isEmpty()) {
                return ((String) value).trim();
            }
        }
        return "";
    }

    private JSONObject performDownload(String url, String requestedFilename, String requestId)
            throws NetworkException {
        ensureActive();
        HttpURLConnection connection = null;
        try {
            connection = openTrustedConnection(url, true);
            ensureActive();
            int status = connection.getResponseCode();
            if (status != HttpURLConnection.HTTP_OK) {
                throw new NetworkException("HTTP_ERROR", "服务器返回 HTTP " + status + "，请稍后重试");
            }
            checkContentLength(connection, MAX_DOWNLOAD_BYTES);
            byte[] bytes;
            try (InputStream input = connection.getInputStream()) {
                bytes = readLimited(input, MAX_DOWNLOAD_BYTES);
            }
            String contentType = connection.getContentType();
            String mime = validateDownloadedContent(bytes, contentType, requestedFilename);
            String filename = filenameForMime(requestedFilename, mime);

            JSONObject response = new JSONObject();
            response.put("ok", true);
            response.put("requestId", requestId);
            response.put("filename", filename);
            response.put("mime", mime);
            response.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP));
            return response;
        } catch (MalformedURLException error) {
            throw new NetworkException("INVALID_URL", "下载地址无效");
        } catch (SocketTimeoutException error) {
            throw timeoutError();
        } catch (UnknownHostException | ConnectException error) {
            throw unavailableError();
        } catch (SSLException error) {
            throw unavailableError();
        } catch (IOException error) {
            throw ioError(error);
        } catch (JSONException error) {
            throw new NetworkException("INTERNAL_ERROR", "下载失败，请重试");
        } finally {
            closeConnection(connection);
        }
    }

    private String validateDownloadedContent(byte[] bytes, String contentType, String filename)
            throws NetworkException {
        if (bytes.length >= 4 && bytes[0] == 0x50 && bytes[1] == 0x4B
                && bytes[2] == 0x03 && bytes[3] == 0x04) {
            return "application/epub+zip";
        }
        String type = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        String name = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        boolean textResponse = type.startsWith("text/")
                || type.equals("application/xhtml+xml")
                || name.endsWith(".txt") || name.endsWith(".html") || name.endsWith(".htm");
        if (!textResponse || !looksLikeText(bytes)) {
            throw new NetworkException("INVALID_CONTENT", "下载内容不是有效的 EPUB 或文本文件");
        }
        return type.contains("html") || name.endsWith(".html") || name.endsWith(".htm")
                ? "text/html" : "text/plain";
    }

    private boolean looksLikeText(byte[] bytes) {
        if (bytes.length == 0) return false;
        for (byte value : bytes) {
            int b = value & 0xFF;
            if (b == 0 || (b < 32 && b != 9 && b != 10 && b != 12 && b != 13)) return false;
        }
        return true;
    }

    private String filenameForMime(String requestedFilename, String mime) {
        String name = safeFilename(requestedFilename, "book");
        String lower = name.toLowerCase(Locale.ROOT);
        if (mime.equals("application/epub+zip") && !lower.endsWith(".epub")) {
            name += ".epub";
        } else if (mime.equals("text/html") && !lower.endsWith(".html") && !lower.endsWith(".htm")) {
            name += ".html";
        } else if (mime.equals("text/plain") && !lower.endsWith(".txt")) {
            name += ".txt";
        }
        return name;
    }

    private HttpURLConnection openTrustedConnection(String rawUrl, boolean allowGutenberg)
            throws IOException, NetworkException {
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            throw new NetworkException("INVALID_URL", "下载地址无效");
        }
        URL current;
        try {
            current = new URL(rawUrl);
        } catch (MalformedURLException error) {
            throw new NetworkException("INVALID_URL", "下载地址无效");
        }
        for (int redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
            validateTrustedUrl(current, allowGutenberg);
            ensureActive();
            HttpURLConnection connection = (HttpURLConnection) current.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(TIMEOUT_MILLIS);
            connection.setReadTimeout(TIMEOUT_MILLIS);
            connection.setUseCaches(false);
            connection.setRequestMethod("GET");
            connection.setRequestProperty("User-Agent", USER_AGENT);
            connection.setRequestProperty("Accept", allowGutenberg ? "*/*" : "application/json");
            connection.setRequestProperty("Accept-Encoding", "identity");
            activeConnections.add(connection);
            boolean keepOpen = false;
            try {
                ensureActive();
                int status = connection.getResponseCode();
                if (isRedirect(status)) {
                    String location = connection.getHeaderField("Location");
                    if (location == null || location.trim().isEmpty()) {
                        throw new NetworkException("HTTP_ERROR", "下载重定向无效，请重试");
                    }
                    if (redirects == MAX_REDIRECTS) {
                        throw new NetworkException("HTTP_ERROR", "下载重定向次数过多，请重试");
                    }
                    try {
                        current = new URL(current, location);
                    } catch (MalformedURLException error) {
                        throw new NetworkException("INVALID_URL", "下载重定向地址无效");
                    }
                    continue;
                }
                keepOpen = true;
                return connection;
            } finally {
                if (!keepOpen) closeConnection(connection);
            }
        }
        throw new NetworkException("HTTP_ERROR", "下载重定向次数过多，请重试");
    }

    private boolean isRedirect(int status) {
        return status == HttpURLConnection.HTTP_MOVED_PERM
                || status == HttpURLConnection.HTTP_MOVED_TEMP
                || status == HttpURLConnection.HTTP_SEE_OTHER
                || status == 307 || status == 308;
    }

    private void validateTrustedUrl(URL url, boolean allowGutenberg) throws NetworkException {
        if (!"https".equalsIgnoreCase(url.getProtocol())
                || (url.getPort() != -1 && url.getPort() != 443)
                || url.getUserInfo() != null) {
            throw new NetworkException("UNTRUSTED_URL", "仅允许受信站点的安全 HTTPS 下载");
        }
        String host = url.getHost() == null ? "" : url.getHost().toLowerCase(Locale.ROOT);
        boolean trusted = host.equals("gutendex.com")
                || (allowGutenberg && (host.equals("www.gutenberg.org")
                || host.equals("gutenberg.org")));
        if (!trusted) {
            throw new NetworkException("UNTRUSTED_URL", "下载站点不在受信列表中");
        }
    }

    private boolean isTrustedHttpsUri(Uri uri) {
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        return "https".equalsIgnoreCase(uri.getScheme())
                && uri.getUserInfo() == null
                && (uri.getPort() == -1 || uri.getPort() == 443)
                && (host.equals("gutendex.com") || host.equals("www.gutenberg.org")
                || host.equals("gutenberg.org"));
    }

    private void checkContentLength(HttpURLConnection connection, int maximum) throws NetworkException {
        long length = connection.getHeaderFieldLong("Content-Length", -1);
        if (length > maximum) {
            throw new NetworkException("TOO_LARGE", "文件超过允许的 25MB 大小限制");
        }
    }

    private byte[] readLimited(InputStream input, int maximum) throws IOException, NetworkException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[16 * 1024];
        int count;
        while ((count = input.read(buffer)) != -1) {
            ensureActive();
            if (output.size() > maximum - count) {
                throw new NetworkException("TOO_LARGE", maximum == MAX_DOWNLOAD_BYTES
                        ? "文件超过允许的 25MB 大小限制" : "书源返回的数据过大，请重试");
            }
            output.write(buffer, 0, count);
        }
        return output.toByteArray();
    }

    private void ensureActive() throws NetworkException {
        if (destroyed || Thread.currentThread().isInterrupted()) {
            throw new NetworkException("CANCELLED", "任务已取消");
        }
    }

    private NetworkException timeoutError() {
        return new NetworkException("TIMEOUT", "网络连接超时，请稍后重试");
    }

    private NetworkException unavailableError() {
        return new NetworkException("NETWORK_UNAVAILABLE", "网络不可用，请检查连接后重试");
    }

    private NetworkException ioError(IOException error) {
        if (destroyed || Thread.currentThread().isInterrupted()
                || error instanceof java.io.InterruptedIOException) {
            return new NetworkException("CANCELLED", "任务已取消");
        }
        return new NetworkException("NETWORK_ERROR", "网络请求失败，请检查连接后重试");
    }

    private void closeConnection(HttpURLConnection connection) {
        if (connection == null) return;
        activeConnections.remove(connection);
        connection.disconnect();
    }

    private void postPayload(String callback, JSONObject payload) {
        if (destroyed) return;
        mainHandler.post(() -> {
            if (destroyed || webView == null) return;
            String script = "window.PapyrusNative&&window.PapyrusNative." + callback
                    + "(" + JSONObject.quote(payload.toString()) + ")";
            try {
                webView.evaluateJavascript(script, null);
            } catch (RuntimeException ignored) {
                // The WebView may be gone during Activity teardown.
            }
        });
    }

    private void postError(String callback, String requestId, String code, String message) {
        if (destroyed) return;
        try {
            JSONObject error = new JSONObject();
            error.put("code", code);
            error.put("message", message);
            JSONObject payload = new JSONObject();
            payload.put("ok", false);
            payload.put("requestId", requestId);
            payload.put("error", error);
            postPayload(callback, payload);
        } catch (JSONException ignored) {
            // Constants above always produce valid JSON.
        }
    }

    private String safeFilename(String requestedName, String fallback) {
        String source = requestedName == null ? fallback : requestedName;
        StringBuilder safe = new StringBuilder(source.length());
        for (int i = 0; i < source.length(); i++) {
            char c = source.charAt(i);
            boolean forbidden = Character.isISOControl(c) || "\\/:*?\"<>|".indexOf(c) >= 0;
            safe.append(forbidden ? '_' : c);
        }
        String cleaned = safe.toString();
        int start = 0;
        int end = cleaned.length();
        while (start < end && (Character.isWhitespace(cleaned.charAt(start)) || cleaned.charAt(start) == '.')) {
            start++;
        }
        while (end > start && (Character.isWhitespace(cleaned.charAt(end - 1)) || cleaned.charAt(end - 1) == '.')) {
            end--;
        }
        String name = cleaned.substring(start, end);
        if (name.isEmpty()) name = fallback;
        if (name.length() > 120) {
            name = name.substring(name.length() - 120);
            start = 0;
            while (start < name.length() && name.charAt(start) == '.') start++;
            name = name.substring(start);
        }
        return name.isEmpty() ? fallback : name;
    }

    @TargetApi(Build.VERSION_CODES.Q)
    private void saveToMediaStore(String name, String mime, byte[] bytes) throws Exception {
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, name);
        values.put(MediaStore.Downloads.MIME_TYPE, mime);
        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Papyrus");
        values.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new IllegalStateException("Unable to create download");
        try (OutputStream output = getContentResolver().openOutputStream(uri)) {
            if (output == null) throw new IllegalStateException("Unable to open download");
            output.write(bytes);
        } catch (Exception error) {
            getContentResolver().delete(uri, null, null);
            throw error;
        }
        values.clear();
        values.put(MediaStore.Downloads.IS_PENDING, 0);
        getContentResolver().update(uri, values, null, null);
    }

    private void saveToAppDownloads(String name, byte[] bytes) throws Exception {
        File directory = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Papyrus");
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IllegalStateException("Unable to create directory");
        }
        try (FileOutputStream output = new FileOutputStream(new File(directory, name))) {
            output.write(bytes);
        }
    }

    private static final class NetworkException extends Exception {
        final String code;
        final String message;

        NetworkException(String code, String message) {
            super(message);
            this.code = code;
            this.message = message;
        }
    }
}
