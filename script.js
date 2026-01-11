document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const feedContainer = document.getElementById('feed');
    const logCountElement = document.getElementById('log-count');
    const searchInput = document.getElementById('search-input');
    const regionSelect = document.getElementById('region-select');
    const severityToggle = document.getElementById('severity-toggle');
    const granularityToggle = document.getElementById('granularity-toggle');
    const sortSelect = document.getElementById('sort-select'); // New Element
    const eraCheckboxes = document.querySelectorAll('.filter-era');
    const clockElement = document.getElementById('live-clock');
    const tickerContent = document.getElementById('ticker-content');

    // State
    let allLogs = [];
    let activeFilters = {
        search: '',
        eras: ['pre-history', 'antiquity', 'modern', 'future'],
        region: 'all',
        criticalOnly: false,
        verbose: false, // Default to hiding low importance
        sort: 'date-desc' // Default sort
    };

    // --- Core Logic ---

    // Fetch Data
    async function fetchLogs() {
        try {
            const response = await fetch('logs.json');
            if (!response.ok) throw new Error('Failed to load logs');
            const data = await response.json();

            // Separte active logs from history logs if needed, or just keep them all
            // For the Feed, we likely want "History" logs (is_active !== true) 
            // OR we show everything sorted by date?
            // Requirement says "Main Feed (The Logs) - Standard Timeline"
            // And "Live Server Status ... Displays currently active/ongoing events"

            // Let's filter active ones for the ticker, and everything else for the feed.
            const activeLogs = data.filter(log => log.is_active === true);
            allLogs = data.filter(log => log.is_active !== true); // Only history in the feed?
            // Actually, usually "Present Day" logs might be in the feed too. 
            // Let's keep them in the feed as well for reference, unless specified otherwise.
            // Prompt says "Standard Timeline" for history logs. "Active/Live events" in ticker.
            // I'll keep them in allLogs for the feed, but maybe the ticker creates a separate display.

            // Re-eval: "Active events" usually imply "Ongoing". 
            // I will put them in the ticker. I will ALSO put them in the feed if they have a date?
            // Let's just use the `is_active` flag for the ticker, and `allLogs` is the source for local filtering.
            // If the user didn't ask to exclude them from the feed, I'll include them.
            allLogs = data;

            renderTicker(activeLogs);
            renderLogs();
        } catch (error) {
            console.error('Error:', error);
            feedContainer.innerHTML = `<div class="error-message">ERROR: CONNECTION_REFUSED. FAILED_TO_FETCH_LOGS.JSON</div>`;
        }
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

    // Determine Era Helper
    function getEra(dateString) {
        if (!dateString) return 'modern';
        const lowerDate = dateString.toLowerCase();

        if (lowerDate.includes('billion') || lowerDate.includes('million') || lowerDate.includes('bc') || lowerDate.includes('pre-history')) {
            return 'pre-history';
        }

        // Extract Year for AD dates
        // Handles "1347 AD", "1991 - 2000 AD", "Present Day", "Near Future"
        if (lowerDate.includes('present') || lowerDate.includes('future')) return 'future';

        const yearMatch = dateString.match(/(\d+)/); // Crude year extractor
        if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            // Logic check for BC/AD if not explicit
            // Assuming AD if not BC/Billion/Million which are caught above

            if (year < 1500) return 'antiquity';
            if (year > 2025) return 'future';
            return 'modern';
        }

        return 'modern'; // Default fallback
    }

    // Filter Logic
    function getFilteredLogs() {
        let filtered = allLogs.filter(log => {
            // Exclude active-only logs from feed if we wanted, but let's show all
            if (log.is_active && !activeFilters.verbose) {
                // Logic hole: Should active logs be shown in feed? 
                // Usually yes.
            }

            // 1. Granularity (Importance)
            // Rule: "By default, hide events tagged 'importance: low'. If toggled ON, show everything."
            if (!activeFilters.verbose && log.importance === 'low') {
                return false;
            }

            // 2. Search
            const searchLower = activeFilters.search.toLowerCase();
            const matchesSearch = log.title.toLowerCase().includes(searchLower) ||
                log.description.toLowerCase().includes(searchLower) ||
                log.version.toLowerCase().includes(searchLower);

            // 3. Era
            const logEra = getEra(log.date);
            const matchesEra = activeFilters.eras.includes(logEra);

            // 4. Region
            // Special handling for region mapping to filters if needed.
            // Our dropdown values are lowercase.
            const logRegion = log.region.toLowerCase();
            const filterRegion = activeFilters.region.toLowerCase();

            let matchesRegion = filterRegion === 'all';
            if (!matchesRegion) {
                // Exact match or partial inclusion?
                // Example: Filter "sol_system" -> should match "Mars_Server", "Moon_Server", "Solar_System"
                if (filterRegion === 'sol_system') {
                    matchesRegion = ['mars', 'moon', 'solar', 'earth', 'global'].some(k => logRegion.includes(k));
                } else {
                    matchesRegion = logRegion.includes(filterRegion);
                }
            }

            // 5. Severity
            const matchesSeverity = !activeFilters.criticalOnly ||
                log.type === 'Critical Event' ||
                (log.is_active === true); // Maybe critical shows active too?

            return matchesSearch && matchesEra && matchesRegion && matchesSeverity;
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
    function renderTicker(activeLogs) {
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
                    <p class="meta-info">Region: ${log.region} | ID: ${log.id}</p>
                </div>
            `;

            card.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });

            feedContainer.appendChild(card);
        });
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
        // Visual feedback?
        renderLogs();
    });

    eraCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const value = cb.value;
            if (cb.checked) {
                if (!activeFilters.eras.includes(value)) activeFilters.eras.push(value);
            } else {
                activeFilters.eras = activeFilters.eras.filter(e => e !== value);
            }
            renderLogs();
        });
    });

    // --- Live Clock ---
    function updateClock() {
        const now = new Date();
        clockElement.textContent = `Server Time: ${now.toLocaleTimeString()}`;
    }

    // Init
    fetchLogs();
    setInterval(updateClock, 1000);
    updateClock();
});
