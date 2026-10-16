/* ============================================================
   8 号楼 · 连续对打纪录榜
   ------------------------------------------------------------
   自包含脚本, 不依赖 js/script.js。

   两个榜, 由记录上的 cat 字段区分:
     hr = 人 对 机器人
     rr = 机器人 对 机器人
   大屏(16:9 看板)上两个榜叠在一起, 每 B8_ROTATE_MS 轮换一个;
   窄屏/竖屏两个榜都显示, 不轮播。

   存储：浏览器 localStorage, 键 B8_KEY, 两个榜存在同一个数组里。
   这个页面设计给 8 号楼现场的一台固定设备使用, 所以"同一台设备上
   的所有人共用一份榜"正是想要的效果, 不需要后端。

   代价：清浏览器数据会丢记录。因此提供导出/导入 JSON,
   导出的文件可以直接提交进仓库做备份。
   ============================================================ */

const B8_KEY = 'b8_rally_records_v1';
const B8_SCHEMA = 2;          // 2: 记录新增 cat 字段(hr/rr)

/* ---------- 两个榜 ---------- */
const B8_CATS = [
    { id: 'hr', zh: '人 VS 机器人',       en: 'Human VS Robot' },
    { id: 'rr', zh: '机器人 VS 机器人',   en: 'Robot VS Robot' }
];

function b8CatById(id) {
    return B8_CATS.find(c => c.id === id) || B8_CATS[0];
}

/* ---------- 头像清单 ---------- */
// 校徽取自 HOPE 页的参赛高校区块, 复用同一批文件。
// 两个榜共用同一份清单: 机器人对打的参赛主体也是这些高校与机构。
const B8_AVATARS = {
    defaults: [
        { id: 'man',   src: 'images/avatars/man.svg',   zh: '男生',   en: 'Young man' },
        { id: 'woman', src: 'images/avatars/woman.svg', zh: '女生',   en: 'Young woman' },
        { id: 'child', src: 'images/avatars/child.svg', zh: '小孩',   en: 'Child' },
        { id: 'adult', src: 'images/avatars/adult.svg', zh: '中年人', en: 'Adult' }
    ],
    unis: [
        { id: 'pku',        src: 'images/unis/pku.png',        zh: '北京大学',               en: 'Peking University' },
        { id: 'tsinghua',   src: 'images/unis/tsinghua.png',   zh: '清华大学',               en: 'Tsinghua University' },
        { id: 'sjtu',       src: 'images/unis/sjtu.png',       zh: '上海交通大学',           en: 'Shanghai Jiao Tong University' },
        { id: 'fudan',      src: 'images/unis/fudan.png',      zh: '复旦大学',               en: 'Fudan University' },
        { id: 'ustc',       src: 'images/unis/ustc.png',       zh: '中国科学技术大学',       en: 'USTC' },
        { id: 'hku',        src: 'images/unis/hku.png',        zh: '香港大学',               en: 'University of Hong Kong' },
        { id: 'szu',        src: 'images/unis/szu.png',        zh: '深圳大学',               en: 'Shenzhen University' },
        { id: 'bistu',      src: 'images/unis/bistu.png',      zh: '北京信息科技大学',       en: 'BISTU' },
        { id: 'ucberkeley', src: 'images/unis/ucberkeley.png', zh: '加州大学伯克利分校',     en: 'UC Berkeley' },
        { id: 'baai',       src: 'images/unis/baai.png',       zh: '智源研究院 BAAI',        en: 'BAAI' },
        { id: 'sii',        src: 'images/unis/sii.png',        zh: '上海创智学院',           en: 'Shanghai Innovation Institute' },
        { id: 'teleai',     src: 'images/unis/teleai.png',     zh: '中国电信人工智能研究院', en: 'TeleAI, China Telecom' }
    ]
};

function b8AllAvatars() {
    return B8_AVATARS.defaults.concat(B8_AVATARS.unis);
}

function b8AvatarById(id) {
    return b8AllAvatars().find(a => a.id === id) || B8_AVATARS.defaults[0];
}

