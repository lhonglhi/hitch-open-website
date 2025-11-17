// Data storage
let mediaData = null;
let teamsData = null;
let leaderboardData = null;
let timelineData = null;
let highlightsData = null;
let translationsData = null;

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
    },
    'simulation2026': {
        zh: '全新赛季: AI物理智能新征程',
        en: 'New Season: AI Physical Intelligence New Journey'
    }
};

// Load JSON data
async function loadData() {
    try {
        console.log('Loading data from JSON files...');

        // Load all JSON files
        const [media, teams, leaderboard, timeline, highlights, translations] = await Promise.all([
            fetch('data/media.json').then(r => r.json()),
            fetch('data/teams.json').then(r => r.json()),
            fetch('data/leaderboard.json').then(r => r.json()),
            fetch('data/timeline.json').then(r => r.json()),
            fetch('data/highlights.json').then(r => r.json()),
            fetch('data/translations.json').then(r => r.json())
        ]);

        mediaData = media;
        teamsData = teams;
        leaderboardData = leaderboard;
        timelineData = timeline;
        highlightsData = highlights;
        translationsData = translations;

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

        // Apply translations from JSON to initial page load
        updateStaticContent(currentLang);

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

// Update static content with translations
function updateStaticContent(lang) {
    if (!translationsData) return;

    const t = translationsData[lang];

    // Update navigation links
    document.querySelectorAll('#navLinks a').forEach(link => {
        const text = link.getAttribute(`data-${lang}`);
        if (text) link.textContent = text;
    });

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
    const missionTitle = document.getElementById('missionTitle');
    if (missionTitle) missionTitle.textContent = t.missionTitle;

    const missionSubtitle = document.getElementById('missionSubtitle');
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

    // Update contact section
    const contactTitle = document.getElementById('contactTitle');
    if (contactTitle) contactTitle.textContent = t.contactTitle;

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

    // Update mission cards
    const mission1Title = document.getElementById('mission1Title');
    if (mission1Title) mission1Title.textContent = t.mission1Title;
    const mission1Text = document.getElementById('mission1Text');
    if (mission1Text) mission1Text.textContent = t.mission1Text;

    const mission2Title = document.getElementById('mission2Title');
    if (mission2Title) mission2Title.textContent = t.mission2Title;
    const mission2Text = document.getElementById('mission2Text');
    if (mission2Text) mission2Text.textContent = t.mission2Text;

    const mission3Title = document.getElementById('mission3Title');
    if (mission3Title) mission3Title.textContent = t.mission3Title;
    const mission3Text = document.getElementById('mission3Text');
    if (mission3Text) mission3Text.textContent = t.mission3Text;

    const mission4Title = document.getElementById('mission4Title');
    if (mission4Title) mission4Title.textContent = t.mission4Title;
    const mission4Text = document.getElementById('mission4Text');
    if (mission4Text) mission4Text.textContent = t.mission4Text;

    // Update impact numbers
    const impactNumber1 = document.getElementById('impactNumber1');
    if (impactNumber1) impactNumber1.textContent = t.impactNumber1;
    const impactNumber2 = document.getElementById('impactNumber2');
    if (impactNumber2) impactNumber2.textContent = t.impactNumber2;
    const impactNumber3 = document.getElementById('impactNumber3');
    if (impactNumber3) impactNumber3.textContent = t.impactNumber3;

    // Update impact labels
    const impactLabel1 = document.getElementById('impactLabel1');
    if (impactLabel1) impactLabel1.textContent = t.impactLabel1;
    const impactSublabel1 = document.getElementById('impactSublabel1');
    if (impactSublabel1) impactSublabel1.textContent = t.impactSublabel1;

    const impactLabel2 = document.getElementById('impactLabel2');
    if (impactLabel2) impactLabel2.textContent = t.impactLabel2;
    const impactSublabel2 = document.getElementById('impactSublabel2');
    if (impactSublabel2) impactSublabel2.textContent = t.impactSublabel2;

    const impactLabel3 = document.getElementById('impactLabel3');
    if (impactLabel3) impactLabel3.textContent = t.impactLabel3;
    const impactSublabel3 = document.getElementById('impactSublabel3');
    if (impactSublabel3) impactSublabel3.textContent = t.impactSublabel3;

    // Update media stats
    const mediaStatTitle1 = document.getElementById('mediaStatTitle1');
    if (mediaStatTitle1) mediaStatTitle1.textContent = t.mediaStatTitle1;
    const mediaStatText1 = document.getElementById('mediaStatText1');
    if (mediaStatText1) mediaStatText1.textContent = t.mediaStatText1;

    const mediaStatTitle2 = document.getElementById('mediaStatTitle2');
    if (mediaStatTitle2) mediaStatTitle2.textContent = t.mediaStatTitle2;
    const mediaStatText2 = document.getElementById('mediaStatText2');
    if (mediaStatText2) mediaStatText2.textContent = t.mediaStatText2;

    const mediaStatTitle3 = document.getElementById('mediaStatTitle3');
    if (mediaStatTitle3) mediaStatTitle3.textContent = t.mediaStatTitle3;
    const mediaStatText3 = document.getElementById('mediaStatText3');
    if (mediaStatText3) mediaStatText3.textContent = t.mediaStatText3;

    const mediaStatTitle4 = document.getElementById('mediaStatTitle4');
    if (mediaStatTitle4) mediaStatTitle4.textContent = t.mediaStatTitle4;
    const mediaStatText4 = document.getElementById('mediaStatText4');
    if (mediaStatText4) mediaStatText4.textContent = t.mediaStatText4;

    const mediaStatTitle5 = document.getElementById('mediaStatTitle5');
    if (mediaStatTitle5) mediaStatTitle5.textContent = t.mediaStatTitle5;
    const mediaStatText5 = document.getElementById('mediaStatText5');
    if (mediaStatText5) mediaStatText5.textContent = t.mediaStatText5;

    // Update team modal section titles
    const teamModalIntroTitle = document.getElementById('teamModalIntroTitle');
    if (teamModalIntroTitle) teamModalIntroTitle.textContent = t.teamModalIntroTitle;
    const teamModalProfessorsTitle = document.getElementById('teamModalProfessorsTitle');
    if (teamModalProfessorsTitle) teamModalProfessorsTitle.textContent = t.teamModalProfessorsTitle;

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
}

// Language switching
function switchLanguage(lang) {
    currentLang = lang;

    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update static content
    updateStaticContent(lang);

    // Re-render all JSON-driven sections with new language
    renderMedia();
    renderTeams();
    renderLeaderboard();
    renderTimeline();
    renderHighlights();

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
