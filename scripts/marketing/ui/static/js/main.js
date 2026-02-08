document.addEventListener('DOMContentLoaded', () => {
    const articleSelect = document.getElementById('article-select');
    const generateBtn = document.getElementById('generate-btn');
    const resultsArea = document.getElementById('results-area');
    const loading = document.getElementById('loading');
    const bubble = document.getElementById('char-bubble');

    const startBtn = document.getElementById('start-btn');
    const landingArea = document.getElementById('landing-area');
    const mainControls = document.getElementById('main-controls');

    // News Curator
    const curateNewsBtn = document.getElementById('curate-news-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    const slimeDialogs = {
        idle: [
            '論理的な推論には、十分な「証拠」が必要だ。記事を選んでくれたまえ。',
            '「身体×AI」の交差点には、常に興味深い謎が隠されている。',
            '準備はできている。あとは君が引き金を引くだけだ。'
        ],
        working: [
            '静かに。今、この記事に隠された「本質」を抽出しているところだ...。',
            '観察、知識、そして推論。最善の解が構築されつつある。',
            '細部にこそ、大きな発見が眠っているもの。じっくりと精査しよう。'
        ],
        done: [
            '解決だ。導き出された最善の「答え」を提示しよう。',
            '見事な証拠だ。Threadsでの反応率まで計算済みの構成だよ。',
            'これが「真実」だ。君の指先の価値を、世界に知らしめる時が来た。'
        ],
        curator: [
            'もちスララボ調査班、全ネットワークをスキャン中…。',
            '最新のアルゴリズムから、私たちの「仕事」や「生き方」に関わる重要データを抽出している。',
            '報告だ。ラボの観測網に、個人の生存戦略を大きく変える兆候が捉えられた。'
        ]
    };

    const getRandomDialog = (key) => {
        const list = slimeDialogs[key];
        return list[Math.floor(Math.random() * list.length)];
    };

    const updateBubble = (text) => {
        bubble.innerHTML = text;
    };

    // Load articles and handle selection
    let articlesData = [];
    fetch('/api/articles')
        .then(res => res.json())
        .then(data => {
            articlesData = data;
            data.forEach(article => {
                const option = document.createElement('option');
                option.value = article.path;
                option.textContent = (article.is_analyzed ? '● ' : '○ ') + article.title;
                articleSelect.appendChild(option);
            });
        });

    articleSelect.addEventListener('change', () => {
        const path = articleSelect.value;
        const article = articlesData.find(a => a.path === path);
        if (article && article.is_analyzed) {
            displayResults(article.patterns);
            updateBubble(getRandomDialog('done'));
        } else {
            resultsArea.style.display = 'none';
            updateBubble(getRandomDialog('idle'));
        }
    });

    let latestCurationData = null;

    const displayResults = (data) => {
        resultsArea.style.display = 'block';
        const standardPatterns = document.getElementById('standard-patterns');
        const structuredResults = document.getElementById('structured-results');
        const stockCaseBtn = document.getElementById('stock-case-btn');

        if (data && data.structured) {
            standardPatterns.style.display = 'none';
            structuredResults.style.display = 'block';
            latestCurationData = data; // 保存用に保持

            document.getElementById('cur-analysis').textContent = data.analysis;
            document.getElementById('cur-summary').textContent = data.summary;
            document.getElementById('cur-source').textContent = data.source;
            document.getElementById('cur-commentary').textContent = data.commentary;

            // 保存ボタンの状態をリセット
            if (stockCaseBtn) {
                stockCaseBtn.innerHTML = '<i class="fa-solid fa-box-archive"></i> 本棚にストック';
                stockCaseBtn.disabled = false;
            }
        } else {
            standardPatterns.style.display = 'grid';
            structuredResults.style.display = 'none';
            latestCurationData = null;

            // Lab Analyticsデータは [p1, p2, p3] の配列で送られてくる場合と {patterns: [p1, p2, p3]} の場合がある
            const patterns = Array.isArray(data) ? data : (data ? data.patterns : []) || [];

            for (let i = 1; i <= 3; i++) {
                const card = document.getElementById(`card-p${i}`);
                const content = document.getElementById(`p${i}`);
                if (card && content) {
                    if (patterns[i - 1]) {
                        card.style.display = 'block';
                        content.textContent = patterns[i - 1];
                    } else {
                        card.style.display = 'none';
                    }
                }
            }
        }

        resultsArea.scrollIntoView({ behavior: 'smooth' });
    };

    // Start action
    startBtn.addEventListener('click', () => {
        landingArea.style.display = 'none';
        mainControls.style.display = 'flex';
        bubble.innerHTML = getRandomDialog('idle');
    });

    // Generate action (Manual Refresh / Request)
    generateBtn.addEventListener('click', () => {
        const path = articleSelect.value;
        if (!path) {
            alert('解析対象の記事を選択してください。');
            return;
        }

        loading.style.display = 'flex';
        bubble.innerHTML = getRandomDialog('working');

        fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        })
            .then(res => res.json())
            .then(data => {
                loading.style.display = 'none';
                if (data.error) {
                    alert('解析エラー: ' + data.error);
                    return;
                }
                displayResults(data.patterns);
                bubble.innerHTML = getRandomDialog('done');
            })
            .catch(err => {
                loading.style.display = 'none';
                alert('通信に失敗しました。');
            });
    });

    // Curate News action
    curateNewsBtn.addEventListener('click', () => {
        const topicInput = document.getElementById('custom-topic');
        const topic = topicInput ? topicInput.value.trim() : '';

        loading.style.display = 'flex';
        resultsArea.style.display = 'none';

        if (topic) {
            updateBubble(`『${topic}』の謎を追い、全ネットワークを走査中だ。待ってくれたまえ。`);
        } else {
            updateBubble(slimeDialogs.curator[0]);
        }

        fetch('/api/curate-news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: topic })
        })
            .then(res => res.json())
            .then(data => {
                loading.style.display = 'none';
                if (data.error) {
                    alert('キュレーションエラー: ' + data.error);
                    updateBubble('解析中に何らかの「ノイズ」が混入したようだ。もう一度試してくれたまえ。');
                    return;
                }
                displayResults(data);
                updateBubble(getRandomDialog('done'));
            })
            .catch(err => {
                loading.style.display = 'none';
                alert('通信に失敗しました。');
            });
    });

    // --- ストック（保存）機能 ---
    const stockCaseBtn = document.getElementById('stock-case-btn');
    if (stockCaseBtn) {
        stockCaseBtn.addEventListener('click', async () => {
            if (!latestCurationData) {
                console.error('No curation data to stock');
                return;
            }

            stockCaseBtn.disabled = true;
            stockCaseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 保存中...';

            try {
                const response = await fetch('/api/save-to-archive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(latestCurationData)
                });
                const result = await response.json();
                if (result.success) {
                    stockCaseBtn.innerHTML = '<i class="fa-solid fa-check"></i> 保管完了';
                    updateBubble('貴重な調査データだ。ラボの記録庫に厳重に保管しておいたよ。');
                } else {
                    console.error('Save failed:', result.error);
                    stockCaseBtn.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> 失敗';
                    stockCaseBtn.disabled = false;
                }
            } catch (error) {
                console.error('Stock error:', error);
                stockCaseBtn.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> 失敗';
                stockCaseBtn.disabled = false;
            }
        });
    }

    // --- シェア機能 ---
    const shareXBtn = document.getElementById('share-x-btn');
    const shareThreadsBtn = document.getElementById('share-threads-btn');

    const getShareText = () => {
        if (!latestCurationData) return "";
        return `${latestCurationData.summary}\n\n【ベーカー街の解析】\n${latestCurationData.commentary}\n\n#MochisuraLab #AICurator`;
    };

    shareXBtn.addEventListener('click', () => {
        if (!latestCurationData) return;
        const text = `${latestCurationData.summary}\n\n【もちスララボ調査班の解析】\n${latestCurationData.commentary}\n\n#MochisuraLab #調査報告`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    });

    shareThreadsBtn.addEventListener('click', () => {
        if (!latestCurationData) return;
        const gossipPhrases = [
            "もちスララボ調査班からの報告。気になる調査結果が入ったよ。",
            "業界の地殻変動を検知。ラボの観測網が捉えた事実を共有する。",
            "看過できない「変異」を観測した。調査班の最新レポートだ。",
            "私たちの価値が塗り替えられるような事変。調査班の結論を報告する。"
        ];
        const quote = gossipPhrases[Math.floor(Math.random() * gossipPhrases.length)];
        const hashtags = "\n\n#MochisuraLab #AI調査班";

        // 500文字制限に合わせるための構成
        let baseText = `${quote}\n\n▼ 調査結果\n${latestCurationData.summary}\n\n▼ 調査班の結論\n${latestCurationData.commentary}`;

        if ((baseText + hashtags).length > 500) {
            const allowedLength = 500 - hashtags.length - 3;
            baseText = baseText.substring(0, allowedLength) + "...";
        }

        const finalText = baseText + hashtags;
        window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(finalText)}`, '_blank');
    });

    // --- タブ切り替え ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');

            btn.classList.add('active');
            document.getElementById(target).style.display = 'block';

            if (target === 'news-curator') {
                updateBubble(slimeDialogs.curator[0]);
            } else if (target === 'sherlock-shelf') {
                updateBubble('過去の調査記録だ。ここには未来を生き抜くためのヒントが眠っている。');
                loadArchive();
            } else {
                updateBubble(slimeDialogs.idle[0]);
            }
        });
    });

    const loadArchive = async () => {
        const container = document.getElementById('shelf-container');
        container.innerHTML = '<p class="loading-text">記録庫からデータを搬出中...</p>';

        try {
            const response = await fetch('/api/news-archive');
            const data = await response.json();

            if (data.archive && data.archive.length > 0) {
                container.innerHTML = '';
                // 新しい順に表示
                [...data.archive].reverse().forEach(item => {
                    const card = createArchiveCard(item);
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<p class="empty-text">現在、記録されている事件はありません。</p>';
            }
        } catch (error) {
            console.error('Archive load error:', error);
            container.innerHTML = '<p class="error-text">記録データの読み込みに失敗しました。</p>';
        }
    };

    const createArchiveCard = (item) => {
        const div = document.createElement('div');
        div.className = 'archive-card';
        // タイムスタンプから日付部分だけ抽出
        const dateStr = item.timestamp ? item.timestamp.split(' ')[0] : '不明な日付';
        div.innerHTML = `
            <div class="archive-date"><i class="fa-solid fa-calendar-days"></i> ${dateStr}</div>
            <h3 class="archive-summary">${item.summary ? item.summary.substring(0, 60) + '...' : '無題の記録'}</h3>
            <div class="archive-details" style="display: none; margin-top: 1.5rem;">
                <div class="archive-section">
                    <label>ANALYSIS</label>
                    <p>${item.analysis || '-'}</p>
                </div>
                <div class="archive-section">
                    <label>COMMENTARY</label>
                    <p>${item.commentary || '-'}</p>
                </div>
                <div class="archive-section">
                    <label>SOURCE</label>
                    <p class="small">${item.source || '-'}</p>
                </div>
            </div>
            <button class="view-report-btn">記録を開く</button>
        `;

        div.querySelector('.view-report-btn').addEventListener('click', (e) => {
            const details = div.querySelector('.archive-details');
            const btn = e.target;
            if (details.style.display === 'none') {
                details.style.display = 'block';
                btn.textContent = '記録を閉じる';
            } else {
                details.style.display = 'none';
                btn.textContent = '記録を開く';
            }
        });

        return div;
    };

    // Copy action
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const text = document.getElementById(targetId).textContent;

            navigator.clipboard.writeText(text).then(() => {
                const originalContent = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                btn.style.backgroundColor = '#ecfdf5';
                btn.style.color = '#059669';

                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                }, 2000);
            });
        });
    });

    // Threads direct post action
    document.querySelectorAll('.threads-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const content = document.getElementById(targetId).textContent;

            const gossipPhrases = [
                "ねぇ、もちスララボの最新報告を見たかい？",
                "どうやら私たちの未来に関わる、重要な情報がリークされたらしいよ…",
                "ラボの研究記録を整理していたら、看過できない事実が見つかってね。"
            ];
            const quote = gossipPhrases[Math.floor(Math.random() * gossipPhrases.length)];
            const hashtags = "\n\n#MochisuraLab #AI調査班";
            let baseText = `${quote}\n\n${content}`;

            if ((baseText + hashtags).length > 500) {
                const allowedLength = 500 - hashtags.length - 3;
                baseText = baseText.substring(0, allowedLength) + "...";
            }

            const finalText = baseText + hashtags;
            const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(finalText)}`;
            window.open(url, '_blank');
        });
    });
});