/* ---------- 首次打开时的示例数据 ----------
   localStorage 是按设备存的, 所以不写进代码的话, 换一台机器就是空榜。
   这批 demo 数据只在「从未存过任何东西」时注入一次; 之后的增删改都以
   实际存储为准, 不会再覆盖。
   每条带 demo: true, 正式启用时清掉示例只要在控制台跑:
       b8ClearDemo()
   想在已经录过数据的设备上补回示例, 则跑:
       b8LoadDemo()
   ------------------------------------------------------------ */
const B8_SEED = [
    // 人 对 机器人
    ['hr', '王同学',   'tsinghua',   87, '2026-10-02'],
    ['hr', '李研究员', 'baai',       74, '2026-10-02'],
    ['hr', '小朋友',   'child',      56, '2026-10-01'],
    ['hr', 'Alice',    'ucberkeley', 56, '2026-10-03'],
    ['hr', '张老师',   'adult',      41, '2026-10-04'],
    ['hr', '陈同学',   'woman',      38, '2026-10-05'],
    ['hr', '刘工',     'sjtu',       33, '2026-10-05'],
    ['hr', '周同学',   'fudan',      29, '2026-10-03'],
    ['hr', 'Kevin',    'hku',        24, '2026-10-04'],
    ['hr', '赵老师',   'man',        17, '2026-10-06'],
    // 机器人 对 机器人。两台机器互打能稳定得多, 拍数量级明显高于人机。
    ['rr', '北大智源联合战队',  'baai',       412, '2026-10-02'],
    ['rr', '清华 iPingPong',    'tsinghua',   366, '2026-10-03'],
    ['rr', '上交大创智联队',    'sjtu',       291, '2026-10-04'],
    ['rr', '港大 SMASH',        'hku',        248, '2026-10-01'],
    ['rr', '复旦若客',          'fudan',      197, '2026-10-05'],
    ['rr', '深大战队',          'szu',        154, '2026-10-05'],
    ['rr', '中科大蓝鲸',        'ustc',       132, '2026-10-06'],
    ['rr', 'TeleAI 人形',       'teleai',      96, '2026-10-06']
].map(([cat, name, avatar, rallies, date], i) => ({
    // id 带上分类前缀。早期版本用纯位置序号(seed0/seed1...), 一旦重排示例
    // 列表, 同一个 id 的含义就变了, 按 id 去重会误判成「已存在」而漏掉条目。
    id: `seed-${cat}-${i}`, cat, name, avatar, rallies, date, demo: true
}));

// 把示例数据补回榜上, 不碰已有的真实纪录。
// 用于设备上已经存过数据(所以首次注入没触发)但仍想看到示例的情况。
function b8LoadDemo() {
    // 整组替换, 不做按 id 的增量补差: 示例列表一旦调整(增删、改分类、重排),
    // 增量补差就会和设备上残留的旧示例对不上。先丢掉所有旧示例, 再装入
    // 当前这一版, 真实纪录(demo 非 true)一条不动。重复执行结果一致。
    const real = b8Records.filter(r => !r.demo);
    const dropped = b8Records.length - real.length;
    b8Records = real.concat(B8_SEED.map(r => Object.assign({}, r)));
    b8Save();
    b8Render();
    console.log(`[building8] 清掉旧示例 ${dropped} 条, 装入 ${B8_SEED.length} 条, 保留真实纪录 ${real.length} 条`);
}

// 清掉示例数据, 保留真实纪录。正式启用前在控制台跑一次即可。
function b8ClearDemo() {
    const before = b8Records.length;
    b8Records = b8Records.filter(r => !r.demo);
    b8Save();
    b8Render();
    console.log(`[building8] 已清掉 ${before - b8Records.length} 条示例, 剩余 ${b8Records.length} 条`);
}

