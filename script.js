document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const feedContainer = document.getElementById('feed');
    const logCountElement = document.getElementById('log-count');
    const searchInput = document.getElementById('search-input');
    const regionSelect = document.getElementById('region-select');
    const severityToggle = document.getElementById('severity-toggle');
    const eraCheckboxes = document.querySelectorAll('.filter-era');
    const clockElement = document.getElementById('live-clock');

    // State
    let allLogs = [];
    let activeFilters = {
        search: '',
        eras: ['pre-history', 'antiquity', 'modern', 'future'],
        region: 'all',
        criticalOnly: false
    };

    // --- Core Logic ---

    // Fetch Data
    async function fetchLogs() {
        try {
            const response = await fetch('logs.json');
            if (!response.ok) throw new Error('Failed to load logs');
            allLogs = await response.json();
            renderLogs();
        } catch (error) {
            console.error('Error:', error);
            feedContainer.innerHTML = `<div class="error-message">ERROR: CONNECTION_REFUSED. FAILED_TO_FETCH_LOGS.JSON</div>`;
        }
    }

    // Determine Era Helper
    function getEra(dateString) {
        const lowerDate = dateString.toLowerCase();
        if (lowerDate.includes('billion') || lowerDate.includes('million') || lowerDate.includes('bc')) {
            return 'pre-history';
        }
        
        // Extract Year for AD dates
        const yearMatch = dateString.match(/(\d+)\s*AD/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            if (year < 1500) return 'antiquity';
            if (year > 2025) return 'future'; // Arbitrary cutoff
            return 'modern';
        }

        return 'modern'; // Default fallback
    }

    // Filter Logic
    function getFilteredLogs() {
        return allLogs.filter(log => {
            // 1. Search (Title, Description, Version)
            const searchLower = activeFilters.search.toLowerCase();
            const matchesSearch = log.title.toLowerCase().includes(searchLower) || 
                                  log.description.toLowerCase().includes(searchLower) ||
                                  log.version.toLowerCase().includes(searchLower);
            
            // 2. Era
            const logEra = getEra(log.date);
            const matchesEra = activeFilters.eras.includes(logEra);
            
            // 3. Region
            const matchesRegion = activeFilters.region === 'all' || 
                                  log.region.toLowerCase() === activeFilters.region.toLowerCase();
            
            // 4. Severity
            const matchesSeverity = !activeFilters.criticalOnly || 
                                    log.type === 'Critical Event';

            return matchesSearch && matchesEra && matchesRegion && matchesSeverity;
        });
    }

    // Rendering
    function renderLogs() {
        const filtered = getFilteredLogs();
        logCountElement.textContent = `Displaying ${filtered.length} / ${allLogs.length} Records`;
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
                </div>
                <div class="card-details">
                    <p>${log.description}</p>
                    <p class="meta-info">Region: ${log.region} | ID: ${log.id}</p>
                </div>
            `;

            // Accordion Event
            card.addEventListener('click', () => {
                const isExpanded = card.classList.contains('expanded');
                // Close others if we want "single open" behavior? 
                // User requirement: "Clicking a card expands it". Doesn't strictly say auto-close others.
                // I'll leave others open for better usability in a list.
                
                if (isExpanded) {
                    card.classList.remove('expanded');
                } else {
                    card.classList.add('expanded');
                }
            });

            feedContainer.appendChild(card);
        });
    }

    // --- Interactive Controls ---

    // Search Input
    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value;
        renderLogs();
    });

    // Region Select
    regionSelect.addEventListener('change', (e) => {
        activeFilters.region = e.target.value;
        renderLogs();
    });

    // Severity Toggle
    severityToggle.addEventListener('change', (e) => {
        activeFilters.criticalOnly = e.target.checked;
        renderLogs();
    });

    // Era Checkboxes
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
