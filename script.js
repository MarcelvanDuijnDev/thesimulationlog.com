document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // DOM References
    // =========================================================
    const feedContainer      = document.getElementById('feed');
    const logCountElement    = document.getElementById('log-count');
    const heroNewsSection    = document.getElementById('hero-news-section');
    const clockElement       = document.getElementById('live-clock');
    const dateElement        = document.getElementById('live-date');
    const themeToggleBtn     = document.getElementById('theme-toggle');

    // Navigation
    const navTabs        = document.querySelectorAll('.nav-tab[data-view]');
    const footerNavLinks = document.querySelectorAll('.footer-nav-link[data-view]');
    const contentViews   = document.querySelectorAll('.content-view');

    // Article view
    const articlePageContent = document.getElementById('article-page-content');

    // Database view elements
    const databaseTableBody  = document.getElementById('database-table-body');
    const dbGridFeed         = document.getElementById('db-grid-feed');
    const dbTableWrapper     = document.getElementById('db-table-wrapper');
    const dbCountEl          = document.getElementById('db-count');
    const dbSearchInput      = document.getElementById('search-input');
    const dbSortSelect       = document.getElementById('sort-select');
    const dbFilterBtns       = document.querySelectorAll('#db-filter-tabs .filter-btn');
    const dbViewBtns         = document.querySelectorAll('.view-toggle .view-btn');

    // =========================================================
    // State
    // =========================================================
    let allLogs = [];

    // Database-only filter state
    let dbFilters = {
        search:   '',
        shard:    'all',
        sort:     'date-desc',
        viewMode: 'table'   // 'table' | 'grid'
    };

    // AI Timeline static data
    const aiTimelineData = [
        {
            year: "2020",
            model: "GPT-3 (175 Billion Parameters)",
            company: "OpenAI",
            type: "Foundation Model",
            description: "Demonstrated zero-shot and few-shot natural language capabilities across translation, Q&A, and code generation.",
            release_date: "June 2020",
            compute_flops: "3.14e23 FLOPs",
            impact: "Established the scaling law era for massive transformer-based neural networks."
        },
        {
            year: "2022",
            model: "ChatGPT (InstructGPT / RLHF)",
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
            type: "Video & Coding AI",
            description: "Real-time photorealistic video generation (Sora) and high-accuracy software artifact creation by Claude 3.5.",
            release_date: "February 2024",
            compute_flops: "8.5e25 FLOPs",
            impact: "Advanced high-fidelity text-to-video diffusion and autonomous code synthesis."
        },
        {
            year: "2025",
            model: "DeepSeek-R1 & Open-Weights Reasoning",
            company: "DeepSeek / Open Source",
            type: "Reasoning Optimization",
            description: "Ultra-low-compute reasoning model weights published openly, matching top proprietary benchmarks at a fraction of the GPU cost.",
            release_date: "January 2025",
            compute_flops: "1.4e26 FLOPs",
            impact: "Triggered global hardware re-evaluations and democratized frontier reasoning."
        },
        {
            year: "2026",
            model: "Gemini 3.6 & Autonomous Coding Agents",
            company: "Google DeepMind",
            type: "Agentic AI Suite",
            description: "Coding agents autonomously manage workspace files, dependency builds, unit tests, and background task execution inside developer IDEs.",
            release_date: "August 2026",
            compute_flops: "5.2e26 FLOPs",
            impact: "Shifted developer roles from manual code drafting to prompt supervision and review."
        },
        {
            year: "2027+",
            model: "Next-Generation Autonomous Research Models",
            company: "Global Research Consortia",
            type: "AGI Horizon",
            description: "Continuous real-time model retraining and automated scientific hypothesis generation projected across major labs.",
            release_date: "Future Horizon",
            compute_flops: "1.0e28+ FLOPs",
            impact: "Potential transition of research infrastructure toward self-optimizing intelligence."
        }
    ];

    // =========================================================
    // THEME — Light / Dark toggle with localStorage persistence
    // =========================================================
    function initTheme() {
        const saved = localStorage.getItem('sim-log-theme');
        const theme = saved === 'dark' ? 'dark' : 'light';
        applyTheme(theme);
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('sim-log-theme', theme);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    // =========================================================
    // LIVE CLOCK & DATE
    // =========================================================
    function startLiveClock() {
        function update() {
            const now = new Date();
            if (clockElement) {
                clockElement.textContent = now.toISOString().slice(11, 19) + ' UTC';
            }
            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                });
            }
        }
        update();
        setInterval(update, 1000);
    }

    // =========================================================
    // DATA LOADING
    // =========================================================
    async function fetchAllData() {
        try {
            const manifestRes = await fetch('logs/manifest.json');
            if (!manifestRes.ok) throw new Error('manifest not found');
            const manifest = await manifestRes.json();

            const files = [];
            (manifest.years_available || []).forEach(y => files.push(y.file));
            (manifest.eras || []).forEach(e => files.push(e.file));

            const results = await Promise.all(
                files.map(f => fetch(`logs/${f}`).then(r => r.ok ? r.json() : []).catch(() => []))
            );

            allLogs = results.flat().filter(Boolean);

        } catch (err) {
            console.warn('Manifest load failed, falling back to logs.json:', err);
            try {
                const fallback = await fetch('logs.json');
                if (fallback.ok) allLogs = await fallback.json();
            } catch (e) {
                console.error('logs.json fallback also failed:', e);
            }
        }
    }

    // =========================================================
    // ROUTING
    // =========================================================
    function handleRouting() {
        const hash = window.location.hash || '#news';

        if (hash.startsWith('#article/')) {
            const id = hash.replace('#article/', '');
            renderArticlePage(id);
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
            const isTarget = view.id === `view-${viewName}`;
            view.classList.toggle('hidden', !isTarget);
            view.classList.toggle('active', isTarget);
        });

        navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewName);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // =========================================================
    // HERO FEATURED STORY
    // =========================================================
    function renderHeroNewsCard() {
        if (!heroNewsSection) return;

        const lead = allLogs.find(l => l.is_active === true) || allLogs[0];
        if (!lead) { heroNewsSection.innerHTML = ''; return; }

        const subtitleHTML = lead.sys_subtitle
            ? `<div class="hero-sys-subtitle">${escapeHTML(lead.sys_subtitle)}</div>`
            : '';

        heroNewsSection.innerHTML = `
            <div class="hero-news-card">
                <div class="hero-content">
                    <div class="hero-meta-row">
                        <span class="badge-featured">Featured Story</span>
                        <span class="badge-category">${escapeHTML(lead.type || 'News')}</span>
                        <span class="hero-date">${escapeHTML(lead.date || '')} &middot; ${escapeHTML(lead.region || 'Global')}</span>
                    </div>

                    <h2 class="hero-headline">${escapeHTML(lead.title)}</h2>
                    ${subtitleHTML}

                    <p class="hero-description">${escapeHTML(lead.description)}</p>

                    <div class="hero-actions">
                        <a href="#article/${lead.id}" class="btn-primary">Read Full Story &rarr;</a>
                    </div>
                </div>

                <div class="hero-image-placeholder" aria-hidden="true">
                    <span class="hero-img-label">${escapeHTML(lead.type || 'News')}</span>
                </div>
            </div>
        `;
    }

    // =========================================================
    // NEWS GRID (latest stories — no filtering)
    // =========================================================
    function renderNewsGrid() {
        if (!feedContainer) return;

        // Sort by date descending, show all stories
        const sorted = [...allLogs].sort((a, b) =>
            (b.date || '').localeCompare(a.date || '')
        );

        logCountElement.textContent = `${sorted.length} stories`;
        feedContainer.innerHTML = '';

        if (sorted.length === 0) {
            feedContainer.innerHTML = `<div class="no-results">No stories available.</div>`;
            return;
        }

        sorted.forEach(log => {
            feedContainer.appendChild(buildNewsCard(log));
        });
    }

    function buildNewsCard(log) {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.setAttribute('role', 'article');
        card.onclick = () => { window.location.hash = `#article/${log.id}`; };

        const tagsHTML = (log.tags || []).slice(0, 3)
            .map(t => `<span class="tag-item">#${escapeHTML(t)}</span>`).join('');

        const subtitleHTML = log.sys_subtitle
            ? `<div class="card-sys-subtitle">${escapeHTML(log.sys_subtitle)}</div>`
            : '';

        card.innerHTML = `
            <div class="card-image-strip"></div>
            <div class="card-body">
                <div class="card-top-meta">
                    <span class="type-pill ${getTypeClass(log.type)}">${escapeHTML(log.type || 'News')}</span>
                    <span class="card-real-date">${escapeHTML(log.date || '')}</span>
                </div>

                <h3 class="card-title">${escapeHTML(log.title)}</h3>
                ${subtitleHTML}
                <p class="card-description">${escapeHTML(log.description)}</p>

                <div class="card-footer-meta">
                    <span class="card-region">${escapeHTML(log.region || 'Global')}</span>
                    <div class="card-tags">${tagsHTML}</div>
                </div>
            </div>
        `;

        return card;
    }

    // =========================================================
    // FULL ARTICLE PAGE
    // =========================================================
    function renderArticlePage(articleId) {
        if (!articlePageContent) return;

        const log = allLogs.find(l => l.id === articleId) || allLogs[0];

        if (!log) {
            articlePageContent.innerHTML = `
                <div style="padding: 4rem 0; text-align: center;">
                    <h2 style="margin-bottom:1rem;">Story Not Found</h2>
                    <a href="#news" class="btn-primary">Back to Latest News</a>
                </div>`;
            return;
        }

        const wikiLinkHTML = log.wiki_url
            ? `<div class="article-source-box">
                <span class="source-label">Primary Reference &amp; Historical Source:</span>
                <a href="${escapeHTML(log.wiki_url)}" target="_blank" rel="noopener" class="btn-primary">View Wikipedia Reference &rarr;</a>
               </div>`
            : '';

        const tagsList = (log.tags || []).join(', ');

        articlePageContent.innerHTML = `
            <a href="#news" class="back-to-news-link">&larr; Back to Latest News</a>

            <div class="article-category-badge">${escapeHTML(log.type || 'News')}</div>
            <h1 class="article-main-headline">${escapeHTML(log.title)}</h1>

            ${log.sys_subtitle ? `<div class="article-lead-subtitle">${escapeHTML(log.sys_subtitle)}</div>` : ''}

            <div class="article-byline-card">
                <div class="article-author-info">
                    By&nbsp;<span class="article-author-name">${escapeHTML(log.submitted_by || 'Editorial Team')}</span>
                    &nbsp;&middot;&nbsp;
                    <span>${escapeHTML(log.region || 'Global')}</span>
                </div>
                <div>Published: ${escapeHTML(log.date || '')}</div>
            </div>

            <div class="article-key-highlights">
                <div class="highlights-title">Key Highlights</div>
                <div class="highlights-text">${escapeHTML(log.description)}</div>
            </div>

            <div class="article-body-serif">
                <p>${escapeHTML(log.description)}</p>
                <p>
                    Developments in ${escapeHTML(tagsList || 'technology')} continue to shape market strategies, scientific research directions, and infrastructure investments globally. Analysts and policy researchers emphasize monitoring long-term adoption metrics as this technology expands across sectors.
                </p>
            </div>

            ${wikiLinkHTML}
        `;
    }

    // =========================================================
    // AI TIMELINE
    // =========================================================
    function renderAITimeline() {
        const container = document.getElementById('ai-timeline-stack');
        if (!container) return;

        container.innerHTML = '';
        aiTimelineData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'timeline-event-card';
            card.innerHTML = `
                <div class="timeline-event-header">
                    <span class="timeline-event-year">${escapeHTML(item.release_date)} &middot; ${escapeHTML(item.company)}</span>
                    <span class="type-pill type-feature">${escapeHTML(item.type)}</span>
                </div>
                <div class="timeline-event-model">${escapeHTML(item.model)}</div>
                <p class="timeline-event-desc">${escapeHTML(item.description)}</p>
                <div class="timeline-event-impact">
                    Compute: ${escapeHTML(item.compute_flops)} &nbsp;&middot;&nbsp; ${escapeHTML(item.impact)}
                </div>
            `;
            container.appendChild(card);
        });
    }

    // =========================================================
    // DATABASE — filtering, sorting, rendering (table + grid)
    // =========================================================
    function getDbFilteredLogs() {
        return allLogs.filter(log => {
            // Text search
            if (dbFilters.search) {
                const q = dbFilters.search.toLowerCase();
                const matches =
                    log.title?.toLowerCase().includes(q) ||
                    log.description?.toLowerCase().includes(q) ||
                    log.sys_subtitle?.toLowerCase().includes(q) ||
                    log.tags?.some(t => t.toLowerCase().includes(q)) ||
                    log.keywords?.some(k => k.toLowerCase().includes(q));
                if (!matches) return false;
            }

            // Category shard
            if (dbFilters.shard !== 'all') {
                const shard = dbFilters.shard;
                const tags = (log.tags || []).map(t => t.toLowerCase());
                const region = (log.region || '').toLowerCase();

                if (shard === 'tech' && !tags.some(t =>
                    ['ai', 'tech', 'software', 'hardware', 'crypto', 'genetics', 'quantum'].includes(t))) {
                    return false;
                }
                if (shard === 'space' && !region.includes('space') &&
                    !tags.includes('space') && !tags.includes('astronomy')) {
                    return false;
                }
                if (shard === 'climate' && !tags.some(t =>
                    ['climate', 'energy', 'sun', 'physics', 'nuclear'].includes(t))) {
                    return false;
                }
                if (shard === 'geopolitics' && !tags.some(t =>
                    ['history', 'war', 'pvp', 'politics', 'security', 'diplomacy'].includes(t))) {
                    return false;
                }
            }

            return true;

        }).sort((a, b) => {
            if (dbFilters.sort === 'date-asc') {
                return (a.date || '').localeCompare(b.date || '');
            }
            return (b.date || '').localeCompare(a.date || '');
        });
    }

    function renderDatabase() {
        const filtered = getDbFilteredLogs();

        if (dbCountEl) {
            dbCountEl.textContent = `${filtered.length} of ${allLogs.length} records`;
        }

        if (dbFilters.viewMode === 'table') {
            // Show table, hide grid
            if (dbTableWrapper) dbTableWrapper.style.display = '';
            if (dbGridFeed) dbGridFeed.style.display = 'none';
            renderDatabaseTable(filtered);
        } else {
            // Show grid, hide table
            if (dbTableWrapper) dbTableWrapper.style.display = 'none';
            if (dbGridFeed) dbGridFeed.style.display = '';
            renderDatabaseGrid(filtered);
        }
    }

    function renderDatabaseTable(logs) {
        if (!databaseTableBody) return;
        databaseTableBody.innerHTML = '';

        if (logs.length === 0) {
            databaseTableBody.innerHTML = `
                <tr><td colspan="5" class="no-results">No records match your search.</td></tr>`;
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            const wikiLink = log.wiki_url
                ? `<a href="${escapeHTML(log.wiki_url)}" target="_blank" rel="noopener">Wikipedia &rarr;</a>`
                : '<span style="color:var(--text-xmuted)">—</span>';

            tr.innerHTML = `
                <td style="white-space:nowrap;font-family:var(--font-mono);font-size:0.8rem;">
                    ${escapeHTML(log.date || '')}
                </td>
                <td>
                    <a href="#article/${log.id}" class="db-row-title">${escapeHTML(log.title)}</a>
                </td>
                <td>
                    <span class="type-pill ${getTypeClass(log.type)}">${escapeHTML(log.type || 'News')}</span>
                </td>
                <td>${escapeHTML(log.region || 'Global')}</td>
                <td>${wikiLink}</td>
            `;
            databaseTableBody.appendChild(tr);
        });
    }

    function renderDatabaseGrid(logs) {
        if (!dbGridFeed) return;
        dbGridFeed.innerHTML = '';

        if (logs.length === 0) {
            dbGridFeed.innerHTML = `<div class="no-results">No records match your search.</div>`;
            return;
        }

        logs.forEach(log => {
            dbGridFeed.appendChild(buildNewsCard(log));
        });
    }

    // =========================================================
    // HELPERS
    // =========================================================
    function getTypeClass(type) {
        if (!type) return 'type-default';
        const t = type.toLowerCase();
        if (t.includes('critical') || t.includes('bug') || t.includes('war') || t.includes('crisis')) return 'type-critical';
        if (t.includes('feature') || t.includes('ai') || t.includes('tech') || t.includes('model')) return 'type-feature';
        if (t.includes('alert') || t.includes('climate') || t.includes('energy')) return 'type-alert';
        return 'type-default';
    }

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // =========================================================
    // EVENT LISTENERS
    // =========================================================
    function setupEventListeners() {
        // Theme toggle
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }

        // Footer nav links
        footerNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                window.location.hash = `#${link.dataset.view}`;
            });
        });

        // Database — search
        if (dbSearchInput) {
            dbSearchInput.addEventListener('input', e => {
                dbFilters.search = e.target.value.trim();
                renderDatabase();
            });
        }

        // Database — sort
        if (dbSortSelect) {
            dbSortSelect.addEventListener('change', e => {
                dbFilters.sort = e.target.value;
                renderDatabase();
            });
        }

        // Database — category filters
        dbFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dbFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                dbFilters.shard = btn.dataset.shard;
                renderDatabase();
            });
        });

        // Database — view mode (table / grid)
        dbViewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dbViewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                dbFilters.viewMode = btn.dataset.mode;
                renderDatabase();
            });
        });
    }

    // =========================================================
    // INIT
    // =========================================================
    async function init() {
        initTheme();
        startLiveClock();
        await fetchAllData();
        renderHeroNewsCard();
        renderNewsGrid();
        renderAITimeline();
        renderDatabase();
        setupEventListeners();
        handleRouting();
        window.addEventListener('hashchange', handleRouting);
    }

    init();
});