/* ---------- 文案 ---------- */
const B8_T = {
    addTitle:    { zh: '添加纪录',   en: 'Add a record' },
    editTitle:   { zh: '修改纪录',   en: 'Edit record' },
    edit:        { zh: '修改',       en: 'Edit' },
    del:         { zh: '删除',       en: 'Delete' },
    rallies:     { zh: '拍',         en: 'RALLIES' },
    emptyHr:     { zh: '还没有纪录。点「添加纪录」开始。', en: 'No records yet. Tap “Add a record” to start.' },
    emptyRr:     { zh: '还没有纪录。点「添加纪录」开始。', en: 'No records yet. Tap “Add a record” to start.' },
    errName:     { zh: '请填写名字。', en: 'Please enter a name.' },
    errScore:    { zh: '请填写 1 以上的整数拍数。', en: 'Please enter a whole number of 1 or more.' },
    errAvatar:   { zh: '请选择一个头像。', en: 'Please pick an avatar.' },
    confirmDel:  { zh: '删除这条纪录？', en: 'Delete this record?' },
    groupDefault:{ zh: '通用头像',   en: 'General' },
    groupUni:    { zh: '高校与机构', en: 'Institutions' },
    importBad:   { zh: '文件格式不对，导入取消。', en: 'Unrecognised file. Import cancelled.' },
    importOk:    { zh: '已导入 {n} 条纪录。',  en: 'Imported {n} records.' },
    importAsk:   { zh: '导入会覆盖当前 {cur} 条纪录，替换为文件里的 {n} 条。继续？',
                   en: 'Importing replaces the current {cur} records with {n} from the file. Continue?' },
    count:       { zh: '共 {n} 条',  en: '{n} records' },
    nameLabelHr: { zh: '名字',       en: 'Name' },
    nameLabelRr: { zh: '战队 / 机器人', en: 'Team / robot' },
    namePhHr:    { zh: '怎么称呼你',   en: 'What should we call you' },
    namePhRr:    { zh: '例如 清华 iPingPong', en: 'e.g. Tsinghua iPingPong' },
    settings:    { zh: '设置',       en: 'Settings' }
};

let b8Lang = 'zh';
let b8Records = [];
let b8EditingId = null;
let b8EditingCat = 'hr';
let b8PickedAvatar = null;

function t(key) {
    const v = B8_T[key];
    return v ? (v[b8Lang] || v.en) : key;
}

/* ---------- 存储 ---------- */
function b8Load() {
    try {
        const raw = localStorage.getItem(B8_KEY);
        // 从未存过任何东西 = 第一次打开这台设备, 注入示例数据。
        // 存过但为空数组(用户主动删光了)则尊重其为空, 不再塞回示例。
        if (raw === null) return B8_SEED.map(r => Object.assign({}, r));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : parsed.records;
        // schema 1 的老记录没有 cat 字段。当时只有一个榜, 内容就是人机对打,
        // 所以一律归到 hr, 不要丢数据。
        return Array.isArray(list) ? list.filter(b8Valid).map(b8Normalise) : [];
    } catch (e) {
        console.warn('[building8] 读取本地纪录失败，按空榜处理', e);
        return [];
    }
}

function b8Normalise(r) {
    return Object.assign({}, r, { cat: r.cat === 'rr' ? 'rr' : 'hr' });
}

function b8Save() {
    try {
        localStorage.setItem(B8_KEY, JSON.stringify({
            schema: B8_SCHEMA,
            savedAt: new Date().toISOString(),
            records: b8Records
        }));
    } catch (e) {
        // 隐私模式或配额满：告诉用户, 不要静默丢数据
        console.error('[building8] 写入失败', e);
        alert(b8Lang === 'zh'
            ? '保存失败，浏览器拒绝写入本地存储。请先导出备份。'
            : 'Save failed: the browser refused local storage. Please export a backup.');
    }
}

function b8Valid(r) {
    return r && typeof r.name === 'string' && r.name.trim() !== ''
        && Number.isFinite(Number(r.rallies)) && Number(r.rallies) >= 1;
}

/* ---------- 排序 ---------- */
// 按榜筛选; 拍数降序; 同拍数时先达成的排前面。
function b8Sorted(cat) {
    return b8Records.filter(r => r.cat === cat).sort((a, b) => {
        const d = Number(b.rallies) - Number(a.rallies);
        return d !== 0 ? d : String(a.date || '').localeCompare(String(b.date || ''));
    });
}

/* ---------- 渲染 ---------- */
function b8Render() {
    B8_CATS.forEach(c => b8RenderBoard(c.id));
}

