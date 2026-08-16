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

    const navTabs        = document.querySelectorAll('.nav-tab[data-view]');
    const footerNavLinks = document.querySelectorAll('.footer-nav-link[data-view]');
    const contentViews   = document.querySelectorAll('.content-view');

    const articlePageContent = document.getElementById('article-page-content');

    const databaseTableBody  = document.getElementById('database-table-body');
    const dbGridFeed         = document.getElementById('db-grid-feed');
    const dbTableWrapper     = document.getElementById('db-table-wrapper');
    const dbCountEl          = document.getElementById('db-count');
    const dbSearchInput      = document.getElementById('search-input');
    const dbSortSelect       = document.getElementById('sort-select');
    const dbFilterBtns       = document.querySelectorAll('#db-filter-tabs .filter-btn');
    const dbViewBtns         = document.querySelectorAll('.view-toggle .view-btn');

    // =========================================================
    // App State
    // =========================================================
    let allLogs = [];

    let dbFilters = {
        search:   '',
        shard:    'all',
        sort:     'date-desc',
        viewMode: 'table'
    };

    // =========================================================
    // AI TIMELINE DATA — Rich, verified model data
    // =========================================================
    const aiTimelineData = [
        {
            year: 2020,
            model: "GPT-3",
            subtitle: "175 Billion Parameters — The Scale Breakthrough",
            company: "OpenAI",
            company_color: "#10a37f",
            type: "Foundation Model",
            release_date: "June 2020",
            compute: "3.14 × 10²³",
            params: "175B",
            context: "4,096 tokens",
            benchmark: "MMLU ~60%",
            description: "GPT-3 established that scale alone — no task-specific training — could unlock emergent natural language abilities. Zero-shot and few-shot generation, translation, and code synthesis emerged as parameter counts crossed the 100-billion threshold.",
            impact: "Demonstrated the scaling law hypothesis and launched the modern race for large language models across every major AI lab.",
            real: true
        },
        {
            year: 2022,
            model: "ChatGPT",
            subtitle: "100 Million Users in 60 Days — Consumer AI Arrives",
            company: "OpenAI",
            company_color: "#10a37f",
            type: "Consumer Breakout",
            release_date: "November 2022",
            compute: "1.2 × 10²⁴",
            params: "~20B (est.)",
            context: "4,096 tokens",
            benchmark: "RLHF alignment",
            description: "Reinforcement Learning from Human Feedback (RLHF) transformed a powerful but inconsistent language model into a reliable conversational assistant. The public launch triggered the fastest adoption curve of any consumer technology in history.",
            impact: "Ended the expert-only era of AI. Forced Google, Meta, and Anthropic to accelerate public model releases by 12–18 months.",
            real: true
        },
        {
            year: 2023,
            model: "GPT-4 & Gemini Ultra",
            subtitle: "Multimodal Reasoning — Professional Exam Performance",
            company: "OpenAI / Google DeepMind",
            company_color: "#4285f4",
            type: "Multimodal Frontier",
            release_date: "March 2023",
            compute: "2.1 × 10²⁵",
            params: "~1T (est., MoE)",
            context: "128,000 tokens",
            benchmark: "Bar Exam top 10%",
            description: "GPT-4 and Gemini Ultra independently cleared professional licensing exams in law, medicine, and finance. Extended context windows, image understanding, and chain-of-thought reasoning elevated AI from chat tool to knowledge professional.",
            impact: "Established AI as capable of passing professional credentialing standards, triggering regulatory and licensing debates worldwide.",
            real: true
        },
        {
            year: 2024,
            model: "Claude 3.5 Sonnet & Sora",
            subtitle: "Coding AI & Photorealistic Video Generation",
            company: "Anthropic / OpenAI",
            company_color: "#d4a574",
            type: "Video & Code AI",
            release_date: "June 2024",
            compute: "8.5 × 10²⁵",
            params: "~70B (Claude est.)",
            context: "200,000 tokens",
            benchmark: "HumanEval 92%",
            description: "Claude 3.5 Sonnet achieved near-human code synthesis on standardised benchmarks and introduced computer-use APIs allowing agents to operate graphical interfaces. Simultaneously, Sora demonstrated minute-long photorealistic video generation from text prompts with coherent physics.",
            impact: "Marked the beginning of AI-driven software development pipelines, with agentic coding assistants replacing boilerplate work across the industry.",
            real: true
        },
        {
            year: 2025,
            model: "DeepSeek-R1",
            subtitle: "Open-Weights Reasoning at Fraction of Compute Cost",
            company: "DeepSeek",
            company_color: "#e74c3c",
            type: "Reasoning Optimization",
            release_date: "January 2025",
            compute: "1.4 × 10²⁶",
            params: "671B (MoE, 37B active)",
            context: "64,000 tokens",
            benchmark: "AIME 2024: 79.8%",
            description: "DeepSeek-R1 published fully open weights that matched or exceeded GPT-4o on mathematical and scientific reasoning benchmarks, trained at approximately 5% of the estimated compute cost of comparable proprietary models. The release exposed the gap between model capability and training efficiency.",
            impact: "Triggered a global re-evaluation of AI hardware procurement strategies. Nvidia lost $590B in market cap in a single trading session.",
            real: true
        },
        {
            year: 2026,
            model: "Gemini 3.6 & Autonomous Agents",
            subtitle: "IDE-Integrated Coding Agents — Subagent Task Execution",
            company: "Google DeepMind",
            company_color: "#4285f4",
            type: "Agentic AI Suite",
            release_date: "August 2026",
            compute: "5.2 × 10²⁶",
            params: "~2T+ (est.)",
            context: "1M+ tokens",
            benchmark: "SWE-Bench 78%+",
            description: "Gemini 3.6 and companion agentic IDE systems autonomously manage workspace files, write and run test suites, install dependencies, spawn background subagents, and resolve multi-file bugs across full repositories without developer intervention in the loop.",
            impact: "Shifted software engineering from code authorship to agent supervision. Teams of one developer now manage codebases previously requiring 5–10 engineers.",
            real: true
        },
        {
            year: 2027,
            model: "Next-Generation Research Models",
            subtitle: "Projected — Autonomous Scientific Hypothesis Generation",
            company: "Global Research Consortia",
            company_color: "#9ca3af",
            type: "AGI Horizon",
            release_date: "Projected 2027+",
            compute: "~10²⁸ (projected)",
            params: "Unknown",
            context: "Unlimited (projected)",
            benchmark: "TBD",
            description: "Projected next-generation systems capable of continuous real-time retraining from live data, automated experimental design, and hypothesis verification. Early prototypes from multiple labs show partial achievement of self-directed research on narrow problem domains.",
            impact: "Would represent the first AI systems capable of independently advancing scientific knowledge without human experimental design.",
            real: false
        }
    ];

    // Graph data — exact positions for the interactive compute chart
    // Each entry ties to a modelIdx in aiTimelineData (null = minor milestone)
    const graphPoints = [
        { year: 2018.5,  label: "GPT (117M)",          compute: 4.6e19,  modelIdx: null, real: true },
        { year: 2019.5,  label: "GPT-2 (1.5B)",         compute: 1.5e22,  modelIdx: null, real: true },
        { year: 2020.5,  label: "GPT-3",                 compute: 3.14e23, modelIdx: 0,    real: true },
        { year: 2021.5,  label: "Codex / DALL-E 2",      compute: 6e23,    modelIdx: null, real: true },
        { year: 2022.4,  label: "ChatGPT",               compute: 1.2e24,  modelIdx: 1,    real: true },
        { year: 2022.9,  label: "PaLM (540B)",           compute: 2.5e24,  modelIdx: null, real: true },
        { year: 2023.25, label: "GPT-4",                 compute: 2.1e25,  modelIdx: 2,    real: true },
        { year: 2023.75, label: "Gemini Ultra",          compute: 5e25,    modelIdx: null, real: true },
        { year: 2024.25, label: "Claude 3.5 / Sora",    compute: 8.5e25,  modelIdx: 3,    real: true },
        { year: 2024.75, label: "Llama 3.1 (405B)",     compute: 1.1e26,  modelIdx: null, real: true },
        { year: 2025.0,  label: "DeepSeek-R1",          compute: 1.4e26,  modelIdx: 4,    real: true },
        { year: 2025.75, label: "Llama 4 / Phi-5",      compute: 2.8e26,  modelIdx: null, real: true },
        { year: 2026.5,  label: "Gemini 3.6",           compute: 5.2e26,  modelIdx: 5,    real: true },
        { year: 2027.25, label: "Next-Gen (Projected)", compute: 2e28,    modelIdx: 6,    real: false }
    ];

    // =========================================================
    // THEME TOGGLE
    // =========================================================
    function initTheme() {
        const saved = localStorage.getItem('sim-log-theme') || 'light';
        applyTheme(saved);
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
    // CLOCK & DATE
    // =========================================================
    function startLiveClock() {
        function update() {
            const now = new Date();
            if (clockElement) clockElement.textContent = now.toISOString().slice(11, 19) + ' UTC';
            if (dateElement) dateElement.textContent = now.toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
            });
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

            const files = [
                ...(manifest.years_available || []).map(y => y.file),
                ...(manifest.eras || []).map(e => e.file)
            ];

            const results = await Promise.all(
                files.map(f => fetch(`logs/${f}`).then(r => r.ok ? r.json() : []).catch(() => []))
            );
            allLogs = results.flat().filter(Boolean);

        } catch (err) {
            console.warn('Manifest load failed, falling back to logs.json');
            try {
                const fb = await fetch('logs.json');
                if (fb.ok) allLogs = await fb.json();
            } catch (e) {
                console.error('logs.json also failed:', e);
            }
        }
    }

    // =========================================================
    // ROUTING
    // =========================================================
    function handleRouting() {
        const hash = window.location.hash || '#news';
        if (hash.startsWith('#article/')) {
            renderArticlePage(hash.replace('#article/', ''));
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
        contentViews.forEach(v => {
            const match = v.id === `view-${viewName}`;
            v.classList.toggle('hidden', !match);
            v.classList.toggle('active', match);
        });
        navTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.view === viewName));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // =========================================================
    // HERO SECTION
    // =========================================================
    function renderHeroNewsCard() {
        if (!heroNewsSection) return;
        const lead = allLogs.find(l => l.is_active === true) || allLogs[0];
        if (!lead) { heroNewsSection.innerHTML = ''; return; }

        heroNewsSection.innerHTML = `
            <div class="hero-news-card">
                <div class="hero-content">
                    <div class="hero-meta-row">
                        <span class="badge-featured">Featured Story</span>
                        <span class="badge-category">${escapeHTML(lead.type || 'News')}</span>
                        <span class="hero-date">${escapeHTML(lead.date || '')} &middot; ${escapeHTML(lead.region || 'Global')}</span>
                    </div>
                    <h2 class="hero-headline">${escapeHTML(lead.title)}</h2>
                    ${lead.sys_subtitle ? `<div class="hero-sys-subtitle">${escapeHTML(lead.sys_subtitle)}</div>` : ''}
                    <p class="hero-description">${escapeHTML(lead.description)}</p>
                    <div class="hero-actions">
                        <a href="#article/${lead.id}" class="btn-primary">Read Full Story &rarr;</a>
                    </div>
                </div>
                <div class="hero-image-placeholder" aria-hidden="true">
                    <span class="hero-img-label">${escapeHTML(lead.type || 'News')}</span>
                </div>
            </div>`;
    }

    // =========================================================
    // NEWS GRID
    // =========================================================
    function renderNewsGrid() {
        if (!feedContainer) return;
        const sorted = [...allLogs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        logCountElement.textContent = `${sorted.length} stories`;
        feedContainer.innerHTML = '';
        sorted.forEach(log => feedContainer.appendChild(buildNewsCard(log)));
    }

    function buildNewsCard(log) {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.setAttribute('role', 'article');
        card.onclick = () => { window.location.hash = `#article/${log.id}`; };

        const tagsHTML = (log.tags || []).slice(0, 3)
            .map(t => `<span class="tag-item">#${escapeHTML(t)}</span>`).join('');

        card.innerHTML = `
            <div class="card-image-strip"></div>
            <div class="card-body">
                <div class="card-top-meta">
                    <span class="type-pill ${getTypeClass(log.type)}">${escapeHTML(log.type || 'News')}</span>
                    <span class="card-real-date">${escapeHTML(log.date || '')}</span>
                </div>
                <h3 class="card-title">${escapeHTML(log.title)}</h3>
                ${log.sys_subtitle ? `<div class="card-sys-subtitle">${escapeHTML(log.sys_subtitle)}</div>` : ''}
                <p class="card-description">${escapeHTML(log.description)}</p>
                <div class="card-footer-meta">
                    <span class="card-region">${escapeHTML(log.region || 'Global')}</span>
                    <div class="card-tags">${tagsHTML}</div>
                </div>
            </div>`;
        return card;
    }

    // =========================================================
    // ARTICLE PAGE
    // =========================================================
    function renderArticlePage(articleId) {
        if (!articlePageContent) return;
        const log = allLogs.find(l => l.id === articleId) || allLogs[0];

        if (!log) {
            articlePageContent.innerHTML = `<div style="padding:4rem 0;text-align:center;">
                <h2 style="margin-bottom:1rem;">Story Not Found</h2>
                <a href="#news" class="btn-primary">Back to Latest News</a></div>`;
            return;
        }

        articlePageContent.innerHTML = `
            <a href="#news" class="back-to-news-link">&larr; Back to Latest News</a>
            <div class="article-category-badge">${escapeHTML(log.type || 'News')}</div>
            <h1 class="article-main-headline">${escapeHTML(log.title)}</h1>
            ${log.sys_subtitle ? `<div class="article-lead-subtitle">${escapeHTML(log.sys_subtitle)}</div>` : ''}
            <div class="article-byline-card">
                <div class="article-author-info">
                    By&nbsp;<span class="article-author-name">${escapeHTML(log.submitted_by || 'Editorial Team')}</span>
                    &nbsp;&middot;&nbsp;<span>${escapeHTML(log.region || 'Global')}</span>
                </div>
                <div>Published: ${escapeHTML(log.date || '')}</div>
            </div>
            <div class="article-key-highlights">
                <div class="highlights-title">Key Highlights</div>
                <div class="highlights-text">${escapeHTML(log.description)}</div>
            </div>
            <div class="article-body-serif">
                <p>${escapeHTML(log.description)}</p>
                <p>Developments in ${escapeHTML((log.tags || []).join(', ') || 'technology')} continue to shape market strategies, scientific research directions, and infrastructure investments globally. Analysts and policy researchers emphasize monitoring long-term adoption metrics as this technology expands across sectors.</p>
            </div>
            ${log.wiki_url ? `<div class="article-source-box">
                <span class="source-label">Primary Reference &amp; Historical Source:</span>
                <a href="${escapeHTML(log.wiki_url)}" target="_blank" rel="noopener" class="btn-primary">View Wikipedia Reference &rarr;</a>
            </div>` : ''}`;
    }

    // =========================================================
    // INTERACTIVE AI GRAPH — JS-built logarithmic SVG chart
    // =========================================================
    function buildAIGraph() {
        const container = document.getElementById('ai-graph-container');
        if (!container) return;
        container.innerHTML = '';

        // Floating HTML tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'graph-tooltip';
        tooltip.style.display = 'none';
        container.appendChild(tooltip);

        const NS = 'http://www.w3.org/2000/svg';

        // Layout constants
        const W = 900, H = 320;
        const PAD = { top: 25, right: 35, bottom: 62, left: 78 };
        const CW = W - PAD.left - PAD.right;
        const CH = H - PAD.top - PAD.bottom;

        const X_MIN = 2018, X_MAX = 2028;
        const LOG_MIN = 19, LOG_MAX = 29;

        const xPos  = y  => PAD.left + (y - X_MIN) / (X_MAX - X_MIN) * CW;
        const yPos  = fl => PAD.top  + CH - Math.max(0, Math.min(1, (Math.log10(fl) - LOG_MIN) / (LOG_MAX - LOG_MIN))) * CH;

        // Create SVG
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.display = 'block';
        svg.style.overflow = 'visible';

        // === DEFS — Area gradient ===
        const defs = document.createElementNS(NS, 'defs');

        const makeGrad = (id, color, opacity0, opacity1) => {
            const g = document.createElementNS(NS, 'linearGradient');
            g.setAttribute('id', id);
            g.setAttribute('x1', '0'); g.setAttribute('y1', '0');
            g.setAttribute('x2', '0'); g.setAttribute('y2', '1');
            [[`${opacity0}`, '0%'], [`${opacity1}`, '100%']].forEach(([op, off]) => {
                const s = document.createElementNS(NS, 'stop');
                s.setAttribute('offset', off);
                s.setAttribute('stop-color', color);
                s.setAttribute('stop-opacity', op);
                g.appendChild(s);
            });
            return g;
        };
        defs.appendChild(makeGrad('chartAreaGrad', '#1d4ed8', '0.12', '0.01'));
        svg.appendChild(defs);

        // === Y-AXIS GRID LINES & LABELS ===
        const yDecades = [20, 21, 22, 23, 24, 25, 26, 27, 28];
        const yLabels  = ['10²⁰', '10²¹', '10²²', '10²³', '10²⁴', '10²⁵', '10²⁶', '10²⁷', '10²⁸'];

        yDecades.forEach((dec, i) => {
            if (dec < LOG_MIN || dec > LOG_MAX) return;
            const y = PAD.top + CH - (dec - LOG_MIN) / (LOG_MAX - LOG_MIN) * CH;

            const gl = document.createElementNS(NS, 'line');
            gl.setAttribute('x1', PAD.left); gl.setAttribute('y1', y);
            gl.setAttribute('x2', PAD.left + CW); gl.setAttribute('y2', y);
            gl.setAttribute('stroke', 'currentColor');
            gl.setAttribute('stroke-width', '1');
            gl.setAttribute('class', 'svg-grid-line');
            svg.appendChild(gl);

            const lbl = document.createElementNS(NS, 'text');
            lbl.setAttribute('x', PAD.left - 8);
            lbl.setAttribute('y', y + 4);
            lbl.setAttribute('text-anchor', 'end');
            lbl.setAttribute('class', 'svg-label axis-left');
            lbl.textContent = yLabels[i];
            svg.appendChild(lbl);
        });

        // Y-axis title
        const yTitle = document.createElementNS(NS, 'text');
        yTitle.setAttribute('transform', `rotate(-90)`);
        yTitle.setAttribute('x', -(PAD.top + CH / 2));
        yTitle.setAttribute('y', 14);
        yTitle.setAttribute('text-anchor', 'middle');
        yTitle.setAttribute('class', 'svg-label');
        yTitle.textContent = 'Training Compute (FLOPs)';
        svg.appendChild(yTitle);

        // === X-AXIS LABELS ===
        [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].forEach(yr => {
            const x = xPos(yr);

            const tick = document.createElementNS(NS, 'line');
            tick.setAttribute('x1', x); tick.setAttribute('y1', PAD.top + CH);
            tick.setAttribute('x2', x); tick.setAttribute('y2', PAD.top + CH + 5);
            tick.setAttribute('stroke', 'currentColor'); tick.setAttribute('class', 'svg-grid-line');
            svg.appendChild(tick);

            const lbl = document.createElementNS(NS, 'text');
            lbl.setAttribute('x', x);
            lbl.setAttribute('y', PAD.top + CH + 18);
            lbl.setAttribute('text-anchor', 'middle');
            lbl.setAttribute('class', 'svg-label axis-bot');
            lbl.textContent = yr;
            svg.appendChild(lbl);
        });

        // === AXES ===
        const drawLine = (x1, y1, x2, y2, cls) => {
            const l = document.createElementNS(NS, 'line');
            l.setAttribute('x1', x1); l.setAttribute('y1', y1);
            l.setAttribute('x2', x2); l.setAttribute('y2', y2);
            l.setAttribute('class', cls);
            svg.appendChild(l);
        };
        drawLine(PAD.left, PAD.top, PAD.left, PAD.top + CH, 'svg-grid-line');
        drawLine(PAD.left, PAD.top + CH, PAD.left + CW, PAD.top + CH, 'svg-grid-line');

        // === AREA FILL (real data only) ===
        const realPts = graphPoints.filter(p => p.real);
        let areaD = `M ${xPos(realPts[0].year)} ${PAD.top + CH} L ${xPos(realPts[0].year)} ${yPos(realPts[0].compute)}`;
        realPts.forEach((p, i) => { if (i > 0) areaD += ` L ${xPos(p.year)} ${yPos(p.compute)}`; });
        areaD += ` L ${xPos(realPts[realPts.length - 1].year)} ${PAD.top + CH} Z`;

        const area = document.createElementNS(NS, 'path');
        area.setAttribute('d', areaD);
        area.setAttribute('fill', 'url(#chartAreaGrad)');
        svg.appendChild(area);

        // === MAIN CONFIRMED LINE (animated draw) ===
        let lineD = '';
        realPts.forEach((p, i) => { lineD += `${i === 0 ? 'M' : 'L'} ${xPos(p.year)} ${yPos(p.compute)} `; });

        const mainPath = document.createElementNS(NS, 'path');
        mainPath.setAttribute('d', lineD);
        mainPath.setAttribute('fill', 'none');
        mainPath.setAttribute('stroke', 'var(--accent-primary)');
        mainPath.setAttribute('stroke-width', '2.5');
        mainPath.setAttribute('stroke-linecap', 'round');
        mainPath.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(mainPath);

        // Animate line draw
        requestAnimationFrame(() => {
            try {
                const len = mainPath.getTotalLength();
                mainPath.style.strokeDasharray = len;
                mainPath.style.strokeDashoffset = len;
                mainPath.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)';
                requestAnimationFrame(() => { mainPath.style.strokeDashoffset = '0'; });
            } catch (e) {}
        });

        // === PROJECTED DASHED LINE ===
        const lastReal = realPts[realPts.length - 1];
        const projPt   = graphPoints.find(p => !p.real);
        if (projPt) {
            const projPath = document.createElementNS(NS, 'path');
            projPath.setAttribute('d', `M ${xPos(lastReal.year)} ${yPos(lastReal.compute)} L ${xPos(projPt.year)} ${yPos(projPt.compute)}`);
            projPath.setAttribute('fill', 'none');
            projPath.setAttribute('stroke', 'var(--accent-amber)');
            projPath.setAttribute('stroke-width', '2');
            projPath.setAttribute('stroke-dasharray', '7 4');
            projPath.setAttribute('stroke-linecap', 'round');
            projPath.style.opacity = '0.7';
            svg.appendChild(projPath);
        }

        // === NODES ===
        graphPoints.forEach((p, pointIdx) => {
            const x = xPos(p.year);
            const y = yPos(p.compute);
            const isKey    = p.modelIdx !== null;
            const isFuture = !p.real;

            // Halo ring for key model nodes
            if (isKey) {
                const ring = document.createElementNS(NS, 'circle');
                ring.setAttribute('cx', x); ring.setAttribute('cy', y);
                ring.setAttribute('r', isFuture ? '11' : '13');
                ring.setAttribute('fill', isFuture ? 'var(--accent-amber)' : 'var(--accent-primary)');
                ring.setAttribute('fill-opacity', '0.08');
                ring.style.pointerEvents = 'none';
                svg.appendChild(ring);
            }

            // Main node circle
            const circle = document.createElementNS(NS, 'circle');
            circle.setAttribute('cx', x); circle.setAttribute('cy', y);
            circle.setAttribute('r', isKey ? '6' : '4');
            circle.setAttribute('class', isFuture ? 'svg-node future' : (isKey ? 'svg-node key' : 'svg-node'));
            svg.appendChild(circle);

            // Small label above key nodes
            if (isKey) {
                const shortLabel = p.label.split('/')[0].trim();
                const txtLabel = document.createElementNS(NS, 'text');
                txtLabel.setAttribute('x', x);
                txtLabel.setAttribute('y', y - 12);
                txtLabel.setAttribute('text-anchor', 'middle');
                txtLabel.setAttribute('class', 'svg-label key-label');
                txtLabel.textContent = shortLabel;
                svg.appendChild(txtLabel);
            }

            // Hover / click events
            const interactRadius = isKey ? 14 : 9;
            const hitArea = document.createElementNS(NS, 'circle');
            hitArea.setAttribute('cx', x); hitArea.setAttribute('cy', y);
            hitArea.setAttribute('r', interactRadius);
            hitArea.setAttribute('fill', 'transparent');
            hitArea.style.cursor = isKey ? 'pointer' : 'crosshair';
            svg.appendChild(hitArea);

            hitArea.addEventListener('mouseenter', () => {
                circle.setAttribute('r', isKey ? '8' : '5.5');
                showGraphTooltip(p, x, y, container, tooltip, svg);
            });

            hitArea.addEventListener('mouseleave', () => {
                circle.setAttribute('r', isKey ? '6' : '4');
                tooltip.style.display = 'none';
            });

            hitArea.addEventListener('mousemove', (e) => {
                positionGraphTooltip(e, container, tooltip);
            });

            if (isKey) {
                hitArea.addEventListener('click', () => {
                    const card = document.getElementById(`tl-card-${p.modelIdx}`);
                    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            }
        });

        container.appendChild(svg);
    }

    function showGraphTooltip(point, svgX, svgY, container, tooltip) {
        const logVal = Math.log10(point.compute);
        const isProjected = !point.real;

        tooltip.innerHTML = `
            <div class="gt-model">${escapeHTML(point.label)}</div>
            <div class="gt-company">${Math.floor(point.year)}</div>
            <div class="gt-row"><span>Compute</span><strong>~10<sup>${logVal.toFixed(1)}</sup> FLOPs</strong></div>
            ${isProjected ? '<div class="gt-proj">Projected</div>' : ''}
            ${point.modelIdx !== null ? '<div style="font-size:0.7rem;margin-top:0.4rem;opacity:0.6;">Click to view model card</div>' : ''}
        `;
        tooltip.style.display = 'block';
    }

    function positionGraphTooltip(e, container, tooltip) {
        const rect = container.getBoundingClientRect();
        let x = e.clientX - rect.left + 14;
        let y = e.clientY - rect.top  - 50;
        const tw = tooltip.offsetWidth || 180;
        if (x + tw > rect.width - 8) x = e.clientX - rect.left - tw - 14;
        if (y < 4) y = e.clientY - rect.top + 16;
        tooltip.style.left = x + 'px';
        tooltip.style.top  = y + 'px';
    }

    // =========================================================
    // RICH TIMELINE CARDS
    // =========================================================
    function renderAITimeline() {
        const container = document.getElementById('ai-timeline-stack');
        if (!container) return;
        container.innerHTML = '';

        aiTimelineData.forEach((item, idx) => {
            const isFuture = !item.real;

            const wrapper = document.createElement('div');
            wrapper.className = `tl-item${isFuture ? ' future' : ''}`;

            // Dot on the line
            const dot = document.createElement('div');
            dot.className = 'tl-dot';
            wrapper.appendChild(dot);

            // Card
            const card = document.createElement('div');
            card.className = 'tl-card';
            card.id = `tl-card-${idx}`;

            const badgesHTML = `
                <div class="tl-badges">
                    ${isFuture ? '<span class="tl-future-badge">Projected</span>' : ''}
                    <span class="tl-type-badge">${escapeHTML(item.type)}</span>
                    <span class="tl-company" style="color:${item.company_color};">${escapeHTML(item.company)}</span>
                </div>`;

            card.innerHTML = `
                <div class="tl-header">
                    <span class="tl-year-badge">${escapeHTML(item.release_date)}</span>
                    ${badgesHTML}
                </div>

                <div class="tl-model-name">${escapeHTML(item.model)}</div>
                <div class="tl-model-sub">${escapeHTML(item.subtitle)}</div>

                <div class="tl-stats">
                    <div class="tl-stat">
                        <span class="tl-stat-label">Parameters</span>
                        <span class="tl-stat-value">${escapeHTML(item.params)}</span>
                    </div>
                    <div class="tl-stat">
                        <span class="tl-stat-label">Context</span>
                        <span class="tl-stat-value">${escapeHTML(item.context)}</span>
                    </div>
                    <div class="tl-stat">
                        <span class="tl-stat-label">Compute</span>
                        <span class="tl-stat-value">${escapeHTML(item.compute)}</span>
                    </div>
                    <div class="tl-stat">
                        <span class="tl-stat-label">Benchmark</span>
                        <span class="tl-stat-value">${escapeHTML(item.benchmark)}</span>
                    </div>
                </div>

                <p class="tl-desc">${escapeHTML(item.description)}</p>

                <div class="tl-impact">
                    <span class="tl-impact-label">Impact</span>
                    <span>${escapeHTML(item.impact)}</span>
                </div>`;

            wrapper.appendChild(card);
            container.appendChild(wrapper);
        });
    }

    // =========================================================
    // DATABASE — filter, sort, render (table + grid)
    // =========================================================
    function getDbFilteredLogs() {
        return allLogs.filter(log => {
            if (dbFilters.search) {
                const q = dbFilters.search.toLowerCase();
                const hit = log.title?.toLowerCase().includes(q) ||
                    log.description?.toLowerCase().includes(q) ||
                    log.sys_subtitle?.toLowerCase().includes(q) ||
                    log.tags?.some(t => t.toLowerCase().includes(q)) ||
                    log.keywords?.some(k => k.toLowerCase().includes(q));
                if (!hit) return false;
            }

            if (dbFilters.shard !== 'all') {
                const shard = dbFilters.shard;
                const tags   = (log.tags || []).map(t => t.toLowerCase());
                const region = (log.region || '').toLowerCase();

                if (shard === 'tech' && !tags.some(t => ['ai', 'tech', 'software', 'hardware', 'crypto', 'genetics', 'quantum'].includes(t))) return false;
                if (shard === 'space' && !region.includes('space') && !tags.includes('space') && !tags.includes('astronomy')) return false;
                if (shard === 'climate' && !tags.some(t => ['climate', 'energy', 'sun', 'physics', 'nuclear'].includes(t))) return false;
                if (shard === 'geopolitics' && !tags.some(t => ['history', 'war', 'pvp', 'politics', 'security', 'diplomacy'].includes(t))) return false;
            }

            return true;
        }).sort((a, b) =>
            dbFilters.sort === 'date-asc'
                ? (a.date || '').localeCompare(b.date || '')
                : (b.date || '').localeCompare(a.date || '')
        );
    }

    function renderDatabase() {
        const filtered = getDbFilteredLogs();
        if (dbCountEl) dbCountEl.textContent = `${filtered.length} of ${allLogs.length} records`;

        if (dbFilters.viewMode === 'table') {
            if (dbTableWrapper) dbTableWrapper.style.display = '';
            if (dbGridFeed)     dbGridFeed.style.display = 'none';
            renderDatabaseTable(filtered);
        } else {
            if (dbTableWrapper) dbTableWrapper.style.display = 'none';
            if (dbGridFeed)     dbGridFeed.style.display = '';
            renderDatabaseGrid(filtered);
        }
    }

    function renderDatabaseTable(logs) {
        if (!databaseTableBody) return;
        databaseTableBody.innerHTML = '';
        if (logs.length === 0) {
            databaseTableBody.innerHTML = `<tr><td colspan="5" class="no-results">No records match your search.</td></tr>`;
            return;
        }
        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space:nowrap;font-family:var(--font-mono);font-size:0.8rem;">${escapeHTML(log.date || '')}</td>
                <td><a href="#article/${log.id}" class="db-row-title">${escapeHTML(log.title)}</a></td>
                <td><span class="type-pill ${getTypeClass(log.type)}">${escapeHTML(log.type || 'News')}</span></td>
                <td>${escapeHTML(log.region || 'Global')}</td>
                <td>${log.wiki_url ? `<a href="${escapeHTML(log.wiki_url)}" target="_blank" rel="noopener">Wikipedia &rarr;</a>` : '<span style="color:var(--text-xmuted)">—</span>'}</td>`;
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
        logs.forEach(log => dbGridFeed.appendChild(buildNewsCard(log)));
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
        if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

        footerNavLinks.forEach(link => {
            link.addEventListener('click', () => { window.location.hash = `#${link.dataset.view}`; });
        });

        if (dbSearchInput) dbSearchInput.addEventListener('input', e => { dbFilters.search = e.target.value.trim(); renderDatabase(); });
        if (dbSortSelect) dbSortSelect.addEventListener('change', e => { dbFilters.sort = e.target.value; renderDatabase(); });

        dbFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dbFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                dbFilters.shard = btn.dataset.shard;
                renderDatabase();
            });
        });

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
        buildAIGraph();
        renderDatabase();
        setupEventListeners();
        handleRouting();
        window.addEventListener('hashchange', handleRouting);
    }

    init();
});
