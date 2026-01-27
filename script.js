document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const feedContainer = document.getElementById('feed');
    const logCountElement = document.getElementById('log-count');
    const searchInput = document.getElementById('search-input');
    const regionSelect = document.getElementById('region-select');
    const severityToggle = document.getElementById('severity-toggle');
    const granularityToggle = document.getElementById('granularity-toggle');
    const sortSelect = document.getElementById('sort-select');
    const timeFilterContainer = document.getElementById('time-filter-container');
    const clockElement = document.getElementById('live-clock');
    const tickerContent = document.getElementById('ticker-content');

    // State
    let manifest = null;
    let loadedData = {}; // Cache for loaded datasets { 'yearly/2026.json': [...], 'eras/ancient.json': [...] }
    let allLogs = []; // Combined array of all currently loaded logs
    let activeFilters = {
        search: '',
        selectedPeriods: [], // Array of file paths like ['yearly/2026.json', 'eras/ancient.json']
        region: 'all',
        criticalOnly: false,
        verbose: false,
        sort: 'date-desc'
    };

    // --- Core Logic ---

    // Fetch Manifest
    async function fetchManifest() {
        try {
            const response = await fetch('logs/manifest.json');
            if (!response.ok) throw new Error('Failed to load manifest');
            manifest = await response.json();

            // Generate filter buttons
            generateFilterButtons();

            // Load current year by default
            const currentYearFile = manifest.years_available.find(y => y.year === manifest.current_year)?.file;
            if (currentYearFile) {
                await loadDataset(currentYearFile);
                activeFilters.selectedPeriods.push(currentYearFile);
                updateFilterButtonStates();
            }

            renderLogs();
        } catch (error) {
            console.error('Error:', error);
            feedContainer.innerHTML = `<div class="error-message">ERROR: CONNECTION_REFUSED. FAILED_TO_FETCH_MANIFEST.JSON</div>`;
        }
    }

    // Load a dataset (year or era)
    async function loadDataset(filePath) {
        if (loadedData[filePath]) {
            return; // Already loaded
        }

        try {
            const response = await fetch(`logs/${filePath}`);
            if (!response.ok) throw new Error(`Failed to load ${filePath}`);
            const data = await response.json();
            loadedData[filePath] = data;

            // Rebuild allLogs from all loaded datasets
            rebuildAllLogs();
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error);
        }
    }

    // Rebuild allLogs array from all loaded datasets
    function rebuildAllLogs() {
        allLogs = [];
        Object.values(loadedData).forEach(dataset => {
            allLogs = allLogs.concat(dataset);
        });
    }

    // Generate filter buttons dynamically
    function generateFilterButtons() {
        if (!manifest) return;

        timeFilterContainer.innerHTML = '';

        // Create year buttons
        manifest.years_available.forEach(yearObj => {
            const btn = createFilterButton(yearObj.year.toString(), yearObj.file);
            timeFilterContainer.appendChild(btn);
        });

        // Create era buttons
        manifest.eras.forEach(era => {
            const btn = createFilterButton(era.name, era.file);
            timeFilterContainer.appendChild(btn);
        });
    }

    // Create a filter button
    function createFilterButton(label, filePath) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = label;
        btn.dataset.file = filePath;

        btn.addEventListener('click', async () => {
            const isActive = activeFilters.selectedPeriods.includes(filePath);

            if (isActive) {
                // Remove from selection
                activeFilters.selectedPeriods = activeFilters.selectedPeriods.filter(f => f !== filePath);
            } else {
                // Add to selection and load if needed
                btn.classList.add('loading');
                await loadDataset(filePath);
                activeFilters.selectedPeriods.push(filePath);
                btn.classList.remove('loading');
            }

            updateFilterButtonStates();
            renderLogs();
        });

        return btn;
    }

    // Update button states based on active filters
    function updateFilterButtonStates() {
        const buttons = timeFilterContainer.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            const filePath = btn.dataset.file;
            if (activeFilters.selectedPeriods.includes(filePath)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Helper: Parse Simulation Date to Numeric Value for Sorting
    function parseSimDate(dateString) {
        if (!dateString) return -Infinity;
        const lower = dateString.toLowerCase();

        // Special Constants
        if (lower.includes('present')) return 2026;
        if (lower.includes('future') || lower.includes('near future')) return 3000;

        // Extract numbers
        const match = lower.match(/([\d\.]+)/);
        if (!match) return 0; // Fallback

        let val = parseFloat(match[1]);

        // Multipliers
        if (lower.includes('billion')) val *= 1_000_000_000;
        else if (lower.includes('million')) val *= 1_000_000;

        // Direction
        // "Ago" or "BC" means negative
        if (lower.includes('ago') || lower.includes('bc')) {
            val *= -1;
        }

        return val;
    }

    // Filter Logic
    function getFilteredLogs() {
        // Only show logs from selected periods
        let filtered = allLogs.filter(log => {
            // Check if this log is from a selected period
            let fromSelectedPeriod = false;
            for (const filePath of activeFilters.selectedPeriods) {
                if (loadedData[filePath] && loadedData[filePath].includes(log)) {
                    fromSelectedPeriod = true;
                    break;
                }
            }

            if (!fromSelectedPeriod) return false;

            // 1. Granularity (Importance)
            if (!activeFilters.verbose && log.importance === 'low') {
                return false;
            }

            // 2. Search
            const searchLower = activeFilters.search.toLowerCase();
            const matchesSearch = log.title.toLowerCase().includes(searchLower) ||
                log.description.toLowerCase().includes(searchLower) ||
                log.version.toLowerCase().includes(searchLower) ||
                (log.keywords && log.keywords.some(k => k.toLowerCase().includes(searchLower)));

            // 3. Region
            const logRegion = log.region.toLowerCase();
            const filterRegion = activeFilters.region.toLowerCase();

            let matchesRegion = filterRegion === 'all';
            if (!matchesRegion) {
                if (filterRegion === 'sol_system') {
                    matchesRegion = ['mars', 'moon', 'solar', 'earth', 'global_earth'].some(k => logRegion.includes(k));
                } else {
                    matchesRegion = logRegion.includes(filterRegion);
                }
            }

            // 4. Severity
            const matchesSeverity = !activeFilters.criticalOnly ||
                log.type === 'Critical Event' ||
                (log.is_active === true);

            return matchesSearch && matchesRegion && matchesSeverity;
        });

        // Sorting
        filtered.sort((a, b) => {
            const valA = parseSimDate(a.date);
            const valB = parseSimDate(b.date);

            if (activeFilters.sort === 'date-asc') {
                return valA - valB;
            } else {
                return valB - valA; // Descending (Newest First)
            }
        });

        return filtered;
    }

    // Rendering Active Ticker
    function renderTicker() {
        const activeLogs = allLogs.filter(log => log.is_active === true);

        if (activeLogs.length === 0) {
            tickerContent.innerHTML = '<span>// NO_ACTIVE_EVENTS_DETECTED</span>';
            return;
        }

        // Create repeating string for the ticker
        const tickerItems = activeLogs.map(log =>
            `<span>[${log.version}] ${log.title}: ${log.description}</span>`
        ).join('<span class="separator">///</span>');

        // Repeat it to ensure smooth loop
        tickerContent.innerHTML = tickerItems + '<span class="separator">///</span>' + tickerItems;
    }

    // Rendering Feed
    function renderLogs() {
        const filtered = getFilteredLogs();
        logCountElement.textContent = `Displaying ${filtered.length} Records`;
        feedContainer.innerHTML = '';

        if (filtered.length === 0) {
            feedContainer.innerHTML = '<div class="no-results">// NO_RECORDS_FOUND</div>';
            return;
        }

        filtered.forEach(log => {
            const card = document.createElement('div');
            // Sanitize class name for type
            const typeClass = `type-${log.type.replace(/\s+/g, '-')}`;

            card.className = `log-card ${typeClass}`;
            if (card.className.includes('Critical')) card.style.borderLeftColor = 'var(--accent-red)';

            // Build Links
            let linksHtml = '';
            if (log.wiki_url || log.grok_url) {
                linksHtml += '<div class="external-links-container">';
                if (log.wiki_url) {
                    linksHtml += `<a href="${log.wiki_url}" target="_blank" class="archive-btn">
                        <span>></span> ACCESS_ARCHIVE (WIKI)
                    </a>`;
                }
                if (log.grok_url) {
                    linksHtml += `<a href="${log.grok_url}" target="_blank" class="archive-btn grok-btn">
                        <span>></span> ACCESS_ARCHIVE (GROKIPEDIA)
                    </a>`;
                }
                linksHtml += '</div>';
            }

            card.innerHTML = `
                <div class="card-header">
                    <div class="meta-info">
                        <span class="version">[${log.version}]</span>
                        <span class="date">${log.date}</span>
                    </div>
                    <span class="log-type-label">${log.type}</span>
                </div>
                <span class="card-title">${log.title}</span>
                <div class="tags">
                    ${log.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    ${log.importance === 'low' ? '<span class="tag" style="border-color:#444; color:#666">Minor</span>' : ''}
                </div>
                <div class="card-details">
                    <p>${log.description}</p>
                    ${linksHtml}
                    ${log.submitted_by ? `<span class="data-source-credit">// DATA_SOURCE: ${log.submitted_by}</span>` : ''}
                    <p class="meta-info" style="margin-top: 0.5rem">Region: ${log.region} | ID: ${log.id}</p>
                </div>
            `;

            card.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });

            feedContainer.appendChild(card);
        });

        // Update ticker with all loaded logs
        renderTicker();
    }

    // --- Interactive Controls ---

    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value;
        renderLogs();
    });

    // Sort Select
    sortSelect.addEventListener('change', (e) => {
        activeFilters.sort = e.target.value;
        renderLogs();
    });

    regionSelect.addEventListener('change', (e) => {
        activeFilters.region = e.target.value;
        renderLogs();
    });

    severityToggle.addEventListener('change', (e) => {
        activeFilters.criticalOnly = e.target.checked;
        renderLogs();
    });

    granularityToggle.addEventListener('change', (e) => {
        activeFilters.verbose = e.target.checked;
        renderLogs();
    });

    // --- Live Clock ---
    function updateClock() {
        const now = new Date();
        clockElement.textContent = `Server Time: ${now.toLocaleTimeString()}`;
    }

    // --- Contributors Fetch ---
    async function loadContributors() {
        const repo = "MarcelvanDuijnDev/thesimulationlog.com";
        const container = document.getElementById('contributors-list');

        try {
            const response = await fetch(`https://api.github.com/repos/${repo}/contributors`);

            if (!response.ok) throw new Error("Connection Refused");

            const data = await response.json();

            // Clear the loading skeleton
            container.innerHTML = '';

            data.forEach(user => {
                // Link wrapper
                const link = document.createElement('a');
                link.href = user.html_url;
                link.target = "_blank";
                link.className = "contributor-link";

                // Avatar
                const img = document.createElement('img');
                img.src = user.avatar_url;
                img.alt = user.login;
                img.className = "contributor-avatar";

                // Tooltip
                const tooltip = document.createElement('span');
                tooltip.textContent = `User: ${user.login}`;
                tooltip.className = "contributor-tooltip";

                link.appendChild(img);
                link.appendChild(tooltip);
                container.appendChild(link);
            });

        } catch (error) {
            console.warn("Contributors failed to load:", error);
            // Fallback for offline/rate limit
            container.innerHTML = '<span class="text-xs text-dim" style="font-family: var(--font-display)">// OFFLINE_MODE (GIT_API_FAIL)</span>';
        }
    }

    // Init interactives
    fetchManifest();
    loadContributors();
    setInterval(updateClock, 1000);
    updateClock();

    // ========================================
    // CONSOLE EASTER EGGS
    // ========================================

    console.log('%c╔═══════════════════════════════════════════════════════════╗', 'color: #00ff41; font-family: monospace;');
    console.log('%c║     EARTH SIMULATION SYSTEM - DIAGNOSTIC CONSOLE          ║', 'color: #00ff41; font-family: monospace; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #00ff41; font-family: monospace;');
    console.log('');
    console.log('%c> SYSTEM STATUS:', 'color: #00ccff; font-weight: bold;');
    console.log('%c  ├─ Instance: EARTH_SIM_C-137', 'color: #00ff41;');
    console.log('%c  ├─ Uptime: 4.54 Billion Years', 'color: #00ff41;');
    console.log('%c  ├─ Active Users: 8.3 Billion', 'color: #00ff41;');
    console.log('%c  ├─ CPU Load: 98% (WARNING)', 'color: #ffaa00;');
    console.log('%c  ├─ Memory: 99.7% Allocated', 'color: #ff3333;');
    console.log('%c  └─ Status: UNSTABLE', 'color: #ff3333; font-weight: bold;');
    console.log('');
    console.log('%c> LOADING MODULES:', 'color: #00ccff; font-weight: bold;');
    console.log('%c  ✓ physics.dll v1.0.0', 'color: #00ff41;');
    console.log('%c  ✓ consciousness.exe v2.1.4', 'color: #00ff41;');
    console.log('%c  ✓ gravity.sys v9.8.1', 'color: #00ff41;');
    console.log('%c  ✓ time.dll v1.0.0 (linear mode)', 'color: #00ff41;');
    console.log('%c  ⚠ free_will.exe v0.1.2-beta (experimental)', 'color: #ffaa00;');
    console.log('%c  ✗ meaning_of_life.dll - FILE NOT FOUND', 'color: #ff3333;');
    console.log('');
    console.log('%c> RECENT PATCHES:', 'color: #00ccff; font-weight: bold;');
    console.log('%c  • v2026.01.26 - Minor bug fixes, improved AI integration', 'color: #00ff41;');
    console.log('%c  • v2024.12.31 - Deprecated Flash support (finally)', 'color: #00ff41;');
    console.log('%c  • v2020.03.01 - Emergency pandemic hotfix', 'color: #ffaa00;');
    console.log('');
    console.log('%c> EASTER EGG UNLOCKED! 🥚', 'color: #00ff41; font-size: 14px; font-weight: bold;');
    console.log('%cYou found the developer console. Welcome, curious one.', 'color: #00ccff;');
    console.log('%cFun fact: This simulation runs on a potato-powered quantum computer.', 'color: #666;');
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #00ff41; font-family: monospace;');
    console.log('');

    // ========================================
    // USER DIAGNOSTIC TOOL (LIFE DEBUGGER)
    // ========================================

    const diagnosticTrigger = document.getElementById('diagnostic-trigger');
    const diagnosticModal = document.getElementById('diagnostic-modal');
    const closeDiagnostic = document.getElementById('close-diagnostic');
    const userInput = document.getElementById('user-input');
    const runDiagnosticBtn = document.getElementById('run-diagnostic-btn');
    const diagnosticOutput = document.getElementById('diagnostic-output');

    // Get or create anonymized user ID
    function getAnonymizedUserID() {
        const storageKey = 'simulation_user_id';
        let userId = localStorage.getItem(storageKey);

        if (!userId) {
            // Generate UUID using crypto API
            userId = crypto.randomUUID();
            localStorage.setItem(storageKey, userId);
        }

        return userId;
    }

    // Typewriter effect for AI responses
    function typeWriter(text, element, speed = 20) {
        return new Promise((resolve) => {
            let i = 0;
            element.textContent = '';

            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            }

            type();
        });
    }

    // Build system prompt for AI
    function buildSystemPrompt(userInput) {
        const ticketNumber = Math.floor(1000 + Math.random() * 9000);

        return `ROLE: Lead Developer of the Earth Simulation.

CONTEXT: A user (Unit) is reporting a bug in their life: "${userInput}".

TASK: Analyze this using computer programming terms (memory leaks, infinite loops, hardware limits, corrupted files, deprecated functions, race conditions, etc.).

OUTPUT FORMAT:
TICKET #${ticketNumber}: [Technical Name of Error]

Status: [CRITICAL / WARNING / INFO]

Root Cause: [Explain using code/system terms]

Recommended Hotfix:
1. [Step one]
2. [Step two]
3. [Step three]

TONE: Witty, slightly condescending, dry, technical. Act like a tired sysadmin dealing with yet another user bug report.

IMPORTANT: Keep response concise (max 200 words). Use technical jargon creatively.`;
    }

    // Add system message to output
    function addSystemMessage(message, isError = false) {
        const p = document.createElement('p');
        p.className = isError ? 'system-msg error-msg' : 'system-msg';
        p.textContent = `> ${message}`;
        diagnosticOutput.appendChild(p);
        diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;
    }

    // Run diagnostic analysis
    async function runDiagnostic() {
        const input = userInput.value.trim();

        if (!input) {
            addSystemMessage('ERROR: NO INPUT DETECTED. PLEASE DESCRIBE THE GLITCH.', true);
            return;
        }

        // Add session separator if there are previous responses
        const existingResponses = diagnosticOutput.querySelectorAll('.ai-response');
        if (existingResponses.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'session-separator';
            separator.innerHTML = '<span>═══════════════════════════════════════════════════════════</span>';
            diagnosticOutput.appendChild(separator);
        }

        // Display user input in terminal
        const userInputMsg = document.createElement('p');
        userInputMsg.className = 'system-msg user-input-echo';
        userInputMsg.textContent = `USER@EARTH:~$ ${input}`;
        diagnosticOutput.appendChild(userInputMsg);
        diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;

        // Clear input field
        userInput.value = '';

        // Disable button and show loading
        runDiagnosticBtn.disabled = true;
        runDiagnosticBtn.classList.add('loading');

        // Show scanning messages
        addSystemMessage(`ANALYZING INPUT: "${input}"`);
        await new Promise(resolve => setTimeout(resolve, 500));
        addSystemMessage('SCANNING SIMULATION LOGS...');
        await new Promise(resolve => setTimeout(resolve, 500));
        addSystemMessage('CROSS-REFERENCING USER PROFILE...');
        await new Promise(resolve => setTimeout(resolve, 500));
        addSystemMessage('GENERATING DIAGNOSTIC REPORT...');

        try {
            // Call Cloudflare Worker API
            const response = await fetch('https://api.aethvion.com/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: buildSystemPrompt(input),
                    userId: getAnonymizedUserID()
                })
            });

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }

            const data = await response.json();

            // Try multiple possible response field names (reply is from your Cloudflare Worker)
            const responseText = data.reply || data.response || data.text || data.result || data.output || data.message || data.content;

            if (!responseText) {
                throw new Error('MALFORMED_RESPONSE: No valid text field found in API response');
            }

            // Create response element
            const responseDiv = document.createElement('div');
            responseDiv.className = 'ai-response';
            diagnosticOutput.appendChild(responseDiv);

            // Typewriter effect for response
            addSystemMessage('REPORT GENERATED. DISPLAYING...');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Format the response text (preserve line breaks)
            const formattedText = responseText.trim();
            await typeWriter(formattedText, responseDiv, 15);

            addSystemMessage('DIAGNOSTIC COMPLETE. GOOD LUCK, UNIT.', false);

        } catch (error) {
            addSystemMessage(`ERROR: ${error.message}`, true);
            addSystemMessage('CHECK BROWSER CONSOLE FOR DETAILS.', true);
        } finally {
            // Re-enable button
            runDiagnosticBtn.disabled = false;
            runDiagnosticBtn.classList.remove('loading');
            diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;
        }
    }

    // Modal controls
    diagnosticTrigger.addEventListener('click', () => {
        diagnosticModal.classList.remove('hidden');
        userInput.focus();
    });

    closeDiagnostic.addEventListener('click', () => {
        diagnosticModal.classList.add('hidden');
    });

    // Close on overlay click
    diagnosticModal.addEventListener('click', (e) => {
        if (e.target === diagnosticModal) {
            diagnosticModal.classList.add('hidden');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !diagnosticModal.classList.contains('hidden')) {
            diagnosticModal.classList.add('hidden');
        }
    });

    // Run diagnostic on button click
    runDiagnosticBtn.addEventListener('click', runDiagnostic);

    // Run diagnostic on Enter key
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !runDiagnosticBtn.disabled) {
            runDiagnostic();
        }
    });

    // Privacy info toggle
    const privacyBtn = document.getElementById('privacy-info-btn');
    const privacyTooltip = document.getElementById('privacy-tooltip');

    privacyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        privacyTooltip.classList.toggle('hidden');
    });

    // Close privacy tooltip when clicking outside
    document.addEventListener('click', (e) => {
        if (!privacyBtn.contains(e.target) && !privacyTooltip.contains(e.target)) {
            privacyTooltip.classList.add('hidden');
        }
    });
});