function b8RenderBoard(cat) {
    const list = document.getElementById('b8List-' + cat);
    const counter = document.getElementById('b8Count-' + cat);
    if (!list) return;

    const rows = b8Sorted(cat);
    if (counter) counter.textContent = rows.length ? t('count').replace('{n}', rows.length) : '';

    if (rows.length === 0) {
        const key = cat === 'rr' ? 'emptyRr' : 'emptyHr';
        list.innerHTML = `<li class="b8-empty">${b8Esc(t(key))}</li>`;
        b8UpdateOverflow(cat);
        return;
    }

    list.innerHTML = rows.map((r, i) => {
        const av = b8AvatarById(r.avatar);
        const label = av[b8Lang] || av.en;
        return `
        <li class="b8-row${i < 3 ? ' b8-row-top' : ''}">
            <span class="b8-rank">${i + 1}</span>
            <img class="b8-avatar" src="${av.src}" alt="${b8Esc(label)}" title="${b8Esc(label)}">
            <span class="b8-name">${b8Esc(r.name)}<span class="b8-date">${b8Esc(r.date || '')}</span></span>
            <span class="b8-score">${Number(r.rallies)}<small>${b8Esc(t('rallies'))}</small></span>
            <span class="b8-row-actions">
                <button type="button" class="b8-icon-btn" onclick="b8OpenForm('${r.id}')">${b8Esc(t('edit'))}</button>
                <button type="button" class="b8-icon-btn b8-danger" onclick="b8Delete('${r.id}')">${b8Esc(t('del'))}</button>
            </span>
        </li>`;
    }).join('');

    b8UpdateOverflow(cat);
}

// 该榜是否溢出一屏, 决定底部渐隐是否出现
function b8UpdateOverflow(cat) {
    const cats = cat ? [cat] : B8_CATS.map(c => c.id);
    cats.forEach(id => {
        const list = document.getElementById('b8List-' + id);
        const board = list && list.closest('.b8-board');
        if (!list || !board) return;
        board.classList.toggle('has-more', list.scrollHeight > list.clientHeight + 2);
    });
}

/* ============================================================
   轮播
   ------------------------------------------------------------
   大屏上一次只显示一个榜, 每 B8_ROTATE_MS 换一次。
   换成单榜是为了把行高和字号放大一档(远处看得清), 并在左右留出
   背景空间; 代价是任一时刻只有一半信息在屏上, 所以下面这些情况
   必须停表, 否则会从人手里把控制权抢走:
     modal  表单开着 —— 不停表的话填到一半底下的榜就换了
     menu   设置菜单开着
     hover  鼠标在榜上(有人正在看/正要点修改)
     scroll 榜内正在滚动(触屏现场没有 hover, 靠这个兜住)
     hidden 页面切到后台
   停表用「剩余时间」记账而不是重新计时, 所以鼠标划过一下不会把
   刚走了 7 秒的那一轮重置回 8 秒。
   ============================================================ */

// 轮播一轮的时长。这是唯一的真值来源, CSS 里那条进度动画的时长
// 由下面 b8RotInit() 写进 --b8-rotate, 不要去改 CSS 里的兜底值。
const B8_ROTATE_MS = 8000;

// 必须和 building8.css 里「16:9 / 横向大屏」那个断点逐字一致。
// 不一致就会出现布局在轮播而脚本不转, 或者反过来。
const B8_ROTATE_MQ = '(min-width: 1000px) and (min-height: 560px) and (min-aspect-ratio: 3/2)';

let b8ActiveCat = B8_CATS[0].id;
let b8RotMq = null;
let b8RotTimer = null;
let b8RotRemaining = B8_ROTATE_MS;
let b8RotDeadline = 0;
const b8RotHolds = new Set();

function b8Rotating() {
    return !!(b8RotMq && b8RotMq.matches);
}

function b8RenderRotator() {
    const nav = document.getElementById('b8Rotator');
    if (!nav) return;
    nav.setAttribute('aria-label', nav.getAttribute('data-' + b8Lang + '-label') || '');
    nav.innerHTML = B8_CATS.map(c => `
        <button type="button" class="b8-dot" role="tab" data-dot="${c.id}"
                aria-selected="${c.id === b8ActiveCat}"
                onclick="b8PickBoard('${c.id}')"><span class="b8-dot-fill"></span><span>${b8Esc(c[b8Lang] || c.en)}</span></button>`
    ).join('');
}

