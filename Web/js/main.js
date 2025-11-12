// メインJavaScript

// ページロード時のアニメーション
document.addEventListener('DOMContentLoaded', function() {
    // フェードインアニメーション
    const elements = document.querySelectorAll('.card, .hero-section');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('fade-in');
        }, index * 100);
    });

    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// ナビゲーションのアクティブ状態を更新
function updateActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ページロード時にナビゲーションを更新
updateActiveNav();

// ツールチップの初期化
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});

// ポップオーバーの初期化
var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
var popoverList = popoverTriggerList.map(function(popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
});

// 数字のカウントアップアニメーション
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.innerHTML = value + (element.dataset.suffix || '');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// スクロール時のアニメーション
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            
            // 数字カウントアップ
            if (entry.target.classList.contains('display-4')) {
                const finalValue = parseInt(entry.target.textContent);
                if (!isNaN(finalValue)) {
                    animateValue(entry.target, 0, finalValue, 2000);
                }
            }
        }
    });
}, observerOptions);

// 監視対象の要素を設定
document.querySelectorAll('.card, .display-4').forEach(el => {
    observer.observe(el);
});

// ローカルストレージの管理
const Storage = {
    save: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },
    load: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    },
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }
};

// 製品データ（共通）
const productData = {
    'ts-233': {
        name: 'TS-233',
        category: 'エントリー',
        price: 89760,
        bays: 2,
        network: '1GbE×1',
        cpu: 'Cortex-A55 クアッドコア',
        ram: '2GB',
        target: '小規模オフィス（～5人）'
    },
    'ts-433eu': {
        name: 'TS-433eU',
        category: 'ミドルレンジ',
        price: 229900,
        bays: 4,
        network: '2.5GbE×2',
        cpu: 'Cortex-A55 クアッドコア',
        ram: '4GB',
        target: '中小企業（5～50人）'
    },
    'ts-h765eu': {
        name: 'TS-h765eU',
        category: 'ミドルレンジ',
        price: 312400,
        bays: 4,
        network: '2.5GbE×2',
        cpu: '高性能プロセッサ',
        ram: '8GB',
        target: '中堅企業（20～50人）'
    },
    'ts-432pxu': {
        name: 'TS-432PXU',
        category: 'ハイエンド',
        price: 261800,
        bays: 4,
        network: '10GbE SFP+×2',
        cpu: 'Alpine デュアルコア',
        ram: '2GB',
        target: '動画編集・大容量転送'
    },
    'ts-h1277afx': {
        name: 'TS-H1277AFX',
        category: 'エンタープライズ',
        price: 1320000,
        bays: 12,
        network: '10GBASE-T×2',
        cpu: 'Ryzen 7 9000 8コア',
        ram: '32GB',
        target: '大規模企業（50人以上）'
    }
};

// 価格フォーマット関数
function formatPrice(price) {
    return '¥' + price.toLocaleString('ja-JP');
}

// エクスポート（他のファイルで使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Storage, productData, formatPrice };
}
