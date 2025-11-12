// 製品比較ページのJavaScript

// フィルター適用関数
function applyFilters() {
    const priceFilter = document.getElementById('filterPrice').value;
    const baysFilter = document.getElementById('filterBays').value;
    const networkFilter = document.getElementById('filterNetwork').value;
    const formFilter = document.getElementById('filterForm').value;

    // 全ての列を表示
    showAllColumns();

    // 価格帯でフィルター
    if (priceFilter) {
        filterByPrice(priceFilter);
    }

    // ベイ数でフィルター
    if (baysFilter) {
        filterByBays(baysFilter);
    }

    // ネットワークでフィルター
    if (networkFilter) {
        filterByNetwork(networkFilter);
    }

    // 形状でフィルター
    if (formFilter) {
        filterByForm(formFilter);
    }
}

// フィルタークリア
function clearFilters() {
    document.getElementById('filterPrice').value = '';
    document.getElementById('filterBays').value = '';
    document.getElementById('filterNetwork').value = '';
    document.getElementById('filterForm').value = '';
    showAllColumns();
}

// 全ての列を表示
function showAllColumns() {
    const columns = ['ts-233', 'ts-433eu', 'ts-h765eu', 'ts-432pxu', 'ts-h1277afx'];
    columns.forEach(col => {
        const columnIndex = getColumnIndex(col);
        showColumn(columnIndex);
    });
}

// 列インデックスを取得
function getColumnIndex(id) {
    const headers = document.querySelectorAll('#comparisonTable thead th');
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].id === id) {
            return i;
        }
    }
    return -1;
}

// 列を表示
function showColumn(index) {
    const table = document.getElementById('comparisonTable');
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        if (cells[index]) {
            cells[index].style.display = '';
        }
    });
}

// 列を非表示
function hideColumn(index) {
    const table = document.getElementById('comparisonTable');
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        if (cells[index]) {
            cells[index].style.display = 'none';
        }
    });
}

// 価格帯でフィルター
function filterByPrice(range) {
    const priceMap = {
        'ts-233': 9,
        'ts-433eu': 40,
        'ts-h765eu': 60,
        'ts-432pxu': 45,
        'ts-h1277afx': 300
    };

    Object.keys(priceMap).forEach(product => {
        const price = priceMap[product];
        let hide = false;

        switch(range) {
            case '0-30':
                hide = price > 30;
                break;
            case '30-80':
                hide = price < 30 || price > 80;
                break;
            case '80-300':
                hide = price < 80 || price > 300;
                break;
            case '300+':
                hide = price < 300;
                break;
        }

        if (hide) {
            const columnIndex = getColumnIndex(product);
            hideColumn(columnIndex);
        }
    });
}

// ベイ数でフィルター
function filterByBays(bays) {
    const baysMap = {
        'ts-233': '2',
        'ts-433eu': '4',
        'ts-h765eu': '4',
        'ts-432pxu': '4',
        'ts-h1277afx': '12'
    };

    Object.keys(baysMap).forEach(product => {
        if (baysMap[product] !== bays) {
            const columnIndex = getColumnIndex(product);
            hideColumn(columnIndex);
        }
    });
}

// ネットワークでフィルター
function filterByNetwork(network) {
    const networkMap = {
        'ts-233': '1GbE',
        'ts-433eu': '2.5GbE',
        'ts-h765eu': '2.5GbE',
        'ts-432pxu': '10GbE',
        'ts-h1277afx': '10GbE'
    };

    Object.keys(networkMap).forEach(product => {
        if (networkMap[product] !== network) {
            const columnIndex = getColumnIndex(product);
            hideColumn(columnIndex);
        }
    });
}

// 形状でフィルター
function filterByForm(form) {
    const formMap = {
        'ts-233': 'tower',
        'ts-433eu': 'rack',
        'ts-h765eu': 'rack',
        'ts-432pxu': 'rack',
        'ts-h1277afx': 'tower'
    };

    Object.keys(formMap).forEach(product => {
        if (formMap[product] !== form) {
            const columnIndex = getColumnIndex(product);
            hideColumn(columnIndex);
        }
    });
}

// ページロード時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // テーブルの行にホバー効果を追加
    const rows = document.querySelectorAll('#comparisonTable tbody tr');
    rows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
});