// 点指示条: 立刻切到那个榜, 并把这一轮重新计满 ——
// 手动切过去的人需要完整的 8 秒, 而不是接着上一轮的残余。
function b8PickBoard(cat) {
    b8ShowBoard(cat, true);
}

function b8ShowBoard(cat, restart) {
    b8ActiveCat = b8CatById(cat).id;

    document.querySelectorAll('.b8-board').forEach(board => {
        const on = board.dataset.cat === b8ActiveCat;
        // 窄屏不轮播, 两个榜都要可见可用, 所以把 aria-hidden 清回 false
        const hide = b8Rotating() && !on;
        board.setAttribute('aria-hidden', String(hide));
        // 隐起来的那个榜只是透明, 按钮仍在 tab 序列里。inert 把它整块
        // 从焦点和点击里摘掉; 老浏览器不支持这个属性, 退化成仅 aria-hidden,
        // 配合 CSS 的 pointer-events:none 也不会被误点。
        if ('inert' in HTMLElement.prototype) board.inert = hide;
    });

    document.querySelectorAll('#b8Rotator .b8-dot').forEach(dot => {
        const on = dot.dataset.dot === b8ActiveCat;
        dot.setAttribute('aria-selected', String(on));
        // 重建进度条元素以重启动画。同一个元素上改 class 不会让
        // 已经跑完的 animation 重头来, 换个新元素最省事。
        if (on) {
            const fill = dot.querySelector('.b8-dot-fill');
            if (fill) fill.replaceWith(fill.cloneNode(false));
        }
    });

    if (restart !== false) b8RotRemaining = B8_ROTATE_MS;
    b8RotSchedule();
}

function b8RotNext() {
    const i = B8_CATS.findIndex(c => c.id === b8ActiveCat);
    b8ShowBoard(B8_CATS[(i + 1) % B8_CATS.length].id, true);
}

function b8RotSchedule() {
    clearTimeout(b8RotTimer);
    b8RotTimer = null;
    const nav = document.getElementById('b8Rotator');
    const paused = b8RotHolds.size > 0;
    if (nav) nav.classList.toggle('is-paused', paused);
    if (!b8Rotating() || paused) return;
    b8RotDeadline = Date.now() + b8RotRemaining;
    b8RotTimer = setTimeout(b8RotNext, b8RotRemaining);
}

function b8RotHold(reason) {
    if (b8RotHolds.has(reason)) return;
    // 第一个 hold 落下时把走剩的时间记下来, 之后再叠 hold 不要重复记
    if (b8RotHolds.size === 0 && b8RotTimer) {
        b8RotRemaining = Math.max(400, b8RotDeadline - Date.now());
    }
    b8RotHolds.add(reason);
    b8RotSchedule();
}

function b8RotRelease(reason) {
    if (!b8RotHolds.delete(reason)) return;
    b8RotSchedule();
}

function b8RotInit() {
    // 让 CSS 的进度动画与这里的计时共用一个时长
    document.documentElement.style.setProperty('--b8-rotate', (B8_ROTATE_MS / 1000) + 's');

    b8RotMq = window.matchMedia(B8_ROTATE_MQ);
    const onChange = () => b8ShowBoard(b8ActiveCat, true);
    if (b8RotMq.addEventListener) b8RotMq.addEventListener('change', onChange);
    else b8RotMq.addListener(onChange);          // 老 Safari

    b8RenderRotator();
    b8ShowBoard(b8ActiveCat, true);

    // 鼠标在榜上或在指示条上就停表。两个元素之间移动时会先 leave 再 enter,
    // 所以 leave 后延一帧再看是不是两个都不在 hover 上, 免得闪一下。
    const zones = [document.querySelector('.b8-boards'), document.getElementById('b8Rotator')];
    zones.forEach(el => {
        if (!el) return;
        el.addEventListener('pointerenter', () => b8RotHold('hover'));
        el.addEventListener('pointerleave', () => setTimeout(() => {
            const still = zones.some(z => z && z.matches(':hover'));
            if (!still) b8RotRelease('hover');
        }, 0));
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) b8RotHold('hidden');
        else b8RotRelease('hidden');
    });
}

