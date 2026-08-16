/* js/home.js — Homepage article feed */

const CAT_COLORS = {
    ai:    '#1d4ed8',
    space: '#d97706',
    tech:  '#059669',
    world: '#dc2626',
};

async function loadArticles() {
    try {
        const res = await fetch('/articles-index.json');
        if (!res.ok) throw new Error('articles-index.json not found');
        return await res.json();
    } catch (e) {
        console.error('Failed to load articles:', e);
        return [];
    }
}

function catClass(cls) {
    return ['ai','space','tech','world'].includes(cls) ? cls : 'ai';
}

function renderHero(article) {
    const section = document.getElementById('hero-section');
    if (!section || !article) return;

    const cc = catClass(article.category_class);

    section.innerHTML = `
        <div class="hero-section">
            <div class="hero-content">
                <div class="hero-meta">
                    <span class="feat-pill">Featured</span>
                    <span class="cat-pill cat-${cc}">${article.category}</span>
                    <span class="hero-date">${article.date}</span>
                </div>
                <h1 class="hero-headline">${article.title}</h1>
                <p class="hero-sub">${article.subtitle}</p>
                <div class="hero-byline">
                    <span>${article.author}</span>
                    <span>&middot;</span>
                    <span>${article.reading_time}</span>
                </div>
                <a href="/posts/${article.slug}/" class="read-btn">Read Full Story &rarr;</a>
            </div>
            <div class="hero-img" aria-hidden="true">
                <span class="hero-img-label">${article.category}</span>
            </div>
        </div>`;
}

function renderGrid(articles) {
    const grid = document.getElementById('article-grid');
    const count = document.getElementById('story-count');
    if (!grid) return;

    const items = articles.slice(1); // exclude hero
    if (count) count.textContent = `${items.length} stories`;

    if (items.length === 0) {
        grid.innerHTML = '<div class="empty-state">No stories yet. Check back soon.</div>';
        return;
    }

    grid.innerHTML = items.map(a => {
        const cc = catClass(a.category_class);
        return `
            <a href="/posts/${a.slug}/" class="article-card">
                <div class="card-cat-bar ${cc}"></div>
                <div class="card-body">
                    <div class="card-meta">
                        <span class="cat-pill cat-${cc}">${a.category}</span>
                        <span class="card-date">${a.date}</span>
                    </div>
                    <h3 class="card-title">${a.title}</h3>
                    <p class="card-excerpt">${a.subtitle}</p>
                    <div class="card-foot">
                        <span>${a.author}</span>
                        <span>${a.reading_time}</span>
                    </div>
                </div>
            </a>`;
    }).join('');
}

async function init() {
    const articles = await loadArticles();
    if (articles.length > 0) {
        renderHero(articles[0]);
        renderGrid(articles);
    } else {
        const grid = document.getElementById('article-grid');
        if (grid) grid.innerHTML = '<div class="empty-state">Loading stories... run <code>python build.py</code> if this persists.</div>';
    }
}

init();
