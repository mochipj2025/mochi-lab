/**
 * Mochi Blog Search Logic
 * -----------------------
 * Handles fetching the search index, filtering results, and updating the UI.
 */

class BlogSearch {
    constructor() {
        this.index = [];
        this.isLoaded = false;
        this.searchOverlay = null;
        this.searchInput = null;
        this.resultsContainer = null;
        this.searchToggle = null;

        // Initialize search when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        this.createUI();
        this.setupEventListeners();
        await this.loadIndex();
    }

    createUI() {
        // 1. Auto-inject Search Button to Header if it doesn't exist
        const nav = document.querySelector('.site-nav');
        if (nav && !document.querySelector('.search-btn')) {
            const searchBtn = document.createElement('button');
            searchBtn.className = 'search-btn';
            searchBtn.setAttribute('aria-label', '検索');
            searchBtn.setAttribute('data-search-toggle', '');
            searchBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';

            // Insert before theme toggle or at the end
            const themeToggle = nav.querySelector('.theme-toggle');
            if (themeToggle) {
                nav.insertBefore(searchBtn, themeToggle);
            } else {
                nav.appendChild(searchBtn);
            }
        }

        // 2. Create Search Overlay if it doesn't exist
        if (document.getElementById('search-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'search-overlay';
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-modal">
                <div class="search-header">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="search-input" placeholder="キーワードを入力..." autocomplete="off">
                    <button class="search-close" aria-label="閉じる">&times;</button>
                </div>
                <div id="search-results" class="search-results">
                    <div class="search-placeholder">何かお探しですか？</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.searchOverlay = overlay;
        this.searchInput = document.getElementById('search-input');
        this.resultsContainer = document.getElementById('search-results');
        this.searchClose = overlay.querySelector('.search-close');
    }

    async loadIndex() {
        try {
            // Path depends on if we are in /articles/ or root
            const basePath = window.location.pathname.includes('/articles/') ? '../' : '';
            const response = await fetch(`${basePath}search-index.json`);
            if (!response.ok) throw new Error('Search index not found');
            this.index = await response.json();
            this.isLoaded = true;
            console.log('Search index loaded');
        } catch (error) {
            console.error('Failed to load search index:', error);
        }
    }

    setupEventListeners() {
        // Find existing toggle buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.search-btn') || e.target.closest('[data-search-toggle]')) {
                this.open();
                e.preventDefault();
            }
        });

        // Close button
        this.searchClose.addEventListener('click', () => this.close());

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.searchOverlay.classList.contains('active')) {
                this.close();
            }
        });

        // Close on background click
        this.searchOverlay.addEventListener('click', (e) => {
            if (e.target === this.searchOverlay) {
                this.close();
            }
        });

        // Search input logic
        this.searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
    }

    open() {
        if (!this.searchOverlay) return;
        this.searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        setTimeout(() => this.searchInput.focus(), 100);
    }

    close() {
        if (!this.searchOverlay) return;
        this.searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
        this.searchInput.value = '';
        this.resultsContainer.innerHTML = '<div class="search-placeholder">何かお探しですか？</div>';
    }

    performSearch(query) {
        if (!query.trim()) {
            this.resultsContainer.innerHTML = '<div class="search-placeholder">何かお探しですか？</div>';
            return;
        }

        if (!this.isLoaded) {
            this.resultsContainer.innerHTML = '<div class="search-loading">データを読み込み中...</div>';
            return;
        }

        const terms = query.toLowerCase().split(/\s+/).filter(t => t);
        const results = this.index.filter(item => {
            return terms.every(term => item.searchContent.includes(term));
        });

        this.renderResults(results);
    }

    renderResults(results) {
        if (results.length === 0) {
            this.resultsContainer.innerHTML = '<div class="search-no-results">検索結果が見つかりませんでした。</div>';
            return;
        }

        // Adjust paths for articles if we are already in the articles folder
        const linkPrefix = window.location.pathname.includes('/articles/') ? '../' : '';

        const html = results.map(item => `
            <a href="${linkPrefix}${item.url}" class="search-result-item">
                <div class="search-result-title">${item.title}</div>
                <div class="search-result-excerpt">${item.excerpt}</div>
                <div class="search-result-tags">
                    ${item.tags.map(tag => `<span class="search-result-tag">${tag}</span>`).join('')}
                </div>
            </a>
        `).join('');

        this.resultsContainer.innerHTML = html;
    }
}

// Instantiate and attach to window
window.blogSearch = new BlogSearch();