/* ---------- 背景视频 ---------- */
// 关掉时 CSS 会把这一层 display:none, 浏览器随即停止解码;
// 这里再显式 pause() 一次, 不依赖那个副作用。
// 现场设备是长时间开着的, 给个关的口子不是多余功能。
const B8_VIDEO_KEY = 'b8_video';

function b8VideoOn() {
    return document.documentElement.classList.contains('b8-video-on');
}

function b8SetVideo(mode) {
    const on = mode === 'on';
    document.documentElement.classList.toggle('b8-video-on', on);
    try { localStorage.setItem(B8_VIDEO_KEY, on ? 'on' : 'off'); } catch (e) { /* 隐私模式 */ }

    const v = document.querySelector('.b8-bg video');
    if (v) {
        if (on) { const r = v.play(); if (r && r.catch) r.catch(() => { /* 被拦就留 poster */ }); }
        else v.pause();
    }
    b8SyncVideoButtons();
}

function b8SyncVideoButtons() {
    const now = b8VideoOn() ? 'on' : 'off';
    document.querySelectorAll('[data-video-opt]').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.videoOpt === now));
    });
}

function b8Esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- 头像选择器 ---------- */
function b8RenderPicker() {
    const groups = [
        { label: t('groupDefault'), items: B8_AVATARS.defaults },
        { label: t('groupUni'),     items: B8_AVATARS.unis }
    ];
    document.getElementById('b8Picker').innerHTML = groups.map(g => `
        <div class="b8-picker-group">
            <span>${b8Esc(g.label)}</span>
            <div class="b8-picker">
                ${g.items.map(a => {
                    const label = a[b8Lang] || a.en;
                    return `<button type="button" class="b8-pick" data-avatar="${a.id}"
                             aria-pressed="${a.id === b8PickedAvatar}" title="${b8Esc(label)}"
                             onclick="b8PickAvatar('${a.id}')"><img src="${a.src}" alt="${b8Esc(label)}"></button>`;
                }).join('')}
            </div>
        </div>`).join('');
}

function b8PickAvatar(id) {
    b8PickedAvatar = id;
    document.querySelectorAll('#b8Picker .b8-pick').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.avatar === id));
    });
    document.getElementById('b8Error').textContent = '';
}

/* ---------- 表单 ---------- */
// id 为空 = 新增(此时必须给 cat); 给了 id = 修改(cat 取自该记录)。
function b8OpenForm(id, cat) {
    b8EditingId = id || null;
    const rec = id ? b8Records.find(r => r.id === id) : null;
    b8EditingCat = rec ? rec.cat : (cat === 'rr' ? 'rr' : 'hr');

    document.getElementById('b8FormTitle').textContent = rec ? t('editTitle') : t('addTitle');
    document.getElementById('b8Name').value = rec ? rec.name : '';
    document.getElementById('b8Score').value = rec ? rec.rallies : '';
    document.getElementById('b8Error').textContent = '';
    b8PickedAvatar = rec ? rec.avatar : null;

    b8ApplyFormCat();
    b8RenderPicker();
    document.getElementById('b8Modal').classList.add('open');
    // 表单开着就停表: 否则有人填到一半, 底下的榜自己换了,
    // 保存后还得去另一个榜找自己那行。
    b8RotHold('modal');
    // 修改某条纪录时顺手把那个榜切到前面, 让人看得见改的是哪一条
    if (rec && b8Rotating()) b8ShowBoard(rec.cat, true);
    setTimeout(() => document.getElementById('b8Name').focus(), 50);
}

// 把当前所属的榜写进弹窗(标题下的一行 + 名字栏的措辞),
// 免得在两个榜之间加错地方。
function b8ApplyFormCat() {
    const c = b8CatById(b8EditingCat);
    document.getElementById('b8FormCat').textContent = c[b8Lang] || c.en;
    const rr = b8EditingCat === 'rr';
    document.getElementById('b8NameLabel').textContent = t(rr ? 'nameLabelRr' : 'nameLabelHr');
    document.getElementById('b8Name').placeholder = t(rr ? 'namePhRr' : 'namePhHr');
}

