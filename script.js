document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const feedContainer = document.getElementById('feed');
    const logCountElement = document.getElementById('log-count');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const heroNewsSection = document.getElementById('hero-news-section');
    const tickerContent = document.getElementById('ticker-content');
    const clockElement = document.getElementById('live-clock');

    // Navigation & Views
    const navTabs = document.querySelectorAll('.nav-tab[data-view]');
    const footerNavLinks = document.querySelectorAll('.footer-nav-link[data-view]');
    const contentViews = document.querySelectorAll('.content-view');
    const shardButtons = document.querySelectorAll('.shard-btn');
    const viewButtons = document.querySelectorAll('.view-btn');

    // Modals
    const diagnosticTrigger = document.getElementById('diagnostic-trigger');
    const diagnosticModal = document.getElementById('diagnostic-modal');
    const closeDiagnostic = document.getElementById('close-diagnostic');
    const runDiagnosticBtn = document.getElementById('run-diagnostic-btn');
    const diagnosticOutput = document.getElementById('diagnostic-output');
    const userInput = document.getElementById('user-input');

    const articleModal = document.getElementById('article-modal');
    const articleModalBody = document.getElementById('article-modal-body');
    const closeArticleModal = document.getElementById('close-article-modal');

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

    // AI Timeline Static Milestones Data
    const aiTimelineData = [
        {
            year: "2020",
            model: "GPT-3 (175 Billion Parameters)",
            company: "OpenAI",
            type: "Foundation Model",
            description: "Demonstrated zero-shot and few-shot natural language capabilities across translation, Q&A, and basic code generation.",
            patch_version: "v.2020.GPT3",
            compute_flops: "3.14e23 FLOPs",
            impact: "Established the scaling law era for massive transformer-based neural nets."
        },
        {
            year: "2022",
            model: "ChatGPT (InstructGPT / RLHF Rollout)",
            company: "OpenAI",
            type: "Consumer Breakout",
            description: "Reinforcement Learning from Human Feedback (RLHF) enabled conversational AI to reach 100 million active users in 60 days.",
            patch_version: "v.2022.ChatGPT",
            compute_flops: "1.2e24 FLOPs",
            impact: "Initiated the global consumer generative AI race across search and productivity."
        },
        {
            year: "2023",
            model: "GPT-4 & Multimodal Neural Networks",
            company: "OpenAI / Google DeepMind",
            type: "Multimodal Frontier",
            description: "Expanded context windows, reasoning benchmarks, bar exam pass rates, and visual input processing.",
            patch_version: "v.2023.GPT4",
            compute_flops: "2.1e25 FLOPs",
            impact: "Proved multi-step reasoning capabilities on complex professional benchmarks."
        },
        {
            year: "2024",
            model: "Sora & Claude 3.5 Sonnet",
            company: "OpenAI / Anthropic",
            type: "Diffusion Video & Coding",
            description: "Real-time photorealistic video generation (Sora) and high-accuracy software artifact creation.",
            patch_version: "v.2024.Sora_Render",
            compute_flops: "8.5e25 FLOPs",
            impact: "Degraded the distinction between real and AI-generated visual media."
        },
        {
            year: "2025",
            model: "DeepSeek-R1 & Open-Weights Reasoning",
            company: "DeepSeek / Open Source",
            type: "Reasoning Optimization",
            description: "Ultra-low-compute reasoning model weights published openly, matching top proprietary benchmarks on fractions of GPU hardware.",
            patch_version: "v.2026.DeepSeek_Distill",
            compute_flops: "1.4e26 FLOPs",
            impact: "Triggered global hardware re-evaluations and democratized frontier reasoning."
        },
        {
            year: "2026",
            model: "Antigravity & Gemini 3.6 Autonomous Subagents",
            company: "Google DeepMind",
            type: "Agentic IDE Suite",
            description: "Coding subagents autonomously manage workspace files, dependency builds, unit tests, and background task execution.",
            patch_version: "v.2026.Antigravity_Engine",
            compute_flops: "5.2e26 FLOPs",
            impact: "Shifted developer roles from manual code drafting to prompt supervision."
        },
        {
            year: "2027+",
            model: "Projected Recursive Self-Improvement (AGI Shard)",
            company: "Global Research Consortia",
            type: "AGI Horizon",
            description: "Continuous real-time model retraining and automated scientific hypothesis generation.",
            patch_version: "v.2027.AGI_Preload",
            compute_flops: "1.0e28+ FLOPs",
            impact: "Transition of human civilization parameters to post-scarcity intelligence grid."
        }
    ];

    // --- Core Data Initialization ---
    async function initSystem() {
        startLiveClock();
        await fetchManifestAndAllData();
        renderHeroNewsCard();
        renderTicker();
        renderLogs();
        renderAITimeline();
        setupEventListeners();
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

    // Fetch Manifest & Load All Datasets for Live News Access
    async function fetchManifestAndAllData() {
        try {
            const response = await fetch('logs/manifest.json');
            if (!response.ok) throw new Error('Failed to load manifest');
            manifest = await response.json();

            // Load all dataset files concurrently
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

            // Combine into allLogs array
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

    // --- Hero Featured News Section ---
    function renderHeroNewsCard() {
        if (!heroNewsSection) return;

        // Pick top breaking active news or highest importance recent item
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
                        <span class="badge-breaking">🔥 BREAKING NEWS</span>
                        <span class="badge-patch">${escapeHTML(leadItem.version || 'v.2026.8')}</span>
                        <span class="type-pill ${getTypeClass(leadItem.type)}">${escapeHTML(leadItem.type || 'NEWS')}</span>
                    </div>
                    <div class="hero-date">${escapeHTML(leadItem.date || 'Present Day')} // ${escapeHTML(leadItem.region || 'Global_Earth')}</div>
                </div>

                <h2 class="hero-headline">${escapeHTML(leadItem.title)}</h2>
                ${subtitleHTML}

                <p class="hero-description">${escapeHTML(leadItem.description)}</p>

                <div class="hero-actions">
                    <button class="btn-primary" onclick="openArticleModal('${leadItem.id}')">
                        <span>📰</span> READ COVERAGE
                    </button>
                    <button class="btn-secondary" id="hero-diag-btn">
                        <span>⚡</span> RUN DIAGNOSTICS
                    </button>
                </div>
            </div>
        `;

        document.getElementById('hero-diag-btn')?.addEventListener('click', () => {
            diagnosticModal.classList.remove('hidden');
            userInput.focus();
        });
    }

    // --- Live Alert Ticker ---
    function renderTicker() {
        if (!tickerContent) return;
        const activeLogs = allLogs.filter(log => log.is_active === true || log.importance === 'high');

        if (activeLogs.length === 0) {
            tickerContent.innerHTML = '<span>// ALL SIMULATION SYSTEMS OPERATING WITHIN NORMAL PARAMETERS</span>';
            return;
        }

        const itemsHTML = activeLogs.map(log => `
            <span class="ticker-item">
                <span class="version-tag">[${escapeHTML(log.version || 'PATCH')}]</span>
                <strong>${escapeHTML(log.title)}:</strong> ${escapeHTML(log.sys_subtitle || log.description)}
            </span>
        `).join('<span class="ticker-sep">///</span>');

        tickerContent.innerHTML = itemsHTML + '<span class="ticker-sep">///</span>' + itemsHTML;
    }

    // --- News Feed Rendering & Filtering ---
    function getFilteredLogs() {
        return allLogs.filter(log => {
            // Search query filter
            if (activeFilters.search) {
                const query = activeFilters.search.toLowerCase();
                const titleMatch = log.title?.toLowerCase().includes(query);
                const descMatch = log.description?.toLowerCase().includes(query);
                const subMatch = log.sys_subtitle?.toLowerCase().includes(query);
                const tagMatch = log.tags?.some(t => t.toLowerCase().includes(query));
                const kwMatch = log.keywords?.some(k => k.toLowerCase().includes(query));
                if (!titleMatch && !descMatch && !subMatch && !tagMatch && !kwMatch) return false;
            }

            // Shard filter
            if (activeFilters.shard !== 'all') {
                const shard = activeFilters.shard;
                const region = (log.region || '').toLowerCase();
                const tags = (log.tags || []).map(t => t.toLowerCase());

                if (shard === 'tech' && !tags.some(t => ['ai', 'tech', 'software', 'hardware', 'crypto', 'genetics'].includes(t)) && !region.includes('earth')) {
                    return false;
                }
                if (shard === 'space' && !region.includes('space') && !region.includes('moon') && !region.includes('mars') && !region.includes('orbit') && !tags.includes('space')) {
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
        logCountElement.textContent = `Displaying ${filtered.length} Reports`;
        feedContainer.innerHTML = '';

        if (filtered.length === 0) {
            feedContainer.innerHTML = `<div class="no-results" style="padding: 3rem; text-align: center; color: var(--text-muted);">// NO SIMULATION NEWS RECORDS MATCH YOUR FILTER</div>`;
            return;
        }

        filtered.forEach(log => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.onclick = () => openArticleModal(log.id);

            const tagsHTML = (log.tags || []).slice(0, 3).map(t => `<span class="tag-item">#${escapeHTML(t)}</span>`).join('');
            const subtitleHTML = log.sys_subtitle ? `<div class="card-sys-subtitle">${escapeHTML(log.sys_subtitle)}</div>` : '';

            card.innerHTML = `
                <div>
                    <div class="card-top-meta">
                        <span class="type-pill ${getTypeClass(log.type)}">${escapeHTML(log.type || 'NEWS')}</span>
                        <span class="card-version-tag">${escapeHTML(log.version || 'v.2026')}</span>
                    </div>

                    <h3 class="card-title">${escapeHTML(log.title)}</h3>
                    ${subtitleHTML}

                    <p class="card-description">${escapeHTML(log.description)}</p>
                </div>

                <div class="card-footer-meta">
                    <span class="card-date">${escapeHTML(log.date || 'Present')} • ${escapeHTML(log.region || 'Global_Earth')}</span>
                    <div class="card-tags">${tagsHTML}</div>
                </div>
            `;

            feedContainer.appendChild(card);
        });
    }

    // --- AI Timeline Rendering ---
    function renderAITimeline() {
        const stackContainer = document.getElementById('ai-timeline-stack');
        if (!stackContainer) return;

        stackContainer.innerHTML = '';

        aiTimelineData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'timeline-event-card';
            card.innerHTML = `
                <div class="timeline-event-header">
                    <span class="timeline-event-year">${escapeHTML(item.year)} • ${escapeHTML(item.company)}</span>
                    <span class="badge-patch">${escapeHTML(item.patch_version)}</span>
                </div>
                <div class="timeline-event-model">${escapeHTML(item.model)}</div>
                <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 0.75rem;">${escapeHTML(item.description)}</p>
                <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan);">
                    ⚡ Est. Compute: ${escapeHTML(item.compute_flops)} | Impact: ${escapeHTML(item.impact)}
                </div>
            `;
            stackContainer.appendChild(card);
        });
    }

    // --- Article Modal View ---
    window.openArticleModal = function(logId) {
        const log = allLogs.find(l => l.id === logId);
        if (!log || !articleModalBody) return;

        const wikiLinkHTML = log.wiki_url 
            ? `<a href="${escapeHTML(log.wiki_url)}" target="_blank" class="btn-primary" style="margin-top: 1rem; display: inline-flex;"><span>🌐</span> Read Full Wikipedia Entry</a>` 
            : '';

        articleModalBody.innerHTML = `
            <div style="font-family: var(--font-mono); color: var(--accent-emerald); font-size: 0.82rem; margin-bottom: 0.5rem;">
                ${escapeHTML(log.version || 'v.2026')} // ${escapeHTML(log.type || 'NEWS')} // ${escapeHTML(log.region || 'Global_Earth')}
            </div>
            <h2 style="font-size: 1.75rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">${escapeHTML(log.title)}</h2>
            ${log.sys_subtitle ? `<div style="font-family: var(--font-mono); color: var(--accent-emerald); margin-bottom: 1rem;">❯ ${escapeHTML(log.sys_subtitle)}</div>` : ''}
            
            <div style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.5rem; white-space: pre-line;">
                ${escapeHTML(log.description)}
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-muted);">
                Submitted by: <span style="color: var(--accent-cyan);">${escapeHTML(log.submitted_by || 'Aethvion_Admin')}</span><br>
                Date: ${escapeHTML(log.date || 'Present')} | System Status: ONLINE
            </div>

            ${wikiLinkHTML}
        `;

        articleModal.classList.remove('hidden');
    };

    closeArticleModal?.addEventListener('click', () => {
        articleModal.classList.add('hidden');
    });

    articleModal?.addEventListener('click', (e) => {
        if (e.target === articleModal) articleModal.classList.add('hidden');
    });

    // --- Helper Functions ---
    function getTypeClass(type) {
        if (!type) return 'type-default';
        const t = type.toLowerCase();
        if (t.includes('critical') || t.includes('bug')) return 'type-critical';
        if (t.includes('feature') || t.includes('optimization')) return 'type-feature';
        if (t.includes('alert')) return 'type-alert';
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

    // --- Navigation & Controls Event Listeners ---
    function setupEventListeners() {
        // Tab View Switching (News vs AI Timeline)
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetView = tab.dataset.view;
                if (!targetView) return;

                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                contentViews.forEach(view => {
                    if (view.id === `view-${targetView}`) {
                        view.classList.remove('hidden');
                        view.classList.add('active');
                    } else {
                        view.classList.add('hidden');
                        view.classList.remove('active');
                    }
                });
            });
        });

        footerNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetView = link.dataset.view;
                const matchTab = document.querySelector(`.nav-tab[data-view="${targetView}"]`);
                if (matchTab) matchTab.click();
            });
        });

        // Shard Filters
        shardButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                shardButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilters.shard = btn.dataset.shard;
                renderLogs();
            });
        });

        // View Mode Toggles (Grid vs Wire)
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

        // Diagnostic Terminal Modal
        diagnosticTrigger?.addEventListener('click', () => {
            diagnosticModal.classList.remove('hidden');
            userInput.focus();
        });

        closeDiagnostic?.addEventListener('click', () => {
            diagnosticModal.classList.add('hidden');
        });

        runDiagnosticBtn?.addEventListener('click', runDiagnostic);
        userInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !runDiagnosticBtn.disabled) runDiagnostic();
        });

        // Privacy info toggle
        const privacyBtn = document.getElementById('privacy-info-btn');
        const privacyTooltip = document.getElementById('privacy-tooltip');
        privacyBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            privacyTooltip.classList.toggle('hidden');
        });
    }

    // --- Gemini AI Diagnostic Engine ---
    async function runDiagnostic() {
        const input = userInput.value.trim();
        if (!input) return;

        addSystemMessage(`USER@EARTH_SIM:~$ ${input}`, 'user-input-echo');
        userInput.value = '';
        runDiagnosticBtn.disabled = true;

        addSystemMessage('SCANNING SIMULATION ANOMALY DATABASE...');
        await new Promise(r => setTimeout(r, 400));
        addSystemMessage('CROSS-REFERENCING CLIENT HARDWARE PROFILE...');
        await new Promise(r => setTimeout(r, 400));

        try {
            const response = await fetch('https://api.aethvion.com/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `You are the lead SysAdmin AI for Earth Simulation C-137. A user reported: "${input}". Provide a concise, witty, technical patch response (max 150 words).`,
                    userId: 'SIM_USER_' + Math.floor(Math.random() * 10000)
                })
            });

            if (!response.ok) throw new Error(`API returned status ${response.status}`);
            const data = await response.json();
            const text = data.reply || data.response || data.text || data.message || 'DIAGNOSTIC COMPLETE: System memory cache flushed. Restart client.';

            addSystemMessage(text, 'ai-response');
        } catch (err) {
            addSystemMessage(`DIAGNOSTIC REPORT: Glitch localized to client perception layer. Issue logged under ticket #SIM-8849.`, 'ai-response');
        } finally {
            runDiagnosticBtn.disabled = false;
        }
    }

    function addSystemMessage(text, className = 'system-msg') {
        const p = document.createElement('p');
        p.className = className;
        p.textContent = text;
        diagnosticOutput.appendChild(p);
        diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;
    }

    // Start App
    initSystem();
});
