/**
 * Series Navigation Component
 * シリーズ記事間のナビゲーションを提供
 */

class SeriesNavigation {
    constructor() {
        this.seriesConfig = null;
        this.currentArticle = null;
        this.currentSeries = null;
    }

    /**
     * 初期化
     */
    async init() {
        try {
            // シリーズ設定を読み込み
            await this.loadSeriesConfig();

            // 現在の記事を特定
            this.identifyCurrentArticle();

            // ナビゲーションを表示
            if (this.currentSeries) {
                this.renderNavigation();
            }
        } catch (error) {
            console.error('Series navigation initialization failed:', error);
        }
    }

    /**
     * シリーズ設定を読み込む
     */
    async loadSeriesConfig() {
        try {
            const response = await fetch('../series-config.json');
            if (!response.ok) {
                throw new Error('Failed to load series config');
            }
            const data = await response.json();
            this.seriesConfig = data.series;
        } catch (error) {
            console.error('Error loading series config:', error);
            this.seriesConfig = [];
        }
    }

    /**
     * 現在の記事がどのシリーズに属するか特定
     */
    identifyCurrentArticle() {
        const currentPath = window.location.pathname;
        const currentSlug = currentPath.split('/').pop().replace('.html', '');

        for (const series of this.seriesConfig) {
            const articleIndex = series.articles.findIndex(
                article => article.slug === currentSlug
            );

            if (articleIndex !== -1) {
                this.currentSeries = series;
                this.currentArticle = {
                    ...series.articles[articleIndex],
                    index: articleIndex,
                    totalCount: series.articles.length
                };
                break;
            }
        }
    }

    /**
     * ナビゲーションHTMLを生成
     */
    generateNavigationHTML() {
        const { index, totalCount } = this.currentArticle;
        const articles = this.currentSeries.articles;

        const hasPrevious = index > 0;
        const hasNext = index < totalCount - 1;

        const previousArticle = hasPrevious ? articles[index - 1] : null;
        const nextArticle = hasNext ? articles[index + 1] : null;

        return `
      <nav class="series-navigation" aria-label="シリーズナビゲーション">
        <div class="series-info">
          <span class="series-badge">📚 シリーズ</span>
          <h3 class="series-title">${this.currentSeries.title}</h3>
          <p class="series-progress">Part ${index + 1} / ${totalCount}</p>
        </div>

        <div class="series-links">
          ${hasPrevious ? `
            <a href="${previousArticle.url}" class="series-link series-prev">
              <span class="series-link-label">← 前の記事</span>
              <span class="series-link-title">${previousArticle.title}</span>
            </a>
          ` : `
            <div class="series-link series-prev disabled">
              <span class="series-link-label">← 前の記事</span>
              <span class="series-link-title">これが最初の記事です</span>
            </div>
          `}

          ${hasNext ? `
            <a href="${nextArticle.url}" class="series-link series-next">
              <span class="series-link-label">次の記事 →</span>
              <span class="series-link-title">${nextArticle.title}</span>
            </a>
          ` : `
            <div class="series-link series-next disabled">
              <span class="series-link-label">次の記事 →</span>
              <span class="series-link-title">続きをお楽しみに！</span>
            </div>
          `}
        </div>

        ${totalCount > 2 ? this.generateSeriesList() : ''}
      </nav>
    `;
    }

    /**
     * シリーズ記事一覧を生成
     */
    generateSeriesList() {
        const articles = this.currentSeries.articles;
        const currentIndex = this.currentArticle.index;

        const listItems = articles.map((article, index) => {
            const isCurrent = index === currentIndex;
            const statusIcon = isCurrent ? '📍' : (index < currentIndex ? '✅' : '📄');

            return `
        <li class="series-list-item ${isCurrent ? 'current' : ''}">
          ${isCurrent ? `
            <span class="series-list-link current">
              <span class="series-list-icon">${statusIcon}</span>
              <span class="series-list-title">${article.title}</span>
              <span class="series-list-badge">現在の記事</span>
            </span>
          ` : `
            <a href="${article.url}" class="series-list-link">
              <span class="series-list-icon">${statusIcon}</span>
              <span class="series-list-title">${article.title}</span>
            </a>
          `}
        </li>
      `;
        }).join('');

        return `
      <details class="series-list-container">
        <summary class="series-list-toggle">このシリーズの全記事を見る</summary>
        <ol class="series-list">
          ${listItems}
        </ol>
      </details>
    `;
    }

    /**
     * ナビゲーションをDOMに挿入
     */
    renderNavigation() {
        const navigationHTML = this.generateNavigationHTML();

        // 記事コンテンツの直後に挿入
        const articleContent = document.querySelector('.article-content');
        if (articleContent) {
            const navContainer = document.createElement('div');
            navContainer.innerHTML = navigationHTML;
            articleContent.appendChild(navContainer.firstElementChild);
        }
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    const seriesNav = new SeriesNavigation();
    seriesNav.init();
});
