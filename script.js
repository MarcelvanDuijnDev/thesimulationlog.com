document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const feedContainer = document.getElementById('feed');
    const logCountElement = document.getElementById('log-count');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const heroNewsSection = document.getElementById('hero-news-section');
    const clockElement = document.getElementById('live-clock');

    // Views & Nav
    const navTabs = document.querySelectorAll('.nav-tab[data-view]');
    const footerNavLinks = document.querySelectorAll('.footer-nav-link[data-view]');
    const contentViews = document.querySelectorAll('.content-view');
    const shardButtons = document.querySelectorAll('.shard-btn');
    const viewButtons = document.querySelectorAll('.view-btn');

    // Dynamic View Containers
    const articlePageContent = document.getElementById('article-page-content');
    const databaseTableBody = document.getElementById('database-table-body');

    // --- State ---
    let manifest = null;
    let loadedData = {};
    let allLogs = [];
    let activeFilters = {
        search: '',
        shard: 'all',
        sort: 'date-desc',
        viewMode: 'grid'
    };

    // AI Timeline Static Data
    const aiTimelineData = [
        {
            year: "2020",
            model: "GPT-3 (175 Billion Parameters)",
            company: "OpenAI",
            type: "Foundation Model",
            description: "Demonstrated zero-shot and few-shot natural language capabilities across translation, Q&A, and code generation.",
            release_date: "June 2020",
            compute_flops: "3.14e23 FLOPs",
            impact: "Established the scaling law era for massive transformer-based neural nets."
        },
        {
            year: "2022",
            model: "ChatGPT (InstructGPT / RLHF Rollout)",
            company: "OpenAI",
            type: "Consumer Breakout",
            description: "Reinforcement Learning from Human Feedback (RLHF) enabled conversational AI to reach 100 million active users in 60 days.",
            release_date: "November 2022",
            compute_flops: "1.2e24 FLOPs",
            impact: "Initiated the global consumer generative AI race across search and productivity."
        },
        {
            year: "2023",
            model: "GPT-4 & Multimodal Neural Networks",
            company: "OpenAI / Google DeepMind",
            type: "Multimodal Frontier",
            description: "Expanded context windows, reasoning benchmarks, professional exam pass rates, and visual input processing.",
            release_date: "March 2023",
            compute_flops: "2.1e25 FLOPs",
            impact: "Proved multi-step reasoning capabilities on complex professional benchmarks."
        },
        {
            year: "2024",
            model: "Sora & Claude 3.5 Sonnet",
            company: "OpenAI / Anthropic",
            type: "Diffusion Video & Coding",
            description: "Real-time photorealistic video generation (Sora) and high-accuracy software artifact creation.",
            release_date: "February 2024",
            compute_flops: "8.5e25 FLOPs",
            impact: "Advanced high-fidelity text-to-video diffusion and autonomous code synthesis."
        },
        {
            year: "2025",
            model: "DeepSeek-R1 & Open-Weights Reasoning",
            company: "DeepSeek / Open Source",
            type: "Reasoning Optimization",
            description: "Ultra-low-compute reasoning model weights published openly, matching top proprietary benchmarks on fractions of GPU hardware.",
            release_date: "January 2025",
            compute_flops: "1.4e26 FLOPs",
            impact: "Triggered global hardware re-evaluations and democratized frontier reasoning."
        },
        {
            year: "2026",
            model: "Antigravity & Gemini 3.6 Autonomous Subagents",
            company: "Google DeepMind",
            type: "Agentic IDE Suite",
            description: "Coding subagents autonomously manage workspace files, dependency builds, unit tests, and background task execution.",
            release_date: "August 2026",
            compute_flops: "5.2e26 FLOPs",
            impact: "Shifted developer roles from manual code drafting to prompt supervision."
        },
        {
            year: "2027+",
            model: "Next-Generation Autonomous Research Models",
            company: "Global Research Consortia",
            type: "AGI Horizon",
            description: "Continuous real-time model retraining and automated scientific hypothesis generation.",
            release_date: "Future Horizon",
            compute_flops: "1.0e28+ FLOPs",
            impact: "Transition of human technology infrastructure to self-optimizing intelligence."
        }
    ];

    // --- Core System Init & Data Fetching ---
    async function initSystem() {
        startLiveClock();
        await fetchManifestAndAllData();
        renderHeroNewsCard();
        renderLogs();
        renderAITimeline();
        renderDatabaseTable();
        setupEventListeners();
        handleRouting(); // Initial route check
        window.addEventListener('hashchange', handleRouting);
    }

    // Live Server Clock
    function startLiveClock() {
        function updateClock() {
            const now = new Date();
            const timeStr = now.toISOString().slice(11, 19) + ' UTC';
            if (clockElement) clockElement.textContent = timeStr;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // Fetch Manifest & Combine Log Data
    async function fetchManifestAndAllData() {
        try {
            const response = await fetch('logs/manifest.json');
            if (!response.ok) throw new Error('Failed to load manifest');
            manifest = await response.json();

            const filesToLoad = [];
            manifest.years_available.forEach(y => filesToLoad.push(y.file));
            manifest.eras.forEach(e => filesToLoad.push(e.file));

            const loadPromises = filesToLoad.map(async (file) => {
                try {
                    const res = await fetch(`logs/${file}`);
                    if (res.ok) {
                        const data = await res.json();
                        loadedData[file] = data;
                    }
                } catch (e) {
                    console.error(`Error loading ${file}:`, e);
                }
            });

            await Promise.all(loadPromises);

            allLogs = [];
            Object.values(loadedData).forEach(dataset => {
                if (Array.isArray(dataset)) {
                    allLogs = allLogs.concat(dataset);
                }
            });

        } catch (error) {
            console.error('Manifest load error, falling back to logs.json:', error);
            try {
                const fallbackRes = await fetch('logs.json');
                if (fallbackRes.ok) {
                    allLogs = await fallbackRes.json();
                }
            } catch (fallbackErr) {
                console.error('Failed to load fallback logs.json:', fallbackErr);
            }
        }
    }

    // --- Single Page Client Routing (#news, #article/:id, #ai-timeline, #database) ---
    function handleRouting() {
        const hash = window.location.hash || '#news';

        if (hash.startsWith('#article/')) {
            const articleId = hash.replace('#article/', '');
            renderArticlePage(articleId);
            showView('article');
        } else if (hash === '#ai-timeline') {
            showView('ai-timeline');
        } else if (hash === '#database') {
            showView('database');
        } else {
            showView('news');
        }
    }

    function showView(viewName) {
        contentViews.forEach(view => {
            if (view.id === `view-${viewName}`) {
                view.classList.remove('hidden');
                view.classList.add('active');
            } else {
                view.classList.add('hidden');
                view.classList.remove('active');
            }
        });

        navTabs.forEach(tab => {
            if (tab.dataset.view === viewName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Hero Featured News Section ---
    function renderHeroNewsCard() {
        if (!heroNewsSection) return;

        const leadItem = allLogs.find(log => log.is_active === true) || allLogs[0];

        if (!leadItem) {
            heroNewsSection.innerHTML = '';
            return;
        }

        const subtitleHTML = leadItem.sys_subtitle 
            ? `<div class="hero-sys-subtitle">${escapeHTML(leadItem.sys_subtitle)}</div>` 
            : '';

        heroNewsSection.innerHTML = `
            <div class="hero-news-card">
                <div class="hero-header-line">
                    <div class="hero-badges">
                        <span class="badge-breaking">FEATURED STORY</span>
                        <span class="type-pill ${getTypeClass(leadItem.type)}">${escapeHTML(leadItem.type || 'NEWS')}</span>
                    </div>
                    <div class="hero-date">Published: ${escapeHTML(leadItem.date || 'Present')} • Region: ${escapeHTML(leadItem.region || 'Global')}</div>
                </div>

                <h2 class="hero-headline">${escapeHTML(leadItem.title)}</h2>
                ${subtitleHTML}

                <p class="hero-description">${escapeHTML(leadItem.description)}</p>

                <div class="hero-actions">
                    <a href="#article/${leadItem.id}" class="btn-primary">
                        READ FULL COVERAGE →
                    </a>
                </div>
            </div>
        `;
    }

    // --- Full Article News Post Page Generator ---
    function renderArticlePage(articleId) {
        if (!articlePageContent) return;

        const log = allLogs.find(l => l.id === articleId) || allLogs[0];

        if (!log) {
            articlePageContent.innerHTML = `<div style="padding: 4rem 0; text-align: center;"><h2>Story Not Found</h2><p><a href="#news">Return to Latest News</a></p></div>`;
            return;
        }

        const wikiLinkHTML = log.wiki_url 
            ? `<div class="article-source-box">
                <span class="source-label">Primary Reference & Historical Source:</span>
                <a href="${escapeHTML(log.wiki_url)}" target="_blank" class="btn-primary">View Wikipedia Reference →</a>
               </div>` 
            : '';

        articlePageContent.innerHTML = `
            <a href="#news" class="back-to-news-link">← Back to Latest News</a>

            <div class="article-category-badge">${escapeHTML(log.type || 'AI & TECH')}</div>
            <h1 class="article-main-headline">${escapeHTML(log.title)}</h1>

            ${log.sys_subtitle ? `<div class="article-lead-subtitle">${escapeHTML(log.sys_subtitle)}</div>` : ''}

            <div class="article-byline-card">
                <div class="article-author-info">
                    By <span class="article-author-name">${escapeHTML(log.submitted_by || 'Editorial Team')}</span>
                    <span>•</span>
                    <span>Region: ${escapeHTML(log.region || 'Global')}</span>
                </div>
                <div>Published: ${escapeHTML(log.date || 'Present')}</div>
            </div>

            <div class="article-key-highlights">
                <div class="highlights-title">Key Highlights</div>
                <div class="highlights-text">${escapeHTML(log.description)}</div>
            </div>

            <div class="article-body-serif">
                <p>
                    ${escapeHTML(log.description)}
                </p>
                <p>
                    Developments in ${escapeHTML(log.tags ? log.tags.join(', ') : 'technology')} continue to influence market strategies, scientific research, and infrastructure investments worldwide. Industry researchers and policy analysts emphasize the importance of monitoring long-term impact metrics as adoption expands across sectors.
                </p>
            </div>

            ${wikiLinkHTML}
        `;
    }

    // --- News Feed Grid Filtering & Rendering ---
    function getFilteredLogs() {
        return allLogs.filter(log => {
            if (activeFilters.search) {
                const query = activeFilters.search.toLowerCase();
                const titleMatch = log.title?.toLowerCase().includes(query);
                const descMatch = log.description?.toLowerCase().includes(query);
                const subMatch = log.sys_subtitle?.toLowerCase().includes(query);
                const tagMatch = log.tags?.some(t => t.toLowerCase().includes(query));
                const kwMatch = log.keywords?.some(k => k.toLowerCase().includes(query));
                if (!titleMatch && !descMatch && !subMatch && !tagMatch && !kwMatch) return false;
            }

            if (activeFilters.shard !== 'all') {
                const shard = activeFilters.shard;
                const region = (log.region || '').toLowerCase();
                const tags = (log.tags || []).map(t => t.toLowerCase());

                if (shard === 'tech' && !tags.some(t => ['ai', 'tech', 'software', 'hardware', 'crypto', 'genetics'].includes(t))) {
                    return false;
                }
                if (shard === 'space' && !region.includes('space') && !tags.includes('space') && !tags.includes('astronomy')) {
                    return false;
                }
                if (shard === 'climate' && !tags.some(t => ['climate', 'energy', 'sun', 'physics'].includes(t))) {
                    return false;
                }
                if (shard === 'geopolitics' && !tags.some(t => ['history', 'war', 'pvp', 'politics', 'security', 'diplomacy'].includes(t))) {
                    return false;
                }
                if (shard === 'legacy' && !log.date?.includes('19') && !log.date?.includes('18') && !log.date?.includes('BC') && !log.date?.includes('Ago') && !log.date?.includes('1440') && !log.date?.includes('1347')) {
                    return false;
                }
            }

            return true;
        }).sort((a, b) => {
            if (activeFilters.sort === 'date-desc') {
                return (b.date || '').localeCompare(a.date || '');
            } else {
                return (a.date || '').localeCompare(b.date || '');
            }
        });
    }

    function renderLogs() {
        if (!feedContainer) return;
        const filtered = getFilteredLogs();
        logCountElement.textContent = `Displaying ${filtered.length} Stories`;
        feedContainer.innerHTML = '';

        if (filtered.length === 0) {
            feedContainer.innerHTML = `<div class="no-results" style="padding: 3rem; text-align: center; color: var(--text-muted);">No stories match your search criteria.</div>`;
            return;
        }

        filtered.forEach(log => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.onclick = () => {
                window.location.hash = `#article/${log.id}`;
            };

            const tagsHTML = (log.tags || []).slice(0, 3).map(t => `<span class="tag-item">#${escapeHTML(t)}</span>`).join('');
            const subtitleHTML = log.sys_subtitle ? `<div class="card-sys-subtitle">${escapeHTML(log.sys_subtitle)}</div>` : '';

            card.innerHTML = `
                <div>
                    <div class="card-top-meta">
                        <span class="type-pill ${getTypeClass(log.type)}">${escapeHTML(log.type || 'NEWS')}</span>
                        <span class="card-real-date">${escapeHTML(log.date || 'Present')}</span>
                    </div>

                    <h3 class="card-title">${escapeHTML(log.title)}</h3>
                    ${subtitleHTML}

                    <p class="card-description">${escapeHTML(log.description)}</p>
                </div>

                <div class="card-footer-meta">
                    <span class="card-region">${escapeHTML(log.region || 'Global')}</span>
                    <div class="card-tags">${tagsHTML}</div>
                </div>
            `;

            feedContainer.appendChild(card);
        });
    }

    // --- AI Timeline Stack ---
    function renderAITimeline() {
        const stackContainer = document.getElementById('ai-timeline-stack');
        if (!stackContainer) return;

        stackContainer.innerHTML = '';

        aiTimelineData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'timeline-event-card';
            card.innerHTML = `
                <div class="timeline-event-header">
                    <span class="timeline-event-year">${escapeHTML(item.release_date)} • ${escapeHTML(item.company)}</span>
                    <span class="type-pill type-feature">${escapeHTML(item.type)}</span>
                </div>
                <div class="timeline-event-model">${escapeHTML(item.model)}</div>
                <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 0.75rem;">${escapeHTML(item.description)}</p>
                <div style="font-size: 0.82rem; color: var(--accent-cyan);">
                    Compute: ${escapeHTML(item.compute_flops)} | Impact: ${escapeHTML(item.impact)}
                </div>
            `;
            stackContainer.appendChild(card);
        });
    }

    // --- Database Table Generator ---
    function renderDatabaseTable() {
        if (!databaseTableBody) return;

        databaseTableBody.innerHTML = '';

        allLogs.forEach(log => {
            const tr = document.createElement('tr');
            const wikiLink = log.wiki_url ? `<a href="${escapeHTML(log.wiki_url)}" target="_blank">Wikipedia →</a>` : 'Archive';

            tr.innerHTML = `
                <td style="white-space: nowrap; font-family: var(--font-mono); font-size: 0.82rem;">${escapeHTML(log.date || 'Present')}</td>
                <td>
                    <a href="#article/${log.id}" class="db-row-title">${escapeHTML(log.title)}</a>
                </td>
                <td><span class="type-pill ${getTypeClass(log.type)}">${escapeHTML(log.type || 'NEWS')}</span></td>
                <td>${escapeHTML(log.region || 'Global')}</td>
                <td>${wikiLink}</td>
            `;

            databaseTableBody.appendChild(tr);
        });
    }

    // --- Helper Functions ---
    function getTypeClass(type) {
        if (!type) return 'type-default';
        const t = type.toLowerCase();
        if (t.includes('critical') || t.includes('bug')) return 'type-critical';
        if (t.includes('feature') || t.includes('ai') || t.includes('tech')) return 'type-feature';
        if (t.includes('alert') || t.includes('climate')) return 'type-alert';
        return 'type-default';
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Nav Links
        footerNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetView = link.dataset.view;
                window.location.hash = `#${targetView}`;
            });
        });

        // Shard Filter Buttons
        shardButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                shardButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilters.shard = btn.dataset.shard;
                renderLogs();
            });
        });

        // View Mode Toggles
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilters.viewMode = btn.dataset.mode;
                if (activeFilters.viewMode === 'wire') {
                    feedContainer.classList.add('mode-wire');
                } else {
                    feedContainer.classList.remove('mode-wire');
                }
            });
        });

        // Search Input
        searchInput?.addEventListener('input', (e) => {
            activeFilters.search = e.target.value.trim();
            renderLogs();
        });

        // Sort Select
        sortSelect?.addEventListener('change', (e) => {
            activeFilters.sort = e.target.value;
            renderLogs();
        });
    }

    // Start App
    initSystem();
});
