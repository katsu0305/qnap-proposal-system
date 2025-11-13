# 選定ログ・見積書管理機能 実装ガイド

## 概要

WEB2システムに、製品選定の記録と見積書管理機能を追加します。これにより、以下のメリットが得られます：

1. **ビジネスインサイト**: どの業種・用途が人気か、どの製品が選ばれているかを把握
2. **営業効率化**: 見積書の一元管理、再利用、履歴追跡
3. **データドリブン**: 選定精度の改善、価格戦略の最適化

## 追加されるテーブル

### 1. selection_logs（製品選定ログ）

**目的**: 製品選定機能が実行されるたびに記録を保存

**主要フィールド**:
- `session_id`: セッション識別子（UUID）
- `input_conditions`: ユーザー入力条件（JSON）
- `recommended_model`: 推奨された製品
- `applied_rule`: 適用された選定ルール
- `client_ip`, `user_agent`, `referrer`: アクセス情報

**活用シーン**:
- 人気製品ランキング
- 業種別選定傾向分析
- 選定ルールの効果測定
- 地域別需要分析

### 2. quotes（見積書）

**目的**: 生成された見積書の情報を管理

**主要フィールド**:
- `quote_number`: 見積書番号（例: Q-20251113-0001）
- `customer_name`, `customer_email`, `company_name`: 顧客情報
- `subtotal`, `tax`, `total`: 金額情報
- `status`: ステータス（draft, sent, approved, rejected, expired）
- `valid_until`: 有効期限

**活用シーン**:
- 見積書の検索・管理
- 成約率の分析
- 業種別平均見積金額の把握
- 顧客フォローアップ

### 3. quote_items（見積書明細）

**目的**: 見積書に含まれる各アイテムを管理

**主要フィールド**:
- `quote_id`: 親となる見積書ID
- `item_type`: アイテムタイプ（product, maintenance, setup, accessory）
- `item_name`, `unit_price`: スナップショット（作成時点の情報）
- `quantity`: 数量
- `subtotal`: 小計

**活用シーン**:
- 人気オプションの分析
- セット販売パターンの発見
- クロスセル機会の特定

## 実装の流れ

### Phase 1: データベース構築（1日）

1. **スキーマの適用**
```bash
cd WEB2/backend/models
sqlite3 ../../database.sqlite < schema_with_analytics.sql
```

2. **接続確認**
```javascript
// backend/config/database.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
```

### Phase 2: 選定ログ機能実装（1-2日）

#### 2-1. 選定ログ記録API

**ファイル**: `backend/routes/selection.js`

```javascript
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// 製品選定 + ログ記録
router.post('/recommend', async (req, res) => {
    const { industry, users, capacity, network, purposes } = req.body;
    const sessionId = uuidv4();
    
    try {
        // 1. 選定ロジック実行（既存の処理）
        const recommendation = await executeSelectionLogic(req.body);
        
        // 2. 選定ログを記録
        await db.run(`
            INSERT INTO selection_logs (
                session_id, input_conditions, recommended_model, 
                applied_rule, selection_reason, client_ip, user_agent, referrer
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            sessionId,
            JSON.stringify(req.body),
            recommendation.recommended_model,
            recommendation.applied_rule,
            recommendation.reason,
            req.ip,
            req.get('User-Agent'),
            req.get('Referer')
        ]);
        
        // 3. レスポンス返却（session_idを含む）
        res.json({
            ...recommendation,
            session_id: sessionId
        });
        
    } catch (error) {
        console.error('Selection error:', error);
        res.status(500).json({ error: 'Selection failed' });
    }
});

module.exports = router;
```

#### 2-2. 選定ログ集計API

**ファイル**: `backend/routes/analytics.js`

```javascript
// 人気製品ランキング
router.get('/selections/popular-models', async (req, res) => {
    const { period = '30days' } = req.query;
    
    const days = period === '7days' ? 7 : period === '90days' ? 90 : 30;
    
    const result = await db.all(`
        SELECT 
            recommended_model,
            COUNT(*) as selection_count,
            COUNT(DISTINCT DATE(created_at)) as days_selected,
            ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM selection_logs 
                WHERE created_at >= DATE('now', '-' || ? || ' days')), 2) as percentage
        FROM selection_logs
        WHERE created_at >= DATE('now', '-' || ? || ' days')
        GROUP BY recommended_model
        ORDER BY selection_count DESC
        LIMIT 10
    `, [days, days]);
    
    res.json({ period, data: result });
});

