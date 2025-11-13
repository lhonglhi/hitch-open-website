// Data storage
let mediaData = null;
let teamsData = null;
let leaderboardData = null;
let timelineData = null;
let highlightsData = null;

// Current language
let currentLang = 'zh';
let isShowingAll = false;

// Track modal titles
const trackTitles = {
    'oval': {
        zh: '仿真椭圆赛道',
        en: 'Simulation Oval Track'
    },
    'formula': {
        zh: '仿真复赛方程式赛道',
        en: 'Simulation Formula Track'
    },
    'tianmen': {
        zh: '天门山决赛赛道',
        en: 'Tianmen Mountain Final Track'
    }
};

// Load JSON data
async function loadData() {
    try {
        console.log('Loading data from JSON files...');

        // Load all JSON files
        const [media, teams, leaderboard, timeline, highlights] = await Promise.all([
            fetch('data/media.json').then(r => r.json()),
            fetch('data/teams.json').then(r => r.json()),
            fetch('data/leaderboard.json').then(r => r.json()),
            fetch('data/timeline.json').then(r => r.json()),
            fetch('data/highlights.json').then(r => r.json())
        ]);

        mediaData = media;
        teamsData = teams;
        leaderboardData = leaderboard;
        timelineData = timeline;
        highlightsData = highlights;

        console.log('Data loaded:', {
            media: mediaData.items.length,
            teams: teamsData.items.length,
            leaderboard: leaderboardData.items.length,
            timeline: timelineData.items.length,
            highlights: highlightsData.items.length
        });

        // Render all sections with current language
        renderMedia();
        renderTeams();
        renderLeaderboard();
        renderTimeline();
        renderHighlights();

        console.log('✓ All data loaded and rendered successfully');
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Render media coverage
function renderMedia() {
    const mediaGrid = document.getElementById('mediaGrid');
    const mediaCoverageTitle = document.getElementById('mediaCoverageTitle');
    const moreNewsBtn = document.getElementById('moreNewsBtn');

    if (!mediaGrid) {
        console.error('mediaGrid element not found');
        return;
    }

    // Check if data exists and has items
    if (!mediaData || !mediaData.items || mediaData.items.length === 0) {
        mediaGrid.innerHTML = '<div class="no-data">No Data</div>';
        if (moreNewsBtn) moreNewsBtn.style.display = 'none';
        return;
    }

    // Update section title
    if (mediaCoverageTitle) {
        mediaCoverageTitle.textContent = mediaData.title[currentLang];
    }

    // Show more button if hidden
    if (moreNewsBtn) moreNewsBtn.style.display = 'inline-block';

    // Render media cards
    mediaGrid.innerHTML = mediaData.items.map((item, index) => {
        const cardClass = `media-card ${item.isLarge ? 'media-card-large' : ''} ${item.isHidden ? 'media-card-hidden' : ''}`;
        const title = item.title[currentLang];
        const source = item.source[currentLang];

        // 获取图片路径：优先使用item.image，其次使用defaultImage，最后使用占位图
        const imagePath = item.image || mediaData.defaultImage || 'images/news-placeholder.jpg';

        // 如果有URL，添加点击事件和样式
        const clickable = item.url ? 'media-card-clickable' : '';
        const clickHandler = item.url ? `onclick="window.open('${item.url}', '_blank')"` : '';
        const cursorStyle = item.url ? 'cursor: pointer;' : '';

        return `
            <div class="${cardClass} ${clickable}" ${clickHandler} style="${cursorStyle}">
                <div class="media-image" style="background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url('${imagePath}'); background-size: cover; background-position: center;"></div>
                <div class="media-content">
                    <div class="media-date">${item.date}</div>
                    <h3 class="media-title">${title}</h3>
                    <div class="media-source">${source}</div>
                </div>
            </div>
        `;
    }).join('');

    // Update button text
    if (moreNewsBtn) {
        moreNewsBtn.textContent = isShowingAll ? mediaData.lessButton[currentLang] : mediaData.moreButton[currentLang];
    }

    // Hide hidden cards
    document.querySelectorAll('.media-card-hidden').forEach(card => {
        card.style.display = isShowingAll ? 'flex' : 'none';
    });

    console.log(`✓ Rendered ${mediaData.items.length} media items in ${currentLang}`);
}

// Render teams
function renderTeams() {
    const teamsGrid = document.querySelector('.teams-grid');
    const teamsTitle = document.querySelector('#teams .section-title');
    const teamsSubtitle = document.querySelector('#teams .section-subtitle');

    if (!teamsGrid) {
        console.error('teams-grid element not found');
        return;
    }

    // Check if data exists and has items
    if (!teamsData || !teamsData.items || teamsData.items.length === 0) {
        teamsGrid.innerHTML = '<div class="no-data">No Data</div>';
        return;
    }

    // Update title and subtitle
    if (teamsTitle) {
        teamsTitle.textContent = teamsData.title[currentLang];
    }
    if (teamsSubtitle) {
        teamsSubtitle.textContent = teamsData.subtitle[currentLang];
    }

    // Render team cards
    teamsGrid.innerHTML = teamsData.items.map((team, index) => {
        const logoPath = team.logo || 'images/teams/logos/placeholder.png';
        return `
        <div class="team-card" data-team-index="${index}" style="cursor: pointer;">
            <div class="team-logo">
                <img src="${logoPath}" alt="${team.name[currentLang]} Logo" onerror="this.src='images/teams/logos/placeholder.png'">
            </div>
            <div class="team-name">${team.name[currentLang]}</div>
        </div>
        `;
    }).join('');

    // Add click event listeners to all team cards
    const teamCards = teamsGrid.querySelectorAll('.team-card');
    teamCards.forEach(card => {
        card.addEventListener('click', function() {
            const teamIndex = parseInt(this.getAttribute('data-team-index'));
            openTeamModal(teamIndex);
        });
    });

    console.log(`✓ Rendered ${teamsData.items.length} teams in ${currentLang}`);
}

// Team modal functions
function openTeamModal(teamIndex) {
    console.log('openTeamModal called with index:', teamIndex);

    if (!teamsData || !teamsData.items) {
        console.error('teamsData not available');
        return;
    }

    const team = teamsData.items[teamIndex];
    if (!team) {
        console.error('Team not found at index:', teamIndex);
        return;
    }

    console.log('Team data:', team);

    const modal = document.getElementById('teamModal');
    if (!modal) {
        console.error('Team modal element not found');
        return;
    }

    console.log('Modal found, updating content...');

    // Check if required fields exist
    if (!team.teamName || !team.description) {
        console.error('Team data incomplete:', team);
        alert('队伍数据不完整，请刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）清除缓存后重试');
        return;
    }

    // Update modal content
    document.getElementById('teamModalUniversityName').textContent = team.name[currentLang];
    document.getElementById('teamModalTeamName').textContent = team.teamName[currentLang];
    document.getElementById('teamModalDescription').textContent = team.description[currentLang];

    // Render professors (supports multiple professors)
    const professorsContainer = document.getElementById('teamModalProfessors');

    if (!team.professors || team.professors.length === 0) {
        professorsContainer.innerHTML = '<div class="no-data" style="margin: 20px 0;">No Data</div>';
    } else {
        professorsContainer.innerHTML = team.professors.map(professor => `
            <div class="team-modal-professor">
                <img class="professor-avatar" src="${professor.avatar}" alt="${professor.name[currentLang]}">
                <div class="professor-info">
                    <h5 class="professor-name">${professor.name[currentLang]}</h5>
                    <p class="professor-bio">${professor.bio[currentLang]}</p>
                </div>
            </div>
        `).join('');
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    console.log('✓ Team modal opened for:', team.name[currentLang]);
}

function closeTeamModal() {
    const modal = document.getElementById('teamModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    console.log('Closing team modal');
}

// Render leaderboard
function renderLeaderboard() {
    const tbody = document.querySelector('.leaderboard-table tbody');
    const leaderboardTitle = document.querySelector('#leaderboard .section-title');
    const headers = document.querySelectorAll('.leaderboard-table th');

    if (!tbody) {
        console.error('leaderboard tbody element not found');
        return;
    }

    // Check if data exists and has items
    if (!leaderboardData || !leaderboardData.items || leaderboardData.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">No Data</td></tr>';
        return;
    }

    // Update title
    if (leaderboardTitle) {
        leaderboardTitle.textContent = leaderboardData.title[currentLang];
    }

    // Update table headers
    if (headers.length >= 4) {
        headers[0].textContent = leaderboardData.headers.rank[currentLang];
        headers[1].textContent = leaderboardData.headers.team[currentLang];
        headers[2].textContent = leaderboardData.headers.record[currentLang];
        headers[3].textContent = leaderboardData.headers.points[currentLang];
    }

    // Render leaderboard rows
    tbody.innerHTML = leaderboardData.items.map(item => `
        <tr class="${item.rankClass}">
            <td>${item.rank}</td>
            <td>${item.team[currentLang]}</td>
            <td>${item.record}</td>
            <td>${item.points}</td>
        </tr>
    `).join('');

    console.log(`✓ Rendered ${leaderboardData.items.length} leaderboard entries in ${currentLang}`);
}

// Render timeline
function renderTimeline() {
    const timelineItems = document.querySelector('.timeline-items');
    const timelineTitle = document.getElementById('timelineTitle');

    if (!timelineItems) {
        console.error('timeline-items element not found');
        return;
    }

    // Check if data exists and has items
    if (!timelineData || !timelineData.items || timelineData.items.length === 0) {
        timelineItems.innerHTML = '<div class="no-data">No Data</div>';
        return;
    }

    // Update title
    if (timelineTitle) {
        timelineTitle.textContent = timelineData.title[currentLang];
    }

    // Render timeline items
    timelineItems.innerHTML = timelineData.items.map(item => {
        const statusClass = item.status === 'completed' ? 'completed' : 'upcoming';
        const statusBadgeClass = item.status === 'completed' ? 'completed-badge' : 'upcoming-badge';
        const statusText = timelineData.statusLabels[item.status][currentLang];

        const clickHandler = item.hasModal ? `onclick="openTrackModal('${item.track}')"` : '';
        const trackAttr = item.track ? `data-track="${item.track}"` : '';

        return `
            <div class="timeline-item ${statusClass}" ${clickHandler} ${trackAttr}>
                <div class="timeline-date">${item.date[currentLang]}</div>
                <div class="timeline-content">
                    <h4>${item.title[currentLang]}</h4>
                    <p>${item.description[currentLang]}</p>
                </div>
                <div class="timeline-status ${statusBadgeClass}">${statusText}</div>
                ${item.hasModal ? `<div class="track-preview"><img src="${item.trackImage}" alt="赛道图"></div>` : ''}
            </div>
        `;
    }).join('');

    console.log(`✓ Rendered ${timelineData.items.length} timeline items in ${currentLang}`);
}

// Toggle more news function
function toggleMoreNews(event) {
    console.log('=== toggleMoreNews called ===');

    const hiddenCards = document.querySelectorAll('.media-card-hidden');
    const btn = document.getElementById('moreNewsBtn');

    if (hiddenCards.length === 0) {
        console.error('ERROR: No hidden cards found!');
        return;
    }

    isShowingAll = !isShowingAll;

    hiddenCards.forEach((card, index) => {
        card.style.display = isShowingAll ? 'flex' : 'none';
    });

    if (btn && mediaData) {
        btn.textContent = isShowingAll ? mediaData.lessButton[currentLang] : mediaData.moreButton[currentLang];

        if (!isShowingAll) {
            // Scroll to media section
            const mediaSection = document.querySelector('.media-coverage');
            if (mediaSection) {
                mediaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    console.log('=== toggleMoreNews completed ===');
}

// Track modal functions
function openTrackModal(trackType) {
    const modal = document.getElementById('trackModal');
    const modalTitle = document.getElementById('trackModalTitle');
    const modalImage = document.getElementById('trackModalImage');

    // Get the track image from the timeline item
    const timelineItem = document.querySelector(`[data-track="${trackType}"]`);
    const trackImg = timelineItem ? timelineItem.querySelector('.track-preview img') : null;

    if (trackImg && trackImg.src) {
        modalImage.src = trackImg.src;
    }

    // Set title based on current language
    const lang = currentLang || 'zh';
    modalTitle.textContent = trackTitles[trackType][lang];

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    console.log('Opening track modal:', trackType);
}

function closeTrackModal() {
    const modal = document.getElementById('trackModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    console.log('Closing track modal');
}

// Render highlights gallery
function renderHighlights() {
    const gallery = document.getElementById('highlightsGallery');
    const highlightsTitle = document.getElementById('highlightsTitle');

    if (!gallery) {
        console.error('highlightsGallery element not found');
        return;
    }

    // Check if data exists and has items
    if (!highlightsData || !highlightsData.items || highlightsData.items.length === 0) {
        gallery.innerHTML = '<div class="no-data">No Data</div>';
        return;
    }

    // Update section title
    if (highlightsTitle) {
        highlightsTitle.textContent = highlightsData.title[currentLang];
    }

    // Render gallery items
    gallery.innerHTML = highlightsData.items.map((item, index) => {
        const playIcon = item.type === 'video' ? '<div class="gallery-play-icon"></div>' : '';

        return `
        <div class="gallery-item" data-index="${index}" onclick="openLightbox(${index})">
            <div class="gallery-thumbnail" style="background-image: url('${item.thumbnail}');">
                ${playIcon}
            </div>
            <div class="gallery-info">
                <div class="gallery-title">${item.title[currentLang]}</div>
            </div>
        </div>
        `;
    }).join('');

    console.log('✓ Highlights gallery rendered:', highlightsData.items.length, 'items');
}

// Open lightbox with media
function openLightbox(index) {
    const item = highlightsData.items[index];
    const lightbox = document.getElementById('highlightLightbox');
    const mediaContainer = document.getElementById('lightboxMedia');
    const title = document.getElementById('lightboxTitle');
    const description = document.getElementById('lightboxDescription');

    // Set content
    if (item.type === 'video') {
        mediaContainer.innerHTML = `<iframe src="${item.source}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        mediaContainer.innerHTML = `<img src="${item.source}" alt="${item.title[currentLang]}">`;
    }

    title.textContent = item.title[currentLang];
    description.textContent = item.description[currentLang];

    // Show lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    console.log('Lightbox opened:', item.title[currentLang]);
}

// Close lightbox
function closeLightbox() {
    const lightbox = document.getElementById('highlightLightbox');
    const mediaContainer = document.getElementById('lightboxMedia');

    // Stop video if playing
    mediaContainer.innerHTML = '';

    // Hide lightbox
    lightbox.classList.remove('active');
    document.body.style.overflow = '';

    console.log('Lightbox closed');
}

// Language switching
const translations = {
    zh: {
        heroTitle: 'HITCH OPEN',
        heroSubtitle: '世界AI竞速锦标赛',
        heroTagline: '物理智能开源数据平台',
        heroDesc: '全球首个AI自主决策自然实验室启航，<br>L4-L5全自动驾驶挑战张家界天门山九十九道弯，让AI在大自然中理解物理世界',
        stat1: '所参赛高校',
        stat2: '道极限弯道',
        stat3: '公里赛道全长',
        stat4: '米海拔海拔落差',
        btn1: '2025赛季',
        aboutTitle: '物理智能时代的AlphaGo时刻',
        aboutText: '在天门山 99 道弯,Hitch Open 正创造自动驾驶的 AlphaGo 时刻。<br><br>10.77 公里的天路,1100 米的落差,99 个弯道——<br>F1 传奇车手 Romain Dumas 曾以 7\'36" 刷新人类极限。<br><br>而今年,清华大学 AI 赛车在无 GPS、低能见度、湿滑赛面的极限环境中,<br>以 16\'10"838 全程自动驾驶登顶,<br>让 AI 首次在真实世界完成"感知—决策—行动"的闭环。<br><br>这一刻,物理智能的引擎被彻底点燃。',
        recordsTitle1: '人类赛车纪录',
        recordsTitle2: 'AI赛车纪录',
        recordsTeam1: '法国 F1 赛车手 Romain Dumas',
        recordsTeam2: '清华大学 极限竞速战队',
        missionTitle: 'Hitch Open以竞速之名,开启物理智能时代',
        missionSubtitle: 'Hitch Open世界AI竞速锦标赛,以真实极限环境验证人工智能的感知与决策能力,推动AI从虚拟智能迈向物理智能。',
        impactTitle: '赛事影响力',
        trackTitle: '2025 决赛场地 - 天门山 99 道弯',
        trackSubtitle: 'AI竞速的终极挑战赛道',
        trackSpec1Label: '全长',
        trackSpec1: '10.77 公里',
        trackSpec2Label: '海拔提升',
        trackSpec2: '200m → 1300m',
        trackSpec3Label: '弯道数量',
        trackSpec3: '99 个弯道',
        trackSpec4Label: '弯道类型',
        trackSpec4: '极端 180° 发卡弯',
        trackDescription: '天门山99道弯，被誉为"通天大道"，是全球最极限、最壮观的山路之一。大道两侧绝壁千仞，空谷幽深，180度急弯此消彼长。这里将成为AI竞速技术的终极试炼场，重新定义AI竞速的极限。',
        trackImageTitle: '天门山赛道全景',
        trackImageDesc: '天门山99道弯，被誉为"通天大道"，是全球最极限的山路之一。全长逾10公里，180度急弯此消彼长。这里将成为AI竞速技术的终极试炼场，重新定义AI竞速的极限。',
        partnersTitle: '合作伙伴',
        contactTitle: '联系我们',
        contactGeneral: '通用咨询',
        contactMedia: '媒体合作',
        highlightsTitle: '2025赛季高光时刻'
    },
    en: {
        heroTitle: 'HITCH OPEN',
        heroSubtitle: 'World AI Racing Championship',
        heroTagline: 'Physical Intelligence Open Data Platform',
        heroDesc: 'The world\'s first AI autonomous decision-making natural laboratory launches,<br>L4-L5 fully autonomous driving challenges Zhangjiajie Tianmen Mountain\'s 99 bends, enabling AI to understand the physical world in nature',
        stat1: 'Participating Universities',
        stat2: 'Extreme Curves',
        stat3: 'km Track Length',
        stat4: 'm Elevation Drop',
        btn1: '2025 Season',
        aboutTitle: 'The AlphaGo Moment of Physical Intelligence',
        aboutText: 'At Tianmen Mountain\'s 99 bends, Hitch Open is creating autonomous driving\'s AlphaGo moment.<br><br>10.77 kilometers of skyward road, 1100 meters of elevation drop, 99 curves—<br>F1 legend Romain Dumas set the human limit at 7\'36".<br><br>This year, Tsinghua University\'s AI racing car reached the summit with fully autonomous driving in 16\'10"838,<br>under extreme conditions of no GPS, low visibility, and slippery surfaces,<br>achieving AI\'s first closed loop of "perception—decision—action" in the real world.<br><br>This moment, the engine of physical intelligence was fully ignited.',
        recordsTitle1: 'Human Racing Record',
        recordsTitle2: 'AI Racing Record',
        recordsTeam1: 'French F1 Driver Romain Dumas',
        recordsTeam2: 'Tsinghua University Racing Team',
        missionTitle: 'Hitch Open: Racing Forward to Physical Intelligence Era',
        missionSubtitle: 'The Hitch Open World AI Racing Championship validates AI perception and decision-making capabilities in real extreme environments, driving AI from virtual to physical intelligence.',
        impactTitle: 'Event Impact',
        trackTitle: '2025 Final Venue - Tianmen Mountain 99 Bends',
        trackSubtitle: 'The Ultimate Challenge for AI Racing',
        trackSpec1Label: 'Length',
        trackSpec1: '10.77 km',
        trackSpec2Label: 'Elevation Gain',
        trackSpec2: '200m → 1300m',
        trackSpec3Label: 'Turns',
        trackSpec3: '99 turns',
        trackSpec4Label: 'Turn Type',
        trackSpec4: 'Extreme 180° hairpin bends',
        trackDescription: 'The Tianmen Mountain 99 Bends, known as the "Road to Heaven", is one of the most extreme and spectacular mountain roads in the world. With cliffs towering on both sides and deep valleys, the 180-degree sharp turns appear one after another. This will become the ultimate testing ground for AI racing technology, redefining the limits of AI racing.',
        trackImageTitle: 'Tianmen Mountain Track Panorama',
        trackImageDesc: 'The Tianmen Mountain 99 Bends, known as the "Road to Heaven", is one of the most extreme mountain roads in the world. Stretching over 10 kilometers with 180-degree sharp turns appearing one after another, this will become the ultimate testing ground for AI racing technology, redefining the limits of AI racing.',
        partnersTitle: 'Partners',
        contactTitle: 'Contact Us',
        contactGeneral: 'General Inquiries',
        contactMedia: 'Media Cooperation',
        highlightsTitle: '2025 Season Highlights'
    }
};

function switchLanguage(lang) {
    currentLang = lang;

    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update navigation links
    document.querySelectorAll('#navLinks a').forEach(link => {
        const text = link.getAttribute(`data-${lang}`);
        if (text) link.textContent = text;
    });

    // Update main content
    const t = translations[lang];

    // Hero section
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroTagline = document.querySelector('.hero-tagline');
    const heroDesc = document.querySelector('.hero-content p');

    if (heroSubtitle) heroSubtitle.innerHTML = t.heroSubtitle;
    if (heroTagline) heroTagline.innerHTML = t.heroTagline;
    if (heroDesc) heroDesc.innerHTML = t.heroDesc;

    // Update stat labels
    const statLabels = document.querySelectorAll('.hero-stats > div > div:last-child');
    if (statLabels[0]) statLabels[0].textContent = t.stat1;
    if (statLabels[1]) statLabels[1].textContent = t.stat2;
    if (statLabels[2]) statLabels[2].textContent = t.stat3;
    if (statLabels[3]) statLabels[3].textContent = t.stat4;

    // Update CTA buttons
    const ctaBtns = document.querySelectorAll('.cta-buttons a');
    if (ctaBtns[0]) ctaBtns[0].textContent = t.btn1;

    // Update about section
    const aboutTitle = document.querySelector('#about .section-title');
    if (aboutTitle) aboutTitle.textContent = t.aboutTitle;

    const aboutText = document.querySelector('#about .section-subtitle');
    if (aboutText) aboutText.innerHTML = t.aboutText;

    // Update mission section
    const missionTitle = document.querySelector('#about + .section .section-title');
    if (missionTitle) missionTitle.textContent = t.missionTitle;

    const missionSubtitle = document.querySelector('#about + .section .section-subtitle');
    if (missionSubtitle) missionSubtitle.textContent = t.missionSubtitle;

    // Update record cards
    const recordTitles = document.querySelectorAll('.record-card h3');
    if (recordTitles[0]) recordTitles[0].innerHTML = `<strong>${t.recordsTitle1}</strong>`;
    if (recordTitles[1]) recordTitles[1].innerHTML = `<strong>${t.recordsTitle2}</strong>`;

    const recordTeams = document.querySelectorAll('.record-team');
    if (recordTeams[0]) recordTeams[0].textContent = t.recordsTeam1;
    if (recordTeams[1]) recordTeams[1].textContent = t.recordsTeam2;

    // Update impact section
    const impactTitle = document.querySelector('.impact .section-title');
    if (impactTitle) impactTitle.textContent = t.impactTitle;

    // Update contact info
    const contactItems = document.querySelectorAll('.contact-item');
    if (contactItems[0]) contactItems[0].innerHTML = `${t.contactGeneral}：<a href="mailto:info@intelligentracing.org">info@intelligentracing.org</a>`;
    if (contactItems[1]) contactItems[1].innerHTML = `${t.contactMedia}：<a href="mailto:media@intelligentracing.com">media@intelligentracing.com</a>`;

    // Update track section
    const trackTitle = document.getElementById('trackTitle');
    if (trackTitle) trackTitle.textContent = t.trackTitle;

    const trackSubtitle = document.getElementById('trackSubtitle');
    if (trackSubtitle) trackSubtitle.textContent = t.trackSubtitle;

    const trackSpec1Label = document.getElementById('trackSpec1Label');
    if (trackSpec1Label) trackSpec1Label.textContent = t.trackSpec1Label;

    const trackSpec1 = document.getElementById('trackSpec1');
    if (trackSpec1) trackSpec1.textContent = t.trackSpec1;

    const trackSpec2Label = document.getElementById('trackSpec2Label');
    if (trackSpec2Label) trackSpec2Label.textContent = t.trackSpec2Label;

    const trackSpec2 = document.getElementById('trackSpec2');
    if (trackSpec2) trackSpec2.textContent = t.trackSpec2;

    const trackSpec3Label = document.getElementById('trackSpec3Label');
    if (trackSpec3Label) trackSpec3Label.textContent = t.trackSpec3Label;

    const trackSpec3 = document.getElementById('trackSpec3');
    if (trackSpec3) trackSpec3.textContent = t.trackSpec3;

    const trackSpec4Label = document.getElementById('trackSpec4Label');
    if (trackSpec4Label) trackSpec4Label.textContent = t.trackSpec4Label;

    const trackSpec4 = document.getElementById('trackSpec4');
    if (trackSpec4) trackSpec4.textContent = t.trackSpec4;

    const trackDescription = document.getElementById('trackDescription');
    if (trackDescription) trackDescription.textContent = t.trackDescription;

    const trackImageTitle = document.getElementById('trackImageTitle');
    if (trackImageTitle) trackImageTitle.textContent = t.trackImageTitle;

    const trackImageDesc = document.getElementById('trackImageDesc');
    if (trackImageDesc) trackImageDesc.textContent = t.trackImageDesc;

    // Update highlights section
    const highlightsTitle = document.getElementById('highlightsTitle');
    if (highlightsTitle) highlightsTitle.textContent = t.highlightsTitle;

    // Re-render all JSON-driven sections with new language
    renderMedia();
    renderTeams();
    renderLeaderboard();
    renderTimeline();
    renderHighlights();

    // Update all elements with data-zh and data-en attributes
    document.querySelectorAll('[data-zh][data-en]').forEach(element => {
        const text = element.getAttribute(`data-${lang}`);
        if (text) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = text;
            } else {
                element.innerHTML = text;
            }
        }
    });

    console.log(`✓ Language switched to ${lang}`);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM loaded, setting up event listeners ===');

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add fade-in animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(section);
    });

    // Close modal on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTrackModal();
            closeTeamModal();
        }
    });

});

// Load data when window loads
window.addEventListener('load', async function() {
    console.log('=== Page fully loaded, initializing ===');

    // Load data from JSON files
    await loadData();

    // Attach event listener to "View More" button
    const moreNewsBtn = document.getElementById('moreNewsBtn');
    if (moreNewsBtn) {
        console.log('Button found! Attaching click listener');
        moreNewsBtn.onclick = function(e) {
            console.log('>>> Button clicked! <<<');
            toggleMoreNews(e);
        };
    } else {
        console.error('❌ ERROR: Button with id "moreNewsBtn" not found!');
    }

    console.log('=== Initialization complete ===');
});
