/* papyrus-book — local-first reader with paged book simulation */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const SUPPORTED = ['epub', 'pdf', 'txt', 'md', 'markdown', 'html', 'htm', 'fb2'];
  const palettes = [
    { bg: 'linear-gradient(145deg,#49675a,#1f382e)', color: '#f2ecda', accent: '#d8ae70' },
    { bg: 'linear-gradient(150deg,#bdc9c0,#6f8577)', color: '#182b22', accent: '#f1e6cc' },
    { bg: 'linear-gradient(145deg,#465968,#1e2c39)', color: '#eceee8', accent: '#dca273' },
    { bg: 'linear-gradient(145deg,#9b6d58,#4d302c)', color: '#f5e8d6', accent: '#e0ba77' },
    { bg: 'linear-gradient(145deg,#d8cfb9,#9c9079)', color: '#2c302a', accent: '#657b66' },
    { bg: 'linear-gradient(145deg,#676176,#302c3f)', color: '#f0e9df', accent: '#c8a6cc' },
    { bg: 'linear-gradient(145deg,#8a9a9d,#41565b)', color: '#f3eee2', accent: '#dc9865' },
    { bg: 'linear-gradient(145deg,#c7ab77,#7e653e)', color: '#2d281f', accent: '#f0dfb7' }
  ];
  const demoChapters = {
    walden: [
      { title: '第一章 · 走进森林', html: '<p>我并不希望仅仅过上一种隐居的生活，而是希望借由亲身生活，弄清生活的真正含义。当我回到森林，不是为了逃离世界，而是为了更清醒地重新进入世界。</p><p>清晨的湖水安静得像一面尚未落笔的纸。树木把光切成细碎的片段，洒在脚下。在这里，时间不再催促，思想终于能够听见自己的声音。</p><h2>简朴生活</h2><p>一个人真正需要的东西，远比想象中少。减去那些不必要的负担，并不是放弃丰盛，而是把注意力交还给真正重要的事物：劳动、观察、阅读，以及与他人的真诚相处。</p><p>我在湖边建起小屋，也在心里腾出一块地方。房子很小，窗户却足够大，足以看见四季如何缓慢地经过。</p>' },
      { title: '第二章 · 我生活的地方', html: '<p>森林里有无数条路径，每一条都通向不同的风景。熟悉一条路，并不是记住转弯，而是学会观察：泥土的湿度、树皮的颜色、风从哪个方向吹来。</p><p>傍晚，我常沿着湖岸散步。远处的村庄亮起灯火，近处的虫鸣此起彼伏。世界并未因距离而消失，只是不再以喧嚣的方式出现。</p><blockquote>我到林中去，因为我希望谨慎地生活，只面对生活的基本事实。</blockquote><p>当夜幕落下，小屋里的炉火成为唯一的中心。我翻开一本书，让别人的经验与自己的思考在同一张桌子上相遇。</p>' },
      { title: '第三章 · 阅读的声音', html: '<p>阅读是与不在场的人交谈。一本书越过时间来到手中，作者留下的问题，仍然可以在今天获得新的回答。</p><p>读得慢一些，给句子留出回声。重要的段落值得被反复遇见，就像熟悉的风景，在不同的光线里总会呈现新的面貌。</p><p>我渐渐明白，积累知识并不是为了拥有更多答案，而是为了保持对世界的好奇，为了在纷乱的意见中，仍然能够独立地判断。</p>' }
    ],
    metamorphosis: [
      { title: '第一章 · 清晨的变故', html: '<p>一天清晨，格里高尔从不安的睡梦中醒来，发现自己的身体发生了难以理解的变化。房间依旧熟悉，光线依旧平静，但日常生活的秩序在瞬间裂开了。</p><p>他先想到的不是恐惧，而是工作。迟到的后果、家人的期待、尚未完成的职责，仍然占据着他的头脑。可是门外的声音提醒他，世界并不会停下来理解一个人的困境。</p><h2>门里与门外</h2><p>他试着站起来，试着说话，试着证明自己仍然能够控制生活。每一次尝试都让现实与内心之间的距离变得更远。</p><p>小说从一个不可能的清晨开始，追问当我们不再符合他人的期待，是否还拥有被理解的可能。</p>' },
      { title: '第二章 · 房间中的世界', html: '<p>房间成为他与家庭之间逐渐增厚的边界。门关上之后，外面的生活继续，里面的时间却变得缓慢而模糊。</p><p>他开始用新的方式感知空间，用新的方式理解食物和光线。曾经理所当然的事物，如今都需要重新学习。</p><p>亲人的照料里混杂着责任、疲惫与回避。爱并没有消失，但爱的表达在恐惧中改变了形状。</p>' }
    ],
    room: [
      { title: '第一章 · 一间房间', html: '<p>创作需要时间，也需要一个不被随意打断的空间。一间属于自己的房间，看起来普通，却意味着经济上的独立与精神上的自主。</p><p>当一个人必须不断争取基本条件，创造力就容易被日常事务所消耗。社会谈论天才，却很少谈论天才诞生所需要的门、锁与安静。</p><h2>写作与自由</h2><p>真正重要的不是房间的大小，而是能否按照自己的节奏生活，能否在不被监视、不被贬低的情况下，完整地表达自己。</p>' },
      { title: '第二章 · 金钱与创作', html: '<p>物质保障并不庸俗。它让思想不必每时每刻为下一顿饭担忧，让选择拥有更坚实的底座。</p><p>然而独立也并不意味着孤立。写作发生在独处之中，却始终渴望与读者相遇，与更广阔的人类经验相连。</p>' }
    ],
    wallpaper: [
      { title: '第一章 · 墙壁之后', html: '<p>房间被安排得安静而封闭，窗外的世界近在咫尺，却仿佛属于另一个生活。墙纸上的花纹在日复一日的注视中逐渐获得了形状。</p><p>她开始记录自己的感受，也开始怀疑那些被称作“休息”的日子。语言成为少数仍然可以自主支配的东西。</p><h2>观察与错觉</h2><p>墙纸究竟隐藏着什么，或许不如她的内心变化重要。故事让读者靠近一种被忽视、被误解、又无法轻易说出口的经验。</p>' },
      { title: '第二章 · 夜色', html: '<p>越接近夜晚，房间里的秩序越显得不稳定。灯光、影子与墙纸的纹路交织在一起，真实与想象之间的边界逐渐模糊。</p><p>她终于开始行动。这个动作既像失控，也像夺回自主权的最后尝试。故事在这里拒绝提供简单的答案。</p>' }
    ]
  };
  const DEMO_BOOKS = [
    { id: 'demo-walden', title: '瓦尔登湖', author: '亨利·戴维·梭罗', format: 'EPUB', progress: 42, currentChapter: 1, pageByChapter: { 1: 0 }, addedAt: new Date().toISOString(), lastRead: null, readingSeconds: 0, sample: true, chapters: demoChapters.walden, palette: palettes[0], demo: true },
    { id: 'demo-metamorphosis', title: '变形记', author: '弗兰兹·卡夫卡', format: 'EPUB', progress: 18, currentChapter: 0, pageByChapter: { 0: 0 }, addedAt: new Date().toISOString(), lastRead: null, readingSeconds: 0, sample: true, chapters: demoChapters.metamorphosis, palette: palettes[3], demo: true },
    { id: 'demo-room', title: '一间自己的房间', author: '弗吉尼亚·伍尔夫', format: 'TXT', progress: 0, currentChapter: 0, pageByChapter: { 0: 0 }, addedAt: new Date().toISOString(), lastRead: null, readingSeconds: 0, sample: true, chapters: demoChapters.room, palette: palettes[4], demo: true },
    { id: 'demo-wallpaper', title: '黄壁纸', author: '夏洛特·珀金斯·吉尔曼', format: 'HTML', progress: 100, currentChapter: 1, pageByChapter: { 1: 0 }, addedAt: new Date().toISOString(), lastRead: null, readingSeconds: 0, sample: true, chapters: demoChapters.wallpaper, palette: palettes[5], demo: true }
  ];

  const storage = {
    get(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  };
  let importedBooks = storage.get('papyrus-books', []);
  let bookmarks = storage.get('papyrus-bookmarks', []);
  let readingLog = storage.get('papyrus-reading-log', {});
  let preferences = { dailyGoal: 30, readerTheme: 'light', fontSize: 18, lineHeight: 1.9, pdfScale: 100, animation: true, ...storage.get('papyrus-preferences', {}) };
  let currentFilter = 'all';
  let currentView = 'home';
  let currentBook = null;
  let currentChapter = 0;
  let currentPrepared = null;
  let pdfDoc = null;
  let pdfPage = 1;
  let pageIndex = 0;
  let pageCount = 1;
  let paging = false;
  let openingReader = false;
  let pendingBookmark = null;
  let sessionMs = 0;
  let lastTick = Date.now();
  let readingTimer = null;
  let progressSaveTimer = null;
  let paginationTimer = null;
  let selectedGoal = preferences.dailyGoal;
  let searchTimer = null;
  let onlineRequest = 0;
  const runtimeCache = new Map();
  const memoryBlobs = new Map();
  const objectUrls = [];
  const pendingNative = new Map();

  window.PapyrusNative = {
    onSearch(payload) { resolveNative('search', payload); },
    onDownload(payload) { resolveNative('download', payload); },
    onFullscreen(enabled) {
      $('#reader-view').dataset.fullscreen = String(!!enabled);
      $('#reader-fullscreen').setAttribute('aria-label', enabled ? '退出全屏' : '全屏');
    }
  };

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  }
  function icon(name) { return `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`; }
  function allBooks() { return [...importedBooks, ...DEMO_BOOKS]; }
  function findBook(id) { return allBooks().find(book => book.id === id); }
  function normalizeFormat(book) { return book.format === 'markdown' ? 'MD' : book.format === 'htm' ? 'HTML' : String(book.format || 'BOOK').toUpperCase(); }
  function formatBytes(bytes = 0) { if (!bytes) return '—'; const units = ['B', 'KB', 'MB', 'GB']; const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`; }
  function hashString(value) { let hash = 0; for (let i = 0; i < String(value).length; i++) hash = ((hash << 5) - hash + String(value).charCodeAt(i)) | 0; return Math.abs(hash); }
  function paletteFor(title) { return palettes[hashString(title) % palettes.length]; }
  function dateKey(date = new Date()) { return date.toISOString().slice(0, 10); }
  function shortDate(value) { if (!value) return '尚未开始'; const d = new Date(value); return `${d.getMonth() + 1}月${d.getDate()}日`; }
  function bookState(book) { if (book.progress >= 98) return 'finished'; if (book.progress > 0 || book.lastRead) return 'reading'; return 'unread'; }
  function stateLabel(state) { return { reading: '阅读中', unread: '未开始', finished: '已读完' }[state]; }
  function bookChapter(book) { return book.chapters?.[book.currentChapter || 0]?.title || (book.format === 'pdf' ? `第 ${book.currentPage || 1} 页` : '开始阅读'); }

  function coverHTML(book, className = '') {
    const palette = book.palette || paletteFor(book.title);
    const pattern = hashString(book.id) % 4;
    const patterns = [
      'repeating-radial-gradient(circle at 85% 78%,transparent 0 13px,rgba(255,255,255,.16) 14px 15px,transparent 16px 26px)',
      'repeating-linear-gradient(38deg,transparent 0 14px,rgba(255,255,255,.09) 15px 16px)',
      'radial-gradient(ellipse at 10% 90%,rgba(0,0,0,.45),transparent 55%),repeating-linear-gradient(90deg,transparent 0 24px,rgba(255,255,255,.06) 25px 26px)',
      'linear-gradient(25deg,transparent 48%,rgba(255,255,255,.13) 49% 50%,transparent 51%),linear-gradient(-25deg,transparent 48%,rgba(255,255,255,.08) 49% 50%,transparent 51%)'
    ];
    const demoTag = book.sample ? '<span class="demo-tag">示例摘录</span>' : '';
    return `<div class="cover ${className}" style="--cover-bg:${palette.bg};--cover-color:${palette.color};--cover-accent:${palette.accent}"><div class="cover-pattern" style="background-image:${patterns[pattern]}"></div><div class="cover-content"><span class="cover-author">${escapeHTML(book.author)}</span><span class="cover-mark"></span><span class="cover-title">${escapeHTML(book.title)}</span><span class="cover-subtitle">PAPYRUS EDITION · ${escapeHTML(normalizeFormat(book))}</span></div>${demoTag}</div>`;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('本地存储不可用'));
      const request = indexedDB.open('papyrus-book', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('books');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function putBookBlob(id, blob) {
    memoryBlobs.set(id, blob);
    const db = await openDatabase();
    await new Promise((resolve, reject) => { const tx = db.transaction('books', 'readwrite'); tx.objectStore('books').put(blob, id); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    db.close();
  }
  async function getBookBlob(id) {
    if (memoryBlobs.has(id)) return memoryBlobs.get(id);
    const db = await openDatabase();
    const blob = await new Promise((resolve, reject) => { const tx = db.transaction('books', 'readonly'); const req = tx.objectStore('books').get(id); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    db.close();
    if (blob) memoryBlobs.set(id, blob);
    return blob;
  }
  async function deleteBookBlob(id) {
    memoryBlobs.delete(id);
    const db = await openDatabase();
    await new Promise((resolve, reject) => { const tx = db.transaction('books', 'readwrite'); tx.objectStore('books').delete(id); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    db.close();
  }

  function toast(message, type = 'success') {
    const element = document.createElement('div');
    element.className = `toast ${type}`;
    element.innerHTML = `${icon(type === 'error' ? 'close' : 'check')}<span>${escapeHTML(message)}</span>`;
    $('#toast-region').append(element);
    setTimeout(() => { element.classList.add('out'); setTimeout(() => element.remove(), 260); }, 3800);
  }
  function openModal(id) {
    closeModals();
    const modal = $(`#${id}`);
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('input, button, select', modal)?.focus(), 40);
  }
  function closeModals() { $$('.modal-backdrop').forEach(modal => { modal.hidden = true; }); document.body.style.overflow = ''; }

  function setView(view) {
    if (!$(`#view-${view}`)) return;
    currentView = view;
    $$('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
    $$('.bottom-nav [data-view]').forEach(button => {
      const active = button.dataset.view === view || (view === 'bookmarks' && button.dataset.view === 'profile');
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    if (view === 'home') renderHome();
    if (view === 'library') renderLibrary();
    if (view === 'profile') renderProfile();
    if (view === 'bookmarks') renderBookmarks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function setLibraryMode(mode) {
    $$('[data-library-mode]').forEach(button => { const active = button.dataset.libraryMode === mode; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
    $('#local-library-panel').hidden = mode !== 'local';
    $('#online-library-panel').hidden = mode !== 'online';
    if (mode === 'online') setTimeout(() => $('#source-query').focus(), 100);
  }

  function renderHome() {
    const books = allBooks();
    const reading = books.filter(book => bookState(book) === 'reading' && book.progress < 98).sort((a, b) => new Date(b.lastRead || b.addedAt) - new Date(a.lastRead || a.addedAt));
    const featured = reading[0] || [...books].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))[0];
    const today = Math.floor((readingLog[dateKey()] || 0) / 60);
    $('#home-greeting').textContent = `${new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好'}，读者`;
    $('#home-date').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());
    $('#daily-strip').innerHTML = [
      ['clock', '今日阅读', today, '分钟', ''], ['flame', '连续阅读', calculateStreak(), '天', 'warm'], ['check', '已完成', books.filter(book => bookState(book) === 'finished').length, '本', '']
    ].map(([name, label, value, unit, style]) => `<article class="daily-stat"><span class="stat-icon ${style}">${icon(name)}</span><div><span>${label}</span><strong>${value}<small>${unit}</small></strong></div></article>`).join('');
    if (!featured) {
      $('#home-feature').innerHTML = `<div class="feature-empty"><span class="empty-icon">${icon('book')}</span><h2>下一本书，正在等你</h2><p>导入一本电子书，开启你的阅读空间。</p><button class="primary-button" data-import>${icon('plus')}导入电子书</button></div>`;
      return;
    }
    let excerpt = featured.chapters?.[featured.currentChapter || 0]?.html || '';
    if (excerpt) { const temp = document.createElement('div'); temp.innerHTML = excerpt; excerpt = temp.textContent.replace(/\s+/g, ' ').trim(); }
    if (!excerpt) excerpt = featured.format === 'pdf' ? `从第 ${featured.currentPage || 1} 页继续，回到上次停下的地方。` : '打开书籍，回到上次停下的那一页。';
    const progress = Math.round(featured.progress || 0);
    $('#home-feature').innerHTML = `<article class="feature-card"><div class="hero-book-wrap">${coverHTML(featured, 'hero-book')}</div><div class="feature-info"><div class="feature-status"><span class="status-dot"></span>${progress ? '正在阅读' : '为你推荐'} · ${escapeHTML(normalizeFormat(featured))}</div><h2>${escapeHTML(featured.title)}</h2><p class="feature-author">${escapeHTML(featured.author)} · ${escapeHTML(bookChapter(featured))}</p><p class="feature-excerpt">${escapeHTML(excerpt.slice(0, 180))}</p><div class="progress-line"><div class="progress-track"><i style="width:${progress}%"></i></div><strong>${progress}%</strong></div><div class="feature-actions"><button class="primary-button" id="home-continue">${progress ? '继续阅读' : '开始阅读'}${icon('arrow')}</button><button class="secondary-button" id="home-details">书籍详情</button></div></div></article>`;
    $('#home-continue').addEventListener('click', () => openReader(featured));
    $('#home-details').addEventListener('click', () => showBookDetails(featured.id));
  }

  function renderLibrary() {
    const books = allBooks();
    $('#local-count').textContent = books.length;
    const query = $('#local-search').value.trim().toLowerCase();
    const filtered = books.filter(book => (currentFilter === 'all' || bookState(book) === currentFilter) && `${book.title} ${book.author}`.toLowerCase().includes(query)).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    $('#clear-local-search').hidden = !query;
    $('#shelf-label').textContent = query ? `搜索结果 · ${filtered.length}` : ({ all: '全部藏书', reading: '阅读中', unread: '未开始', finished: '已读完' }[currentFilter]);
    $('#book-grid').innerHTML = filtered.map(book => {
      const state = bookState(book);
      return `<article class="book-card"><span class="book-format">${escapeHTML(normalizeFormat(book))}</span><button class="book-more" data-book-details="${escapeHTML(book.id)}" aria-label="查看《${escapeHTML(book.title)}》详情">${icon('more')}</button><button class="book-open" data-open-book="${escapeHTML(book.id)}" aria-label="阅读《${escapeHTML(book.title)}》">${coverHTML(book)}<div class="book-info"><h3>${escapeHTML(book.title)}</h3><p class="book-author">${escapeHTML(book.author)}</p><div class="book-card-bottom"><span class="book-state ${state}"><i></i>${stateLabel(state)}</span><span>${Math.round(book.progress || 0)}%</span></div><div class="book-progress"><i style="width:${book.progress || 0}%"></i></div></div></button></article>`;
    }).join('');
    $('#book-grid').hidden = filtered.length === 0;
    $('#library-empty').hidden = filtered.length > 0;
    if (!filtered.length && (query || currentFilter !== 'all')) {
      $('#library-empty h2').textContent = '没有找到匹配的书';
      $('#library-empty p').textContent = '换个关键词，或看看其他阅读状态。';
      $('#library-empty button').hidden = true;
    } else {
      $('#library-empty h2').textContent = '书架还空着';
      $('#library-empty p').textContent = '导入 EPUB、PDF、TXT、Markdown、HTML 或 FB2，开始阅读。';
      $('#library-empty button').hidden = false;
    }
    $$('#book-grid [data-open-book]').forEach(button => button.addEventListener('click', () => openReader(findBook(button.dataset.openBook))));
    $$('#book-grid [data-book-details]').forEach(button => button.addEventListener('click', () => showBookDetails(button.dataset.bookDetails)));
  }

  function calculateStreak() {
    let streak = 0;
    const date = new Date();
    if (!(readingLog[dateKey(date)] > 0)) date.setDate(date.getDate() - 1);
    while (readingLog[dateKey(date)] > 0) { streak++; date.setDate(date.getDate() - 1); }
    return streak;
  }
  function renderProfile() {
    const seconds = Object.values(readingLog).reduce((sum, value) => sum + Number(value || 0), 0);
    $('#profile-hours').textContent = (seconds / 3600).toFixed(1);
    $('#profile-today').textContent = Math.floor((readingLog[dateKey()] || 0) / 60);
    $('#profile-books').textContent = importedBooks.length;
    $('#bookmark-count').textContent = bookmarks.length;
    $('#profile-streak').textContent = calculateStreak();
    $('#profile-goal-label').textContent = `${preferences.dailyGoal} 分钟`;
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
    const values = days.map(d => Math.round((readingLog[dateKey(d)] || 0) / 60));
    const max = Math.max(preferences.dailyGoal, ...values, 1);
    $('#week-total').textContent = `本周共读 ${values.reduce((a, b) => a + b, 0)} 分钟`;
    $('#week-chart').innerHTML = days.map((d, i) => `<div class="week-day ${dateKey(d) === dateKey() ? 'today' : ''}" title="${d.getMonth() + 1}月${d.getDate()}日：${values[i]} 分钟"><div class="week-bar-wrap"><div class="week-bar" style="height:${Math.max(5, values[i] / max * 100)}%"></div></div><span>${'日一二三四五六'[d.getDay()]}</span></div>`).join('');
    updateStorageInfo();
  }
  function renderBookmarks() {
    const sorted = [...bookmarks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    $('#bookmark-list').innerHTML = sorted.length ? sorted.map(mark => `<article class="bookmark-card"><h3>${escapeHTML(mark.title)}</h3><blockquote>${escapeHTML(mark.excerpt || '已保存到此阅读位置')}</blockquote><div class="bookmark-bottom"><span>${escapeHTML(mark.chapterName || `第 ${mark.page || 1} 页`)} · ${Math.round(mark.progress || 0)}% · ${shortDate(mark.createdAt)}</span><div><button class="text-button" data-open-bookmark="${escapeHTML(mark.id)}">继续阅读</button><button class="bookmark-delete" data-delete-bookmark="${escapeHTML(mark.id)}" aria-label="删除书签">${icon('trash')}</button></div></div></article>`).join('') : `<div class="empty-state glass"><span class="empty-icon">${icon('bookmark')}</span><h2>还没有书签</h2><p>阅读时点击书签按钮，留住想再次相遇的段落。</p><button class="secondary-button" data-view="library">去书库看看</button></div>`;
    $$('[data-open-bookmark]').forEach(button => button.addEventListener('click', () => openBookmark(bookmarks.find(item => item.id === button.dataset.openBookmark))));
    $$('[data-delete-bookmark]').forEach(button => button.addEventListener('click', () => { bookmarks = bookmarks.filter(item => item.id !== button.dataset.deleteBookmark); storage.set('papyrus-bookmarks', bookmarks); renderBookmarks(); $('#bookmark-count').textContent = bookmarks.length; toast('书签已删除'); }));
  }
  function refreshAll() { renderHome(); renderLibrary(); renderProfile(); renderBookmarks(); }
  function saveImportedBooks() { if (!storage.set('papyrus-books', importedBooks)) toast('本地存储空间不足，进度可能无法保存', 'error'); }
  function saveBookProgress() {
    if (!currentBook || currentBook.sample) return;
    const book = importedBooks.find(item => item.id === currentBook.id);
    if (!book) return;
    book.progress = Math.round(currentBook.progress || 0);
    book.currentChapter = currentBook.currentChapter;
    book.currentPage = currentBook.currentPage;
    book.pageByChapter = currentBook.pageByChapter;
    book.readingSeconds = currentBook.readingSeconds;
    book.lastRead = new Date().toISOString();
    clearTimeout(progressSaveTimer);
    progressSaveTimer = setTimeout(saveImportedBooks, 450);
  }

  async function readTextBlob(blob) {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let encoding = 'utf-8';
    if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = 'utf-16le';
    else if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = 'utf-16be';
    try { return new TextDecoder(encoding, { fatal: true }).decode(buffer); }
    catch { try { return new TextDecoder('gbk', { fatal: true }).decode(buffer); } catch { return new TextDecoder('utf-8').decode(buffer); } }
  }
  function sanitizeHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('script,style,iframe,object,embed,form,input,button,link,meta,base,audio,video,source,track').forEach(node => node.remove());
    template.content.querySelectorAll('*').forEach(node => {
      if (node.tagName === 'IMG' && /^\s*https?:/i.test(node.getAttribute('src') || '')) node.remove();
      [...node.attributes].forEach(attr => {
        const name = attr.name.toLowerCase(); const value = attr.value.trim();
        if (name === 'style' || name.startsWith('on') || name === 'srcdoc' || ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(value))) node.removeAttribute(attr.name);
      });
      if (node.tagName === 'A' && /^\s*https?:/i.test(node.getAttribute('href') || '')) { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    });
    return template.innerHTML;
  }
  function markdownToHTML(markdown) {
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
    const inline = text => escapeHTML(text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const output = []; let paragraph = []; let listType = null;
    const flushParagraph = () => { if (paragraph.length) { output.push(`<p>${inline(paragraph.join(' '))}</p>`); paragraph = []; } };
    const closeList = () => { if (listType) { output.push(`</${listType}>`); listType = null; } };
    for (const line of lines) {
      const heading = line.match(/^(#{1,6})\s+(.*)$/); const ul = line.match(/^\s*[-*+]\s+(.*)$/); const ol = line.match(/^\s*\d+[.)]\s+(.*)$/); const quote = line.match(/^>\s?(.*)$/);
      if (heading) { flushParagraph(); closeList(); const level = Math.min(heading[1].length, 3); output.push(`<h${level}>${inline(heading[2])}</h${level}>`); }
      else if (ul || ol) { flushParagraph(); const type = ul ? 'ul' : 'ol'; if (listType !== type) { closeList(); output.push(`<${type}>`); listType = type; } output.push(`<li>${inline((ul || ol)[1])}</li>`); }
      else if (quote) { flushParagraph(); closeList(); output.push(`<blockquote>${inline(quote[1])}</blockquote>`); }
      else if (/^\s*$/.test(line)) { flushParagraph(); closeList(); }
      else if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { flushParagraph(); closeList(); output.push('<hr>'); }
      else { closeList(); paragraph.push(line.trim()); }
    }
    flushParagraph(); closeList(); return output.join('\n');
  }
  function splitTextChapters(text) {
    const normalized = text.replace(/\r\n?/g, '\n').trim();
    const matches = [...normalized.matchAll(/^(第[零一二三四五六七八九十百千万0-9]+[章节回卷].*|Chapter\s+\d+.*)$/gmi)];
    const toHTML = body => body.split(/\n\s*\n/).filter(Boolean).map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br>')}</p>`).join('');
    if (!matches.length) return [{ title: '正文', html: toHTML(normalized) }];
    const chapters = [];
    if (matches[0].index > 0) chapters.push({ title: '序言', html: toHTML(normalized.slice(0, matches[0].index)) });
    matches.forEach((match, i) => chapters.push({ title: match[0].trim(), html: toHTML(normalized.slice(match.index + match[0].length, matches[i + 1]?.index).trim()) }));
    return chapters;
  }
  function splitMarkdownChapters(text) {
    const normalized = text.replace(/\r\n?/g, '\n').trim();
    const matches = [...normalized.matchAll(/^(第[零一二三四五六七八九十百千万0-9]+[章节回卷].*|Chapter\s+\d+.*)$/gmi)];
    if (!matches.length) return [{ title: '正文', markdown: normalized }];
    const chapters = [];
    if (matches[0].index > 0) chapters.push({ title: '序言', markdown: normalized.slice(0, matches[0].index).trim() });
    matches.forEach((match, i) => chapters.push({ title: match[0].trim(), markdown: normalized.slice(match.index + match[0].length, matches[i + 1]?.index).trim() }));
    return chapters;
  }
  function parseFB2(xmlText) {
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('FB2 XML 格式无效');
    const sections = [...xml.querySelectorAll('body > section')]; const source = sections.length ? sections : [...xml.querySelectorAll('section')];
    if (!source.length) throw new Error('FB2 没有可读取的正文');
    return source.map((section, i) => {
      const title = section.querySelector(':scope > title, title')?.textContent?.trim() || `第 ${i + 1} 章`;
      const clone = section.cloneNode(true); clone.querySelectorAll('title,script,style').forEach(node => node.remove());
      return { title, html: sanitizeHTML(new XMLSerializer().serializeToString(clone)) };
    });
  }
  function resolveBookPath(base, path) {
    const clean = decodeURIComponent(path.split('#')[0].split('?')[0]).replace(/^\//, '');
    const result = (base ? `${base}/` : '').split('/').filter(Boolean);
    for (const part of clean.split('/')) { if (part === '..') result.pop(); else if (part && part !== '.') result.push(part); }
    return result.join('/');
  }
  async function prepareEPUB(blob) {
    if (!window.JSZip) throw new Error('EPUB 解析组件未加载');
    const zip = await JSZip.loadAsync(blob);
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('不是有效的 EPUB 文件');
    const container = new DOMParser().parseFromString(await containerFile.async('string'), 'application/xml');
    const rootfile = container.getElementsByTagNameNS('*', 'rootfile')[0]?.getAttribute('full-path');
    if (!rootfile || !zip.file(rootfile)) throw new Error('EPUB 缺少内容清单');
    const opf = new DOMParser().parseFromString(await zip.file(rootfile).async('string'), 'application/xml');
    const metadata = opf.getElementsByTagNameNS('*', 'metadata')[0];
    const title = metadata?.getElementsByTagNameNS('*', 'title')[0]?.textContent?.trim();
    const author = metadata?.getElementsByTagNameNS('*', 'creator')[0]?.textContent?.trim() || '未知作者';
    const manifest = new Map([...opf.getElementsByTagNameNS('*', 'item')].map(item => [item.getAttribute('id'), { href: item.getAttribute('href'), type: item.getAttribute('media-type'), properties: item.getAttribute('properties') || '' }]));
    const spine = [...opf.getElementsByTagNameNS('*', 'itemref')].map(ref => manifest.get(ref.getAttribute('idref'))).filter(item => item && item.href);
    if (!spine.length) throw new Error('EPUB 没有可读取的章节');
    const base = rootfile.includes('/') ? rootfile.slice(0, rootfile.lastIndexOf('/')) : '';
    const titles = new Map();
    const navItem = [...manifest.values()].find(item => item.properties.split(' ').includes('nav'));
    if (navItem) try { const navPath = resolveBookPath(base, navItem.href); const nav = new DOMParser().parseFromString(await zip.file(navPath).async('string'), 'application/xhtml+xml'); nav.querySelectorAll('a').forEach(link => titles.set(resolveBookPath(base, link.getAttribute('href') || ''), link.textContent.trim())); } catch {}
    if (!titles.size) {
      const ncx = [...manifest.values()].find(item => item.type?.includes('dtbncx+xml'));
      if (ncx) try { const navPath = resolveBookPath(base, ncx.href); const nav = new DOMParser().parseFromString(await zip.file(navPath).async('string'), 'application/xml'); nav.querySelectorAll('navPoint').forEach(point => { const src = point.querySelector('content')?.getAttribute('src'); const label = point.querySelector('navLabel text')?.textContent?.trim(); if (src && label) titles.set(resolveBookPath(base, src), label); }); } catch {}
    }
    const chapters = spine.filter(item => !item.type?.includes('nav')).map((item, i) => { const path = resolveBookPath(base, item.href); return { id: `epub-${i}`, href: path, title: titles.get(path) || `第 ${i + 1} 章` }; });
    return { title: title || '未命名 EPUB', author, chapters, zip, base };
  }
  async function loadEPUBChapter(prepared, index) {
    const chapter = prepared.chapters[index]; const file = prepared.zip.file(chapter.href);
    if (!file) throw new Error(`无法读取章节：${chapter.title}`);
    const xml = new DOMParser().parseFromString(await file.async('string'), 'application/xhtml+xml');
    const body = xml.body || xml.documentElement;
    const template = document.createElement('template'); template.innerHTML = sanitizeHTML(body.innerHTML);
    const base = chapter.href.includes('/') ? chapter.href.slice(0, chapter.href.lastIndexOf('/')) : '';
    await Promise.all([...template.content.querySelectorAll('img')].map(async img => {
      const src = img.getAttribute('src'); if (!src || /^https?:/i.test(src)) { img.remove(); return; } if (/^data:/i.test(src)) return;
      const image = prepared.zip.file(resolveBookPath(base, src));
      if (image) { const url = URL.createObjectURL(await image.async('blob')); objectUrls.push(url); img.src = url; img.alt = img.alt || ''; } else img.remove();
    }));
    return { ...chapter, html: template.innerHTML };
  }
  async function getPreparedBook(book) {
    if (runtimeCache.has(book.id)) return runtimeCache.get(book.id);
    if (book.sample) return book;
    const blob = await getBookBlob(book.id); if (!blob) throw new Error('原始文件已不可用，请重新导入');
    let prepared;
    if (book.format === 'epub') prepared = await prepareEPUB(blob);
    else {
      const text = await readTextBlob(blob);
      if (book.format === 'txt') prepared = { title: book.title, author: book.author, chapters: splitTextChapters(text) };
      else if (book.format === 'md' || book.format === 'markdown') prepared = { title: book.title, author: book.author, chapters: splitMarkdownChapters(text).map(chapter => ({ ...chapter, html: markdownToHTML(chapter.markdown) })) };
      else if (book.format === 'fb2') prepared = { title: book.title, author: book.author, chapters: parseFB2(text) };
      else prepared = { title: book.title, author: book.author, chapters: [{ title: '正文', html: sanitizeHTML(text) }] };
    }
    runtimeCache.set(book.id, prepared); return prepared;
  }

  async function buildBookRecord(file, metadata = {}) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED.includes(ext)) throw new Error('不支持的文件格式');
    const id = metadata.id || `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const base = { id, title: metadata.title || file.name.replace(/\.[^.]+$/, ''), author: metadata.author || '未知作者', format: ext, progress: 0, currentChapter: 0, currentPage: 1, pageByChapter: {}, addedAt: new Date().toISOString(), lastRead: null, readingSeconds: 0, fileSize: file.size, palette: metadata.palette || paletteFor(metadata.title || file.name), source: metadata.source || 'local' };
    if (ext === 'epub') { const prepared = await prepareEPUB(file); base.title = prepared.title || base.title; base.author = prepared.author || base.author; base.chapterCount = prepared.chapters.length; }
    else if (ext === 'pdf') {
      if (!window.pdfjsLib) throw new Error('PDF 解析组件未加载');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
      const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise; base.pageCount = doc.numPages;
      try { const info = await doc.getMetadata(); base.title = info.info?.Title || base.title; base.author = info.info?.Author || base.author; } catch {}
      await doc.destroy();
    } else {
      const text = await readTextBlob(file);
      if (ext === 'fb2') base.chapterCount = parseFB2(text).length;
      else if (ext === 'txt') base.chapterCount = splitTextChapters(text).length;
      else if (ext === 'md' || ext === 'markdown') base.chapterCount = splitMarkdownChapters(text).length;
    }
    await putBookBlob(id, file); importedBooks.unshift(base); saveImportedBooks(); return base;
  }
  async function importFiles(fileList) {
    const files = [...fileList]; if (!files.length) return;
    $('#file-input').value = ''; $('#import-progress').hidden = false; $('#import-progress-bar').style.width = '0%';
    let imported = 0; const failures = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]; $('#import-progress-text').textContent = `正在处理 ${i + 1}/${files.length} · ${file.name}`;
      try { await buildBookRecord(file); imported++; } catch (error) { console.error(error); failures.push(`${file.name}：${error.message || '无法解析'}`); }
      $('#import-progress-bar').style.width = `${(i + 1) / files.length * 100}%`;
    }
    refreshAll(); closeModals(); setTimeout(() => { $('#import-progress').hidden = true; }, 700);
    if (imported) toast(`已导入 ${imported} 本书`);
    if (failures.length) toast(failures[0], 'error');
  }

  function showBookDetails(id) {
    const book = findBook(id); if (!book) return;
    const count = book.format === 'pdf' ? book.pageCount : book.chapterCount || book.chapters?.length || 1;
    $('#book-detail').innerHTML = `<div class="book-detail-layout">${coverHTML(book)}<div class="book-detail-info"><h2>${escapeHTML(book.title)}</h2><p class="detail-author">${escapeHTML(book.author)} · ${escapeHTML(normalizeFormat(book))}${book.sample ? ' · 示例摘录' : ''}</p><div class="detail-meta"><div><span>阅读进度</span><strong>${Math.round(book.progress || 0)}%</strong></div><div><span>${book.format === 'pdf' ? '页数' : '章节'}</span><strong>${count}</strong></div><div><span>文件大小</span><strong>${formatBytes(book.fileSize)}</strong></div><div><span>加入书库</span><strong>${shortDate(book.addedAt)}</strong></div></div></div></div><div class="detail-actions"><button class="primary-button" id="detail-read">${book.progress ? '继续阅读' : '开始阅读'}${icon('arrow')}</button>${book.sample ? '' : `<button class="secondary-button danger-button" id="detail-delete">${icon('trash')}删除</button>`}</div>`;
    $('#detail-read').addEventListener('click', () => { closeModals(); openReader(book); });
    $('#detail-delete')?.addEventListener('click', async () => {
      if (!confirm(`确定从书库删除《${book.title}》吗？原始文件与阅读进度也会移除。`)) return;
      await deleteBookBlob(book.id); runtimeCache.delete(book.id); importedBooks = importedBooks.filter(item => item.id !== book.id); bookmarks = bookmarks.filter(item => item.bookId !== book.id); storage.set('papyrus-bookmarks', bookmarks); saveImportedBooks(); closeModals(); refreshAll(); toast('图书已从书库移除');
    });
    openModal('book-modal');
  }

  function applyReaderPreferences() {
    const theme = preferences.readerTheme || 'light';
    $('#reader-view').dataset.readerTheme = theme;
    document.documentElement.style.setProperty('--reader-font-size', `${preferences.fontSize}px`);
    document.documentElement.style.setProperty('--reader-line-height', preferences.lineHeight);
    $('#font-size-range').value = preferences.fontSize; $('#font-size-value').textContent = `${preferences.fontSize} px`;
    $('#line-height-value').textContent = Number(preferences.lineHeight).toFixed(1);
    $$('#line-height-options button').forEach(button => button.classList.toggle('active', Number(button.dataset.lineHeight) === Number(preferences.lineHeight)));
    $$('[data-reader-theme]').forEach(button => button.classList.toggle('active', button.dataset.readerTheme === theme));
    $('#default-theme').value = theme; $('#default-animation').value = String(preferences.animation);
    $('#animation-enabled').classList.toggle('active', preferences.animation); $('#animation-disabled').classList.toggle('active', !preferences.animation);
    $('#reader-theme-toggle use').setAttribute('href', theme === 'dark' ? '#i-moon' : '#i-sun');
    storage.set('papyrus-preferences', preferences);
    clearTimeout(paginationTimer); paginationTimer = setTimeout(() => { if (currentBook && !pdfDoc) paginate(false); }, 120);
  }

  async function openReader(book, options = {}) {
    if (!book || openingReader) return;
    openingReader = true; closeReaderPanels(); currentBook = book; pendingBookmark = options.bookmark || pendingBookmark;
    $('#reader-view').hidden = false; $('#reader-view').classList.remove('chrome-hidden'); document.body.style.overflow = 'hidden';
    applyReaderPreferences(); $('#reader-book-title').textContent = book.title;
    $('#toc-meta').textContent = `${normalizeFormat(book)} · ${book.sample ? '示例摘录，非完整原著' : book.source === 'gutenberg' ? 'Project Gutenberg 公版书' : '本地藏书'}`;
    try {
      if (book.format === 'pdf' && !book.sample) {
        const blob = await getBookBlob(book.id); if (!blob) throw new Error('PDF 文件已不可用，请重新导入');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
        pdfDoc = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
        pdfPage = Math.max(1, Math.min(options.page || book.currentPage || 1, pdfDoc.numPages)); currentChapter = pdfPage - 1; pageIndex = 0; pageCount = pdfDoc.numPages;
        $('#book-content').hidden = true; $('#pdf-stage').hidden = false; renderPDFContents(); await renderPDFPage(pdfPage);
      } else {
        pdfDoc = null; currentPrepared = await getPreparedBook(book);
        currentChapter = Math.max(0, Math.min(options.chapter ?? book.currentChapter ?? 0, currentPrepared.chapters.length - 1));
        $('#book-content').hidden = false; $('#pdf-stage').hidden = true; book.currentChapter = currentChapter; renderContents(); await loadChapter(currentChapter, false);
      }
      if (pendingBookmark) {
        if (pdfDoc) await renderPDFPage(pendingBookmark.page || pdfPage);
        else { pageIndex = Math.max(0, Math.min(pendingBookmark.page || book.pageByChapter?.[currentChapter] || 0, pageCount - 1)); paginate(false); }
        pendingBookmark = null;
      }
      startReadingTimer();
    } catch (error) { console.error(error); toast(error.message || '无法打开这本书', 'error'); closeReader(); }
    finally { openingReader = false; }
  }
  function closeReader() {
    if (!currentBook) return;
    if (window.PapyrusAndroid?.setFullscreen && $('#reader-view').dataset.fullscreen === 'true') window.PapyrusAndroid.setFullscreen(false);
    flushReadingTime(); clearInterval(readingTimer); readingTimer = null; clearTimeout(progressSaveTimer); clearTimeout(paginationTimer);
    saveBookProgress();
    if (!currentBook.sample) currentBook.lastRead = new Date().toISOString();
    objectUrls.forEach(url => URL.revokeObjectURL(url)); objectUrls.length = 0;
    runtimeCache.forEach((prepared, id) => { if (id !== currentBook?.id && prepared?.zip) runtimeCache.delete(id); });
    if (pdfDoc) { pdfDoc.destroy(); pdfDoc = null; }
    currentBook = null; currentPrepared = null; $('#turning-sheet').classList.remove('active'); $('#page-shade').style.opacity = 0;
    closeReaderPanels(); $('#reader-view').hidden = true; document.body.style.overflow = ''; refreshAll();
  }
  function closeReaderPanels() { $('#toc-panel').hidden = true; $('#reader-settings-panel').hidden = true; $('#reader-scrim').hidden = true; }
  function openReaderPanel(id) { closeReaderPanels(); $(`#${id}`).hidden = false; $('#reader-scrim').hidden = false; }
  function renderContents() {
    const chapters = currentPrepared?.chapters || [];
    $('#toc-list').innerHTML = chapters.map((chapter, index) => `<button class="toc-item ${index === currentChapter ? 'active' : ''}" data-chapter="${index}"><span>${String(index + 1).padStart(2, '0')}</span>${escapeHTML(chapter.title)}</button>`).join('');
    $$('#toc-list [data-chapter]').forEach(button => button.addEventListener('click', () => { const index = Number(button.dataset.chapter); closeReaderPanels(); if (index === currentChapter) paginate(false); else goChapter(index); }));
  }
  async function loadChapter(index, animate = true) {
    if (!currentPrepared || index < 0 || index >= currentPrepared.chapters.length || paging) return;
    paging = true;
    try {
      currentChapter = index; const chapter = currentPrepared.chapters[index]; const content = chapter.html ? chapter : await loadEPUBChapter(currentPrepared, index);
      currentPrepared.chapters[index] = content;
      $('#book-content').innerHTML = `<header class="chapter-heading"><span class="chapter-number">CHAPTER ${String(index + 1).padStart(2, '0')}</span>${escapeHTML(chapter.title)}</header>${content.html || ''}`;
      $('#reader-chapter-name').textContent = chapter.title; pageIndex = Math.max(0, Math.min(currentBook.pageByChapter?.[index] || 0, 10000));
      renderContents(); await nextFrame(); paginate(animate); currentBook.currentChapter = index; updateReaderProgress(); updateBookmarkButton(); saveBookProgress();
    } finally { paging = false; }
  }
  function goChapter(index) { if (index >= 0 && index < currentPrepared?.chapters.length) loadChapter(index); }
  function renderPDFContents() {
    const total = pdfDoc.numPages;
    $('#toc-list').innerHTML = Array.from({ length: Math.min(total, 200) }, (_, i) => `<button class="toc-item ${i + 1 === pdfPage ? 'active' : ''}" data-pdf-page="${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span>第 ${i + 1} 页</button>`).join('') + (total > 200 ? '<p class="setting-note">目录显示前 200 页，可通过底部进度条跳转到后续页面。</p>' : '');
    $$('#toc-list [data-pdf-page]').forEach(button => button.addEventListener('click', () => { closeReaderPanels(); turnPDFPage(Number(button.dataset.pdfPage)); }));
  }
  let renderingPDF = false;
  async function renderPDFPage(page) {
    if (!pdfDoc || renderingPDF || page < 1 || page > pdfDoc.numPages) return;
    renderingPDF = true;
    try {
      pdfPage = page; currentChapter = page - 1; const pdfPageObject = await pdfDoc.getPage(page);
      const available = $('#page-clip').clientWidth - 70; const base = pdfPageObject.getViewport({ scale: 1 });
      const scale = Math.max(.1, Math.min((available > 100 ? available : 400) / base.width, 2.2) * preferences.pdfScale / 100);
      const viewport = pdfPageObject.getViewport({ scale }); const ratio = Math.min(window.devicePixelRatio || 1, 2); const canvas = $('#pdf-canvas');
      canvas.width = Math.floor(viewport.width * ratio); canvas.height = Math.floor(viewport.height * ratio); canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
      const context = canvas.getContext('2d'); context.setTransform(ratio, 0, 0, ratio, 0, 0); await pdfPageObject.render({ canvasContext: context, viewport }).promise;
      $('#reader-chapter-name').textContent = `第 ${page} / ${pdfDoc.numPages} 页`; $('#pdf-stage').scrollTop = 0; currentBook.currentPage = page; currentBook.progress = Math.round(page / pdfDoc.numPages * 100); pageIndex = page - 1; pageCount = pdfDoc.numPages; renderPDFContents(); updateReaderProgress(); saveBookProgress();
    } catch (error) { console.error(error); toast('PDF 页面渲染失败', 'error'); }
    finally { renderingPDF = false; }
  }
  async function turnPDFPage(page, animate = true) {
    if (renderingPDF || paging || page < 1 || page > pdfDoc.numPages || page === pdfPage) return;
    paging = true; const old = pdfPage; const direction = page > old ? 'next' : 'prev';
    try {
      if (animate && preferences.animation) await animateSheet(direction);
      await renderPDFPage(page);
    } finally { paging = false; }
  }

  function nextFrame() { return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }
  function paginate(animate = true) {
    if (!currentBook || pdfDoc || $('#book-content').hidden) return;
    const content = $('#book-content'); const style = getComputedStyle(content);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const width = Math.max(content.clientWidth - padding, 1); content.style.columnWidth = `${width}px`;
    pageCount = Math.max(1, Math.ceil(Math.max(0, content.scrollWidth - padding) / width)); pageIndex = Math.max(0, Math.min(pageIndex, pageCount - 1));
    content.style.transition = animate && canAnimate() ? 'transform .48s cubic-bezier(.22,1,.36,1)' : 'none';
    content.style.transform = `translate3d(${-pageIndex * width}px,0,0)`;
    if (currentBook && !currentBook.sample) { currentBook.pageByChapter ||= {}; currentBook.pageByChapter[currentChapter] = pageIndex; }
    updateReaderProgress();
  }
  function prepareSheet(direction) {
    const sheet = $('#turning-sheet'); sheet.className = `turning-sheet active ${direction}`;
    if (pdfDoc) {
      try { sheet.innerHTML = `<img alt="" src="${$('#pdf-canvas').toDataURL('image/png')}" style="width:${$('#pdf-canvas').style.width};height:${$('#pdf-canvas').style.height};object-fit:contain;background:var(--reader-bg);padding:12px">`; } catch { sheet.innerHTML = '<div style="background:var(--reader-bg)"></div>'; }
    } else {
      const clone = $('#book-content').cloneNode(true); clone.removeAttribute('id'); clone.classList.add('turning-content');
      clone.style.transform = 'none'; clone.style.transition = 'none'; sheet.replaceChildren(clone);
    }
    sheet.style.transition = 'none'; sheet.style.transform = 'rotateY(0deg) translateZ(0)'; $('#page-shade').style.opacity = 0;
    return sheet;
  }
  function canAnimate() {
    return preferences.animation && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  async function animatePreparedSheet(sheet, direction) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { sheet.classList.remove('active'); return; }
    sheet.classList.add('turning'); await nextFrame();
    sheet.style.transition = 'transform .62s cubic-bezier(.2,.72,.25,1)'; sheet.style.transform = direction === 'next' ? 'rotateY(-104deg) translateZ(2px)' : 'rotateY(104deg) translateZ(2px)';
    $('#page-shade').style.opacity = .8;
    await new Promise(resolve => setTimeout(resolve, 640));
    sheet.classList.remove('active', 'turning'); sheet.replaceChildren(); $('#page-shade').style.opacity = 0;
  }
  async function animateSheet(direction) {
    const sheet = prepareSheet(direction); await animatePreparedSheet(sheet, direction);
  }
  async function turnPage(direction, animate = true) {
    if (!currentBook || paging || !$('#reader-scrim').hidden) return;
    if (pdfDoc) {
      if (direction === 'next') await turnPDFPage(pdfPage + 1, animate);
      else await turnPDFPage(pdfPage - 1, animate);
      return;
    }
    const motion = animate && canAnimate();
    if (direction === 'next' && pageIndex < pageCount - 1) {
      if (!motion) { pageIndex++; paginate(); updateReaderProgress(); saveBookProgress(); return; }
      paging = true; const sheet = prepareSheet('next'); pageIndex++; paginate(false);
      try { await animatePreparedSheet(sheet, 'next'); } finally { paging = false; updateReaderProgress(); saveBookProgress(); }
    } else if (direction === 'prev' && pageIndex > 0) {
      if (!motion) { pageIndex--; paginate(); updateReaderProgress(); saveBookProgress(); return; }
      paging = true; const sheet = prepareSheet('prev'); pageIndex--; paginate(false);
      try { await animatePreparedSheet(sheet, 'prev'); } finally { paging = false; updateReaderProgress(); saveBookProgress(); }
    } else {
      const targetChapter = currentChapter + (direction === 'next' ? 1 : -1);
      if (targetChapter >= 0 && targetChapter < currentPrepared.chapters.length) {
        if (motion && direction === 'next') await animateSheet('next');
        const previousSheet = motion && direction === 'prev' ? prepareSheet('prev') : null;
        await loadChapter(targetChapter, false);
        if (direction === 'prev') {
          pageIndex = pageCount - 1; paginate();
          if (previousSheet) await animatePreparedSheet(previousSheet, 'prev');
        }
      }
    }
  }
  function updateReaderProgress() {
    if (!currentBook) return;
    if (pdfDoc) currentBook.progress = Math.round(pdfPage / pdfDoc.numPages * 100);
    else {
      const total = currentPrepared?.chapters.length || 1; const chapterRatio = (currentChapter + pageIndex / pageCount) / total;
      currentBook.progress = Math.min(100, Math.round(chapterRatio * 100));
    }
    $('#reader-progress-label').textContent = `${currentBook.progress}%`;
    $('#reader-page-label').textContent = pdfDoc ? `${pdfPage} / ${pdfDoc.numPages}` : `${pageIndex + 1} / ${pageCount}`;
    $('#reader-progress').value = currentBook.progress;
    $('#previous-page').disabled = pdfDoc ? pdfPage <= 1 : currentChapter === 0 && pageIndex === 0;
    $('#next-page').disabled = pdfDoc ? pdfPage >= pdfDoc.numPages : currentChapter === currentPrepared.chapters.length - 1 && pageIndex >= pageCount - 1;
    saveBookProgress();
  }
  function seekProgress(percent) {
    if (!currentBook || paging) return;
    if (pdfDoc) { turnPDFPage(Math.max(1, Math.min(pdfDoc.numPages, Math.ceil(percent / 100 * pdfDoc.numPages)))); return; }
    const total = currentPrepared.chapters.length; const targetChapter = Math.min(total - 1, Math.floor(percent / 100 * total));
    const ratio = percent / 100 * total - targetChapter;
    const apply = () => { pageIndex = Math.max(0, Math.min(pageCount - 1, Math.round(ratio * pageCount))); paginate(false); updateReaderProgress(); saveBookProgress(); };
    if (targetChapter === currentChapter) apply(); else loadChapter(targetChapter, false).then(apply);
  }
  function startReadingTimer() {
    clearInterval(readingTimer); lastTick = Date.now();
    readingTimer = setInterval(() => {
      if (document.hidden || !currentBook) { lastTick = Date.now(); return; }
      const now = Date.now(); sessionMs += now - lastTick; lastTick = now;
      if (sessionMs >= 15000) { flushReadingTime(); renderHome(); renderProfile(); }
    }, 1000);
  }
  function flushReadingTime() {
    if (!currentBook || sessionMs < 1000) return;
    const seconds = Math.floor(sessionMs / 1000); sessionMs %= 1000; currentBook.readingSeconds = (currentBook.readingSeconds || 0) + seconds;
    readingLog[dateKey()] = (readingLog[dateKey()] || 0) + seconds; storage.set('papyrus-reading-log', readingLog); saveBookProgress();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushReadingTime(); lastTick = Date.now(); });
  function addOrRemoveBookmark() {
    if (!currentBook) return;
    const same = bookmarks.filter(item => item.bookId === currentBook.id && item.chapterIndex === currentChapter && (pdfDoc ? item.page === pdfPage : item.page === pageIndex)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (same) { bookmarks = bookmarks.filter(item => item.id !== same.id); toast('已移除此页书签'); }
    else {
      const blocks = $$('#book-content p, #book-content h1, #book-content h2, #book-content blockquote');
      const excerpt = blocks.find(block => { const rect = block.getBoundingClientRect(); return rect.right > 0 && rect.left < innerWidth && rect.bottom > 80 && rect.top < innerHeight - 70; })?.textContent?.trim() || blocks[0]?.textContent?.trim() || `第 ${pdfPage || pageIndex + 1} 页`;
      bookmarks.unshift({ id: `mark-${Date.now()}`, bookId: currentBook.id, title: currentBook.title, format: currentBook.format, chapterIndex: currentChapter, chapterName: pdfDoc ? `第 ${pdfPage} 页` : currentPrepared.chapters[currentChapter]?.title, page: pdfDoc ? pdfPage : pageIndex, excerpt: excerpt.slice(0, 180), progress: currentBook.progress, createdAt: new Date().toISOString() });
      toast('书签已保存');
    }
    storage.set('papyrus-bookmarks', bookmarks); updateBookmarkButton(); $('#bookmark-count').textContent = bookmarks.length;
  }
  function updateBookmarkButton() {
    const marked = currentBook && bookmarks.some(item => item.bookId === currentBook.id && item.chapterIndex === currentChapter && item.page === (pdfDoc ? pdfPage : pageIndex));
    $('#reader-bookmark').classList.toggle('active', !!marked); $('#reader-bookmark').setAttribute('aria-label', marked ? '移除此页书签' : '添加书签');
  }
  function openBookmark(bookmark) { if (!bookmark) return; const book = findBook(bookmark.bookId); if (!book) return toast('这本书已不在书库中', 'error'); openReader(book, { chapter: bookmark.chapterIndex, page: bookmark.page, bookmark }); }

  function resolveNative(kind, raw) {
    let payload; try { payload = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return; }
    const task = pendingNative.get(payload.requestId); if (!task) return; pendingNative.delete(payload.requestId); payload.ok ? task.resolve(payload) : task.reject(new Error(payload.error?.message || '网络请求失败'));
  }
  function nativeRequest(method, args) {
    const requestId = `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pendingNative.delete(requestId); reject(new Error('网络请求超时，请检查网络后重试')); }, 35000);
      pendingNative.set(requestId, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
      try { window.PapyrusAndroid?.[method](...args, requestId); } catch (error) { pendingNative.delete(requestId); clearTimeout(timer); reject(new Error('无法连接书源服务')); }
    });
  }
  async function searchSource(query) {
    const text = query.trim(); if (!text) return;
    const request = ++onlineRequest; $('#source-results').innerHTML = '<div class="loading-state"><span class="spinner"></span><br>正在搜索 Project Gutenberg…</div>'; $('#source-results-title').textContent = '正在找书'; $('#source-result-count').textContent = '';
    try {
      let payload;
      if (window.PapyrusAndroid?.searchBooks) payload = await nativeRequest('searchBooks', [text]);
      else {
        const response = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(text)}`, { signal: AbortSignal.timeout(20000) });
        if (!response.ok) throw new Error(`书源暂时不可用（${response.status}）`);
        const data = await response.json();
        payload = { ok: true, results: data.results.map(book => ({ id: book.id, title: book.title, author: book.authors?.[0]?.name || '未知作者', summary: book.subjects?.slice(0, 2).join(' · ') || '', languages: book.languages, downloads: book.download_count, formats: { epub: book.formats?.['application/epub+zip'], txt: book.formats?.['text/plain; charset=utf-8'] || book.formats?.['text/plain'], html: book.formats?.['text/html'], image: book.formats?.['image/jpeg'] }, sourceUrl: `https://www.gutenberg.org/ebooks/${book.id}` })) };
      }
      if (request !== onlineRequest) return;
      renderSourceResults(payload.results || []);
    } catch (error) { if (request !== onlineRequest) return; renderSourceError(error.message); }
  }
  function renderSourceError(message) {
    $('#source-results-title').textContent = '搜索未完成'; $('#source-results').innerHTML = `<div class="source-placeholder"><span>${icon('globe')}</span><h3>暂时无法连接书源</h3><p>${escapeHTML(message)}</p><button class="secondary-button" id="retry-source-search">重新搜索</button></div>`;
    $('#retry-source-search').addEventListener('click', () => searchSource($('#source-query').value));
  }
  function renderSourceResults(results) {
    $('#source-results-title').textContent = '搜索结果'; $('#source-result-count').textContent = `${results.length} 本`;
    if (!results.length) { $('#source-results').innerHTML = '<div class="source-placeholder"><h3>没有找到匹配的书</h3><p>试试更短的书名或作者名。书源主要收录英文公版作品。</p></div>'; return; }
    $('#source-results').innerHTML = `<div class="online-grid">${results.map(book => {
      const epub = book.formats?.epub; const txt = book.formats?.txt; const html = book.formats?.html;
      return `<article class="online-card">${coverHTML({ ...book, id: `source-${book.id}`, format: epub ? 'EPUB' : txt ? 'TXT' : 'HTML', palette: paletteFor(book.title) })}<div class="online-info"><h3>${escapeHTML(book.title)}</h3><p class="online-author">${escapeHTML(book.author)}</p><p class="online-summary">${escapeHTML(book.summary || (book.languages?.includes('en') ? '英文公版 · Project Gutenberg' : 'Project Gutenberg'))}</p><div class="online-actions"><button data-download-book="${book.id}" data-format="epub" ${epub ? '' : 'hidden'}>${icon('download')}EPUB</button><button data-download-book="${book.id}" data-format="txt" ${!epub && txt ? '' : txt ? 'class="secondary"' : 'hidden'}>${icon('download')}TXT</button>${!epub && !txt && html ? `<button data-download-book="${book.id}" data-format="html">${icon('download')}HTML</button>` : ''}</div></div></article>`;
    }).join('')}</div>`;
    $$('[data-download-book]').forEach(button => button.addEventListener('click', () => downloadSourceBook(results.find(item => String(item.id) === button.dataset.downloadBook), button.dataset.format, button)));
  }
  async function downloadSourceBook(book, format, button) {
    if (!book || !book.formats?.[format]) return;
    const original = button.innerHTML; button.disabled = true; button.textContent = '下载中…';
    try {
      const url = book.formats[format]; const extension = format === 'epub' ? 'epub' : format === 'txt' ? 'txt' : 'html';
      const filename = `${String(book.title).replace(/[\\/:*?"<>|]/g, '_').slice(0, 80)}.${extension}`;
      let blob;
      if (window.PapyrusAndroid?.downloadBook) {
        const payload = await nativeRequest('downloadBook', [url, filename]);
        const binary = atob(payload.base64); const bytes = new Uint8Array(binary.length); for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        blob = new Blob([bytes], { type: payload.mime });
      } else {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!response.ok) throw new Error(`下载失败（${response.status}）`); blob = await response.blob();
      }
      const file = new File([blob], filename, { type: blob.type, lastModified: Date.now() });
      await buildBookRecord(file, { title: book.title, author: book.author, source: 'gutenberg', palette: paletteFor(book.title) });
      refreshAll(); toast(`《${book.title}》已加入书架`); button.innerHTML = `${icon('check')}已加入`; setTimeout(() => { button.disabled = false; button.innerHTML = original; }, 1800);
    } catch (error) { toast(error.message || '下载失败，请稍后重试', 'error'); button.disabled = false; button.innerHTML = original; }
  }

  async function updateStorageInfo() {
    const size = importedBooks.reduce((sum, book) => sum + (book.fileSize || 0), 0); let label = `${importedBooks.length} 个本地文件 · ${formatBytes(size)}`;
    if (navigator.storage?.estimate) try { const estimate = await navigator.storage.estimate(); label += ` · 可用 ${formatBytes(Math.max(0, estimate.quota - estimate.usage))}`; } catch {}
    $('#profile-storage').textContent = label;
  }
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const bytes = new Uint8Array(reader.result); let binary = ''; for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768)); resolve(btoa(binary)); }; reader.onerror = () => reject(reader.error); reader.readAsArrayBuffer(blob); });
  }
  function exportData() {
    const data = { app: 'papyrus-book', version: 1, exportedAt: new Date().toISOString(), books: importedBooks.map(({ palette, ...book }) => book), bookmarks, readingLog, preferences };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const name = `papyrus-book-${dateKey()}.json`;
    if (window.PapyrusAndroid?.saveFile) blobToBase64(blob).then(encoded => window.PapyrusAndroid.saveFile(name, encoded, blob.type)).catch(() => toast('导出失败，请重试', 'error'));
    else { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('阅读记录已导出'); }
  }

  /* Delegated app events */
  document.addEventListener('click', event => {
    const importButton = event.target.closest('[data-import]'); if (importButton) { $('#file-input').value = ''; openModal('import-modal'); }
    const viewButton = event.target.closest('[data-view]'); if (viewButton) setView(viewButton.dataset.view);
  });
  $$('[data-close-modal]').forEach(button => button.addEventListener('click', closeModals));
  $$('.modal-backdrop').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModals(); }));
  $('#drop-zone').addEventListener('click', () => $('#file-input').click());
  $('#file-input').addEventListener('change', event => importFiles(event.target.files));
  $('#open-source-search').addEventListener('click', () => { setView('library'); setLibraryMode('online'); });
  $('#discover-source').addEventListener('click', () => { setView('library'); setLibraryMode('online'); });
  $$('[data-library-mode]').forEach(button => button.addEventListener('click', () => setLibraryMode(button.dataset.libraryMode)));
  $('#local-search').addEventListener('input', renderLibrary); $('#clear-local-search').addEventListener('click', () => { $('#local-search').value = ''; renderLibrary(); });
  $$('#library-filters [data-filter]').forEach(button => button.addEventListener('click', () => { currentFilter = button.dataset.filter; $$('#library-filters button').forEach(item => item.classList.toggle('active', item === button)); renderLibrary(); }));
  $('#source-search-form').addEventListener('submit', event => { event.preventDefault(); searchSource($('#source-query').value); });
  $$('[data-source-query]').forEach(button => button.addEventListener('click', () => { $('#source-query').value = button.dataset.sourceQuery; searchSource(button.dataset.sourceQuery); }));
  $('#profile-settings').addEventListener('click', () => openModal('preferences-modal'));
  $('#open-bookmarks').addEventListener('click', () => setView('bookmarks'));
  $('#profile-goal').addEventListener('click', () => { selectedGoal = preferences.dailyGoal; $$('[data-goal]').forEach(button => button.classList.toggle('active', Number(button.dataset.goal) === selectedGoal)); openModal('goal-modal'); });
  $$('[data-goal]').forEach(button => button.addEventListener('click', () => { selectedGoal = Number(button.dataset.goal); $$('[data-goal]').forEach(item => item.classList.toggle('active', item === button)); }));
  $('#save-goal').addEventListener('click', () => { preferences.dailyGoal = selectedGoal; storage.set('papyrus-preferences', preferences); closeModals(); renderProfile(); toast('每日目标已更新'); });
  $('#default-theme').addEventListener('change', event => { preferences.readerTheme = event.target.value; applyReaderPreferences(); });
  $('#default-animation').addEventListener('change', event => { preferences.animation = event.target.value === 'true'; applyReaderPreferences(); });
  $('#profile-export').addEventListener('click', exportData); $('#export-data').addEventListener('click', exportData);
  $('#reset-stats').addEventListener('click', () => { if (!confirm('确定清空全部阅读时长记录吗？藏书和书签不会受到影响。')) return; readingLog = {}; importedBooks.forEach(book => { book.readingSeconds = 0; }); storage.set('papyrus-reading-log', readingLog); saveImportedBooks(); renderProfile(); renderHome(); toast('阅读时长记录已清空'); });

  /* Reader events */
  $('#reader-back').addEventListener('click', closeReader); $('#previous-page').addEventListener('click', () => turnPage('prev')); $('#next-page').addEventListener('click', () => turnPage('next'));
  $('#tap-left').addEventListener('click', () => { if (suppressTap) { suppressTap = false; return; } turnPage('prev'); }); $('#tap-right').addEventListener('click', () => { if (suppressTap) { suppressTap = false; return; } turnPage('next'); });
  $('#reader-progress').addEventListener('change', event => seekProgress(Number(event.target.value)));
  $('#toc-open').addEventListener('click', () => openReaderPanel('toc-panel')); $('#reader-more').addEventListener('click', () => openReaderPanel('reader-settings-panel'));
  $('#reader-scrim').addEventListener('click', closeReaderPanels); $$('[data-close-reader-panel]').forEach(button => button.addEventListener('click', closeReaderPanels));
  $('#reader-bookmark').addEventListener('click', addOrRemoveBookmark);
  $('#reader-theme-toggle').addEventListener('click', () => { preferences.readerTheme = preferences.readerTheme === 'dark' ? 'light' : preferences.readerTheme === 'light' ? 'sepia' : 'dark'; applyReaderPreferences(); paginate(false); });
  $('#reader-fullscreen').addEventListener('click', async () => {
    if (window.PapyrusAndroid?.setFullscreen) {
      const enabled = $('#reader-view').dataset.fullscreen !== 'true';
      window.PapyrusAndroid.setFullscreen(enabled); return;
    }
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('#reader-view').requestFullscreen(); } catch { toast('当前设备不支持全屏模式', 'error'); }
  });
  $('#font-size-range').addEventListener('input', event => { preferences.fontSize = Number(event.target.value); applyReaderPreferences(); });
  $$('#line-height-options button').forEach(button => button.addEventListener('click', () => { preferences.lineHeight = Number(button.dataset.lineHeight); applyReaderPreferences(); paginate(false); }));
  $('#animation-enabled').addEventListener('click', () => { preferences.animation = true; applyReaderPreferences(); }); $('#animation-disabled').addEventListener('click', () => { preferences.animation = false; applyReaderPreferences(); });
  $$('[data-reader-theme]').forEach(button => button.addEventListener('click', () => { preferences.readerTheme = button.dataset.readerTheme; applyReaderPreferences(); paginate(false); }));
  document.addEventListener('keydown', event => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable;
    if (event.key === 'Escape') { if ($$('.modal-backdrop').some(modal => !modal.hidden)) closeModals(); else if (!$('#reader-view').hidden) { if (!$('#reader-scrim').hidden) closeReaderPanels(); else closeReader(); } return; }
    if (!$('#reader-view').hidden && !typing) { if (event.key === 'ArrowLeft') turnPage('prev'); if (event.key === 'ArrowRight') turnPage('next'); if (event.key === ' ') { event.preventDefault(); $('#reader-view').classList.toggle('chrome-hidden'); } }
  });
  $('#page-clip').addEventListener('click', event => {
    if (suppressTap) { suppressTap = false; return; }
    if (event.target.closest('#turning-sheet')) return;
    const rect = event.currentTarget.getBoundingClientRect(); const x = event.clientX - rect.left;
    if (x > rect.width * .32 && x < rect.width * .68) $('#reader-view').classList.toggle('chrome-hidden');
  });

  /* Horizontal page-curl drag with tap and button alternatives */
  let drag = null;
  let suppressTap = false;
  const readerStage = $('#reader-stage');
  readerStage.addEventListener('pointerdown', event => {
    if (
      !currentBook ||
      paging ||
      !event.target.closest('#page-clip, .tap-zone') ||
      event.pointerType === 'mouse' && event.button !== 0
    ) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag = { x: event.clientX, y: event.clientY, axis: null, sheet: null, direction: null, lastX: event.clientX };
  });
  readerStage.addEventListener('pointermove', event => {
    if (!drag) return;
    drag.lastX = event.clientX;
    const dx = event.clientX - drag.x; const dy = event.clientY - drag.y;
    if (!drag.axis && Math.hypot(dx, dy) > 9) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (drag.axis !== 'x') return;
    suppressTap = true;
    const direction = dx < 0 ? 'next' : 'prev'; if (drag.direction !== direction) { if (drag.sheet) drag.sheet.classList.remove('active'); drag.sheet = preferences.animation ? prepareSheet(direction) : null; drag.direction = direction; }
    if (!drag.sheet) return;
    const progress = Math.min(Math.abs(dx) / ($('#page-clip').clientWidth * .55), 1); const angle = progress * 85 * (direction === 'next' ? -1 : 1);
    drag.sheet.classList.add('turning'); drag.sheet.style.transition = 'none'; drag.sheet.style.transform = `rotateY(${angle}deg) translateZ(1px)`; $('#page-shade').style.opacity = progress * .8;
  });
  async function endDrag(cancel = false) {
    if (!drag) return; const completed = drag; drag = null;
    if (completed.axis !== 'x' || !completed.direction) { if (completed.sheet) completed.sheet.classList.remove('active'); return; }
    const moved = Math.abs(completed.lastX - completed.x); const shouldTurn = !cancel && moved > $('#page-clip').clientWidth * .16;
    if (!shouldTurn) { if (completed.sheet) { completed.sheet.style.transition = 'transform .3s cubic-bezier(.22,1,.36,1)'; completed.sheet.style.transform = 'rotateY(0deg)'; await new Promise(resolve => setTimeout(resolve, 310)); completed.sheet.classList.remove('active', 'turning'); completed.sheet.replaceChildren(); } $('#page-shade').style.opacity = 0; return; }
    if (completed.sheet) { completed.sheet.style.transition = 'transform .3s cubic-bezier(.22,1,.36,1)'; completed.sheet.style.transform = `rotateY(${completed.direction === 'next' ? -104 : 104}deg)`; await new Promise(resolve => setTimeout(resolve, 310)); completed.sheet.classList.remove('active', 'turning'); completed.sheet.replaceChildren(); }
    $('#page-shade').style.opacity = 0; turnPage(completed.direction, false);
  }
  readerStage.addEventListener('pointerup', () => endDrag());
  readerStage.addEventListener('pointercancel', () => endDrag(true));
  window.addEventListener('resize', () => { if (pdfDoc && !renderingPDF) renderPDFPage(pdfPage); else if (currentBook && !paging) paginate(false); });
  window.addEventListener('beforeunload', flushReadingTime);
  window.PapyrusBack = () => { const handled = $$('.modal-backdrop').some(modal => !modal.hidden) || !$('#reader-view').hidden; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return handled; };

  applyReaderPreferences(); refreshAll();
})();