// 業種別選定傾向
router.get('/selections/by-industry', async (req, res) => {
    const result = await db.all(`
        SELECT 
            JSON_EXTRACT(input_conditions, '$.industry') as industry,
            recommended_model,
            COUNT(*) as count
        FROM selection_logs
        WHERE created_at >= DATE('now', '-90 days')
        GROUP BY industry, recommended_model
        ORDER BY industry, count DESC
    `);
    
    res.json({ data: result });
});
```

### Phase 3: 見積書管理機能実装（3-5日）

#### 3-1. 見積書作成API

**ファイル**: `backend/routes/quotes.js`

```javascript
// 見積書新規作成
router.post('/', async (req, res) => {
    const {
        selection_log_id,
        customer_name,
        customer_email,
        customer_phone,
        company_name,
        industry,
        items,
        notes,
        valid_until
    } = req.body;
    
    try {
        // 見積書番号生成（例: Q-20251113-0001）
        const quoteNumber = await generateQuoteNumber();
        
        // 金額計算
        const { subtotal, tax, total } = await calculateQuoteTotal(items);
        
        // トランザクション開始
        await db.run('BEGIN TRANSACTION');
        
        // 1. 見積書ヘッダー作成
        const quoteResult = await db.run(`
            INSERT INTO quotes (
                quote_number, selection_log_id, customer_name, customer_email,
                customer_phone, company_name, industry, subtotal, tax, total,
                status, notes, valid_until
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
        `, [
            quoteNumber, selection_log_id, customer_name, customer_email,
            customer_phone, company_name, industry, subtotal, tax, total,
            notes, valid_until
        ]);
        
        const quoteId = quoteResult.lastID;
        
        // 2. 見積書明細作成
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemDetails = await getItemDetails(item.item_type, item.item_id);
            
            await db.run(`
                INSERT INTO quote_items (
                    quote_id, item_type, item_id, item_name,
                    quantity, unit_price, subtotal, description, sort_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                quoteId,
                item.item_type,
                item.item_id,
                itemDetails.name,
                item.quantity || 1,
                itemDetails.price,
                itemDetails.price * (item.quantity || 1),
                item.description || '',
                i
            ]);
        }
        
        await db.run('COMMIT');
        
        res.status(201).json({
            quote_id: quoteId,
            quote_number: quoteNumber,
            subtotal,
            tax,
            total,
            status: 'draft'
        });
        
    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Quote creation error:', error);
        res.status(500).json({ error: 'Failed to create quote' });
    }
});

// 見積書番号生成
async function generateQuoteNumber() {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = await db.get(`
        SELECT COUNT(*) as count 
        FROM quotes 
        WHERE quote_number LIKE 'Q-${today}-%'
    `);
    
    const serial = String(count.count + 1).padStart(4, '0');
    return `Q-${today}-${serial}`;
}

// アイテム詳細取得
async function getItemDetails(itemType, itemId) {
    let table, nameField;
    
    switch(itemType) {
        case 'product':
            table = 'products';
            nameField = 'product_name';
            break;
        case 'maintenance':
            table = 'maintenance_plans';
            nameField = 'plan_name';
            break;
        case 'setup':
            table = 'setup_services';
            nameField = 'service_name';
            break;
        case 'accessory':
            table = 'accessories';
            nameField = 'accessory_name';
            break;
    }
    
    const item = await db.get(`
        SELECT ${nameField} as name, price 
        FROM ${table} 
        WHERE id = ?
    `, [itemId]);
    
    return item;
}
```

#### 3-2. 見積書一覧・検索API

```javascript
// 見積書一覧取得
router.get('/', async (req, res) => {
    const {
        status,
        industry,
        date_from,
        date_to,
        customer_email,
        sort = 'created_at',
        order = 'DESC',
        limit = 50,
        offset = 0
    } = req.query;
    
    let query = 'SELECT * FROM quotes WHERE 1=1';
    const params = [];
    
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    
    if (industry) {
        query += ' AND industry = ?';
        params.push(industry);
    }
    
    if (customer_email) {
        query += ' AND customer_email LIKE ?';
        params.push(`%${customer_email}%`);
    }
    
    if (date_from) {
        query += ' AND created_at >= ?';
        params.push(date_from);
    }
    
    if (date_to) {
        query += ' AND created_at <= ?';
        params.push(date_to);
    }
    
    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const quotes = await db.all(query, params);
    
    res.json({ data: quotes });
});

// 見積書詳細取得（明細込み）
router.get('/:id', async (req, res) => {
    const quoteId = req.params.id;
    
    const quote = await db.get('SELECT * FROM quotes WHERE id = ?', [quoteId]);
    
    if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
    }
    
    const items = await db.all(`
        SELECT * FROM quote_items 
        WHERE quote_id = ? 
        ORDER BY sort_order
    `, [quoteId]);
    
    res.json({ ...quote, items });
});
```

### Phase 4: 管理画面実装（3-5日）

#### 4-1. ダッシュボード

**ファイル**: `admin/dashboard.html`

```html
<!-- 選定ログ統計 -->
<div class="row">
    <div class="col-md-3">
        <div class="card">
            <div class="card-body">
                <h5>今日の選定回数</h5>
                <h2 id="today-selections">0</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card">
            <div class="card-body">
                <h5>今月の見積数</h5>
                <h2 id="month-quotes">0</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card">
            <div class="card-body">
                <h5>成約率</h5>
                <h2 id="conversion-rate">0%</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card">
            <div class="card-body">
                <h5>今月の見積総額</h5>
                <h2 id="month-total">¥0</h2>
            </div>
        </div>
    </div>
</div>

<!-- 人気製品ランキング -->
<div class="card mt-4">
    <div class="card-header">
        <h5>人気製品ランキング（直近30日）</h5>
    </div>
    <div class="card-body">
        <canvas id="popular-models-chart"></canvas>
    </div>
</div>
```

#### 4-2. 見積書管理画面

**ファイル**: `admin/quotes.html`

- 見積書一覧表示（DataTable）
- ステータスフィルタ
- 検索機能
- 見積書作成ボタン
- 見積書詳細表示モーダル

## 集計レポート例

### 1. 人気製品ランキング

```sql
SELECT 
    recommended_model,
    COUNT(*) as selection_count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM selection_logs), 2) as percentage
FROM selection_logs
WHERE created_at >= DATE('now', '-30 days')
GROUP BY recommended_model
ORDER BY selection_count DESC
LIMIT 10;
```

### 2. 業種別平均見積金額

```sql
SELECT 
    industry,
    COUNT(*) as quote_count,
    AVG(total) as avg_amount,
    MIN(total) as min_amount,
    MAX(total) as max_amount
FROM quotes
WHERE status != 'draft'
GROUP BY industry
ORDER BY avg_amount DESC;
```

### 3. 月次成約率

```sql
SELECT 
    strftime('%Y-%m', created_at) as month,
    COUNT(*) as total_quotes,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
    ROUND(100.0 * SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) / COUNT(*), 2) as approval_rate
FROM quotes
WHERE status IN ('approved', 'rejected', 'expired')
GROUP BY month
ORDER BY month DESC;
```

### 4. 人気オプション組み合わせ

```sql
SELECT 
    qi1.item_name as product,
    qi2.item_name as option,
    COUNT(*) as combination_count
FROM quote_items qi1
JOIN quote_items qi2 ON qi1.quote_id = qi2.quote_id
WHERE qi1.item_type = 'product' 
  AND qi2.item_type IN ('maintenance', 'setup', 'accessory')
GROUP BY qi1.item_name, qi2.item_name
ORDER BY combination_count DESC
LIMIT 20;
```

## 実装優先度

### 高（必須）
1. ✅ selection_logsテーブル作成
2. ✅ 選定API実行時の自動ログ記録
3. ✅ quotesテーブル作成
4. ✅ quote_itemsテーブル作成
5. 見積書作成API
6. 見積書一覧・検索API

### 中（推奨）
7. 基本的な集計クエリ実装
8. ダッシュボードのKPI表示
9. 見積書管理画面
10. PDF生成機能

### 低（将来的に）
11. 高度な分析レポート
12. グラフ・チャート表示
13. メール送信機能
14. 顧客マスタ統合

## メリット総括

### ビジネス面
- 📊 データドリブンな意思決定
- 💡 顧客ニーズの可視化
- 📈 売上予測の精度向上
- 🎯 マーケティング施策の最適化

### 営業面
- ⚡ 見積書作成の効率化
- 📋 履歴管理による顧客フォロー
- 🔄 見積書の再利用・複製
- 📧 自動メール送信（将来実装）

### 開発面
- 🔧 実装コスト: 中程度
- ⏱️ 実装期間: 2-3週間
- 🚀 パフォーマンス影響: 最小限
- 📦 拡張性: 高い

---

**作成日**: 2025年11月13日  
**バージョン**: 1.0  
**関連ドキュメント**:
- [データベースER図](database_er_diagram.md)
- [実装計画書](implementation_plan.md)
- [SQLスキーマ](../backend/models/schema_with_analytics.sql)