function b8CloseForm() {
    document.getElementById('b8Modal').classList.remove('open');
    b8EditingId = null;
    b8RotRelease('modal');
}

function b8Submit(event) {
    if (event) event.preventDefault();
    const err = document.getElementById('b8Error');
    const name = document.getElementById('b8Name').value.trim();
    const raw = document.getElementById('b8Score').value.trim();
    const score = Number(raw);

    if (!name) { err.textContent = t('errName'); return; }
    if (!b8PickedAvatar) { err.textContent = t('errAvatar'); return; }
    if (!Number.isInteger(score) || score < 1) { err.textContent = t('errScore'); return; }

    if (b8EditingId) {
        const rec = b8Records.find(r => r.id === b8EditingId);
        if (rec) { rec.name = name; rec.avatar = b8PickedAvatar; rec.rallies = score; }
    } else {
        b8Records.push({
            id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            cat: b8EditingCat,
            name: name,
            avatar: b8PickedAvatar,
            rallies: score,
            date: b8Today()
        });
    }

    b8Save();
    b8Render();
    // 停在刚录入的那个榜上并重新计满一轮, 让人当场看到自己的名次
    const landed = b8EditingCat;
    b8CloseForm();
    if (b8Rotating()) b8ShowBoard(landed, true);
}

function b8Delete(id) {
    if (!confirm(t('confirmDel'))) return;
    b8Records = b8Records.filter(r => r.id !== id);
    b8Save();
    b8Render();
}

function b8Today() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ---------- 导出 / 导入 ---------- */
// localStorage 会被"清除浏览数据"抹掉, 导出是唯一的兜底。
// 一个文件同时含两个榜, 用 cat 区分。
function b8Export() {
    b8CloseMenu();
    const blob = new Blob([JSON.stringify({
        schema: B8_SCHEMA,
        exportedAt: new Date().toISOString(),
        records: B8_CATS.reduce((acc, c) => acc.concat(b8Sorted(c.id)), [])
    }, null, 2)], { type: 'application/json' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `building8-records-${b8Today()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function b8ImportFile(input) {
    b8CloseMenu();
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        let incoming;
        try {
            const parsed = JSON.parse(reader.result);
            incoming = Array.isArray(parsed) ? parsed : parsed.records;
        } catch (e) { incoming = null; }

        if (!Array.isArray(incoming)) { alert(t('importBad')); input.value = ''; return; }

        const clean = incoming.filter(b8Valid).map(r => ({
            id: r.id || 'r' + Math.random().toString(36).slice(2, 10),
            cat: r.cat === 'rr' ? 'rr' : 'hr',      // 老备份没有 cat, 归到人机榜
            name: String(r.name).trim(),
            avatar: b8AvatarById(r.avatar).id,
            rallies: Number(r.rallies),
            date: r.date || b8Today(),
            demo: !!r.demo
        }));

        const msg = t('importAsk').replace('{cur}', b8Records.length).replace('{n}', clean.length);
        if (!confirm(msg)) { input.value = ''; return; }

        b8Records = clean;
        b8Save();
        b8Render();
        alert(t('importOk').replace('{n}', clean.length));
        input.value = '';
    };
    reader.readAsText(file);
}

/* ---------- 配色 ---------- */
// 深浅两套配色只差一组 CSS 变量, 由 <html data-theme> 切换。
// 选择记在 localStorage, 换班/重启设备后仍保持。
// 注意: 首屏的套用在 HTML <head> 里的内联脚本中完成, 不在这里,
// 否则样式表已经按浅色画完一帧, 深色下会白闪。
const B8_THEME_KEY = 'b8_theme';

function b8SetTheme(theme) {
    const dark = theme === 'dark';
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');

    try { localStorage.setItem(B8_THEME_KEY, dark ? 'dark' : 'light'); } catch (e) { /* 隐私模式 */ }
    b8SyncThemeButtons();
}

function b8CurrentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function b8SyncThemeButtons() {
    const now = b8CurrentTheme();
    document.querySelectorAll('[data-theme-opt]').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.themeOpt === now));
    });
}

/* ---------- 设置菜单 ---------- */
function b8ToggleMenu(event) {
    if (event) event.stopPropagation();   // 否则立刻被下面的全局点击处理器关掉
    const menu = document.getElementById('b8Menu');
    const btn = document.getElementById('b8SettingsBtn');
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    if (open) b8RotHold('menu'); else b8RotRelease('menu');
}

function b8CloseMenu() {
    const menu = document.getElementById('b8Menu');
    if (!menu || !menu.classList.contains('open')) return;
    menu.classList.remove('open');
    document.getElementById('b8SettingsBtn').setAttribute('aria-expanded', 'false');
    b8RotRelease('menu');
}

/* ---------- 语言 ---------- */
function b8SetLang(lang) {
    b8Lang = (lang === 'zh') ? 'zh' : 'en';
    document.documentElement.lang = (b8Lang === 'zh') ? 'zh-CN' : 'en';

    document.querySelectorAll('[data-zh][data-en]').forEach(el => {
        const txt = el.getAttribute('data-' + b8Lang);
        if (txt !== null) el.textContent = txt;
    });
    document.querySelectorAll('[data-zh-ph][data-en-ph]').forEach(el => {
        el.placeholder = el.getAttribute('data-' + b8Lang + '-ph') || '';
    });
    // 加号按钮没有可见文字, 靠 title/aria-label 说明用途
    document.querySelectorAll('[data-zh-title][data-en-title]').forEach(el => {
        const txt = el.getAttribute('data-' + b8Lang + '-title') || '';
        el.title = txt;
        el.setAttribute('aria-label', txt);
    });

    document.querySelectorAll('.b8-lang button').forEach(btn => {
        btn.classList.toggle('active', (btn.getAttribute('onclick') || '').includes(`'${b8Lang}'`));
    });

    try { localStorage.setItem('userLang', b8Lang); } catch (e) { /* 隐私模式下忽略 */ }

    // 这几个分段按钮的文字刚被双语处理器重写, aria-pressed 要补回来
    b8SyncThemeButtons();
    b8SyncVideoButtons();
    b8Render();
    b8RenderRotator();
    if (b8RotMq) b8ShowBoard(b8ActiveCat, true);
    if (document.getElementById('b8Modal').classList.contains('open')) {
        document.getElementById('b8FormTitle').textContent = b8EditingId ? t('editTitle') : t('addTitle');
        b8ApplyFormCat();
        b8RenderPicker();
    }
}

/* ---------- 启动 ---------- */
document.addEventListener('DOMContentLoaded', function () {
    let saved = null;
    try { saved = localStorage.getItem('userLang'); } catch (e) { /* 隐私模式 */ }

    const firstRun = localStorage.getItem(B8_KEY) === null;
    b8Records = b8Load();
    if (firstRun && b8Records.length) b8Save();   // 把示例落盘, 让后续增删改有稳定基准
    b8SetLang(saved === 'en' ? 'en' : 'zh');

    document.getElementById('b8Modal').addEventListener('click', function (e) {
        if (e.target === this) b8CloseForm();
    });
    b8SyncThemeButtons();
    b8SyncVideoButtons();
    b8RotInit();

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { b8CloseForm(); b8CloseMenu(); }
    });
    // 点菜单以外的地方关掉它。菜单内部的点击不冒泡到这里。
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#b8Menu')) b8CloseMenu();
    });
    window.addEventListener('resize', () => b8UpdateOverflow());

    // 滚动条平时隐形, 滚动时才显形, 停下 900ms 后再淡出。
    // 只加/去一个 class, 滚动条宽度始终占位, 不会挤动内容。
    B8_CATS.forEach(c => {
        const list = document.getElementById('b8List-' + c.id);
        if (!list) return;
        let timer = null;
        list.addEventListener('scroll', () => {
            list.classList.add('is-scrolling');
            // 触屏现场没有 hover, 用「正在滚动」兜住同一件事:
            // 有人在翻榜的时候别把榜换掉。
            b8RotHold('scroll');
            clearTimeout(timer);
            timer = setTimeout(() => {
                list.classList.remove('is-scrolling');
                b8RotRelease('scroll');
            }, 900);
        }, { passive: true });
    });
});
