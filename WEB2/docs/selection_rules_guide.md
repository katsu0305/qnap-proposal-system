# 選定ルール設定ガイド

## 目次
1. [選定ルールの概要](#選定ルールの概要)
2. [データベース構造](#データベース構造)
3. [条件（conditions）の設定方法](#条件conditionsの設定方法)
4. [選定エンジンのアルゴリズム](#選定エンジンのアルゴリズム)
5. [9つの選定パターン（初期データ）](#9つの選定パターン初期データ)
6. [管理画面での設定方法](#管理画面での設定方法)
7. [実装例（コード）](#実装例コード)
8. [運用シナリオ](#運用シナリオ)

---

## 選定ルールの概要

### 目的
ユーザーが `selection.html` で入力した条件（業種、人数、予算など）に基づいて、**最適なQNAP製品を自動推奨**するためのルール体系です。

### 基本コンセプト
```
ユーザー入力
  ↓
選定ルールテーブルから優先度順に検索
  ↓
条件に合致する最初のルール適用
  ↓
推奨モデルを製品マスタから取得
  ↓
結果を返却
```

### 特徴
- **優先度制御**: 複数のルールが該当する場合、優先度が高いものを採用
- **柔軟な条件設定**: JSON形式で複雑な条件を表現
- **完全DB駆動**: コード変更なしで選定ロジックを変更可能
- **管理画面で管理**: 営業担当者でもルール変更が可能

---

## データベース構造

### selection_rules テーブル

```sql
CREATE TABLE selection_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(100) NOT NULL,           -- ルール名（管理用）
    priority INTEGER NOT NULL,                 -- 優先度（数値が大きいほど優先）
    conditions TEXT NOT NULL,                  -- 条件（JSON形式）
    recommended_model VARCHAR(50),             -- 推奨モデル名
    reason TEXT,                               -- 推奨理由
    additional_notes TEXT,                     -- 追加の推奨事項
    is_active BOOLEAN DEFAULT 1,               -- 有効/無効
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recommended_model) REFERENCES products(model_name)
);
```

### フィールド詳細

| フィールド | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| id | INTEGER | 自動採番ID | 1 |
| rule_name | VARCHAR(100) | ルールの名前（管理画面で表示） | "10GbE必須（大規模）" |
| priority | INTEGER | 優先度（100が最高、0が最低） | 100 |
| conditions | TEXT (JSON) | マッチング条件 | `{"network": ["10gbe"], "users": ["50+"]}` |
| recommended_model | VARCHAR(50) | 推奨する製品のモデル名 | "TS-H1277AFX" |
| reason | TEXT | この製品を選んだ理由 | "10GbE対応で超高速..." |
| additional_notes | TEXT | 業種別の追加推奨事項 | "UPSの導入必須" |
| is_active | BOOLEAN | 有効/無効フラグ | 1 (有効) |

---

## 条件（conditions）の設定方法

### JSON形式の基本構造

```json
{
  "network": ["10gbe", "2.5gbe"],
  "users": ["50+"],
  "budget": ["300+"],
  "industry": ["medical", "government"],
  "purposes": ["video", "virtualization"],
  "downtime": ["hours"],
  "capacity_min": 50,
  "capacity_max": 100
}
```

### 条件フィールド一覧

#### 1. network（ネットワーク速度）
```json
"network": ["10gbe"]          // 10GbE必須
"network": ["2.5gbe", "10gbe"] // 2.5GbE または 10GbE
```

**取りうる値:**
- `"1gbe"` - 1ギガビットイーサネット
- `"2.5gbe"` - 2.5ギガビットイーサネット
- `"10gbe"` - 10ギガビットイーサネット

---

#### 2. users（ユーザー数）
```json
"users": ["50+"]              // 50人以上
"users": ["20-50", "50+"]     // 20人以上
```

**取りうる値:**
- `"1-5"` - 1～5人
- `"5-20"` - 5～20人
- `"20-50"` - 20～50人
- `"50+"` - 50人以上

---

#### 3. budget（予算）
```json
"budget": ["300+"]            // 300万円以上
"budget": ["80-300", "300+"]  // 80万円以上
```

**取りうる値:**
- `"0-30"` - 30万円以下
- `"30-80"` - 30～80万円
- `"80-300"` - 80～300万円
- `"300+"` - 300万円以上

---

#### 4. industry（業種）
```json
"industry": ["medical"]                    // 医療業界のみ
"industry": ["medical", "government"]      // 医療または官公庁
```

**取りうる値:**
- `"manufacturing"` - 製造業
- `"medical"` - 医療・福祉
- `"construction"` - 建設業
- `"education"` - 教育機関
- `"office"` - 一般企業・オフィス
- `"government"` - 官公庁・自治体
- `"retail"` - 流通・販売
- `"creative"` - クリエイティブ（動画編集・デザイン）
- `"surveillance"` - 監視カメラ・セキュリティ
- `"it"` - IT・ソフトウェア開発

---

#### 5. purposes（用途）
```json
"purposes": ["video"]                      // 動画編集を含む
"purposes": ["ransomware", "bcp"]          // ランサムウェア対策またはBCP
```

**取りうる値:**
- `"file-sharing"` - ファイル共有
- `"backup"` - バックアップ
- `"video"` - 動画編集
- `"surveillance"` - 監視カメラ録画
- `"ransomware"` - ランサムウェア対策
- `"cloud"` - クラウド連携
- `"virtualization"` - 仮想化環境バックアップ
- `"bcp"` - BCP対策（災害対策）

---

#### 6. downtime（ダウンタイム許容度）
```json
"downtime": ["hours"]                      // 数時間以内の復旧必須
"downtime": ["hours", "day"]               // 当日復旧必須
```

**取りうる値:**
- `"week"` - 1週間程度なら許容
- `"days"` - 1～2日なら許容
- `"day"` - 当日復旧必須
- `"hours"` - 数時間以内に復旧必須

---

#### 7. capacity_min / capacity_max（容量範囲）
```json
"capacity_min": 20,    // 最低20TB
"capacity_max": 100    // 最大100TB
```

**数値指定:**
- 単位: TB
- ユーザーがスライダーで指定した容量がこの範囲内であればマッチ

---

### 条件のマッチングロジック

#### AND条件（すべての条件を満たす）
```json
{
  "network": ["10gbe"],
  "users": ["50+"],
  "budget": ["300+"]
}
```
→ 「10GbE」**かつ**「50人以上」**かつ**「予算300万円以上」

#### OR条件（配列内のいずれか）
```json
{
  "industry": ["medical", "government"]
}
```
→ 「医療」**または**「官公庁」

#### 複合条件
```json
{
  "network": ["10gbe"],
  "industry": ["creative", "manufacturing"],
  "purposes": ["video"]
}
```
→ 「10GbE」**かつ**（「クリエイティブ」**または**「製造業」）**かつ**「動画編集を含む」

---

## 選定エンジンのアルゴリズム

### バックエンド実装（Node.js + Express）

```javascript
// backend/routes/selection.js

router.post('/api/selection/recommend', async (req, res) => {
    try {
        const userInput = req.body;
        
        // 1. 有効な選定ルールを優先度順に取得
        const rules = await db.all(`
            SELECT * FROM selection_rules 
            WHERE is_active = 1 
            ORDER BY priority DESC
        `);
        
        // 2. 各ルールの条件をチェック
        let matchedRule = null;
        for (const rule of rules) {
            const conditions = JSON.parse(rule.conditions);
            if (matchConditions(userInput, conditions)) {
                matchedRule = rule;
                break; // 最初にマッチしたルールを採用
            }
        }
        
        // 3. マッチしなければデフォルトルール
        if (!matchedRule) {
            matchedRule = await db.get(`
                SELECT * FROM selection_rules 
                WHERE rule_name = 'デフォルト推奨' 
                LIMIT 1
            `);
        }
        
        // 4. 推奨モデルの製品情報を取得
        const product = await db.get(`
            SELECT * FROM products 
            WHERE model_name = ? AND is_active = 1
        `, [matchedRule.recommended_model]);
        
        // 5. 業種別推奨事項を取得
        const industryNotes = await db.all(`
            SELECT * FROM industry_recommendations 
            WHERE industry = ? AND is_active = 1
        `, [userInput.industry]);
        
        // 6. 結果を返却
        res.json({
            recommended_model: product.model_name,
            product: {
                model_name: product.model_name,
                product_name: product.product_name,
                price: product.price,
                capacity: product.capacity,
                specs: {
                    bays: product.drive_bays,
                    network: product.network_speed,
                    cpu: product.cpu,
                    ram: product.ram
                }
            },
            reason: matchedRule.reason,
            additional_notes: matchedRule.additional_notes,
            industry_recommendations: industryNotes.map(n => n.additional_notes)
        });
        
    } catch (error) {
        console.error('選定エラー:', error);
        res.status(500).json({ error: '製品選定に失敗しました' });
    }
});

// 条件マッチング関数
function matchConditions(userInput, ruleConditions) {
    // network条件チェック
    if (ruleConditions.network) {
        if (!ruleConditions.network.includes(userInput.network)) {
            return false;
        }
    }
    
    // users条件チェック
    if (ruleConditions.users) {
        if (!ruleConditions.users.includes(userInput.users)) {
            return false;
        }
    }
    
    // budget条件チェック
    if (ruleConditions.budget) {
        if (!ruleConditions.budget.includes(userInput.budget)) {
            return false;
        }
    }
    
    // industry条件チェック
    if (ruleConditions.industry) {
        if (!ruleConditions.industry.includes(userInput.industry)) {
            return false;
        }
    }
    
    // purposes条件チェック（配列の交差判定）
    if (ruleConditions.purposes) {
        const hasMatchingPurpose = ruleConditions.purposes.some(
            purpose => userInput.purposes.includes(purpose)
        );
        if (!hasMatchingPurpose) {
            return false;
        }
    }
    
    // downtime条件チェック
    if (ruleConditions.downtime) {
        if (!ruleConditions.downtime.includes(userInput.downtime)) {
            return false;
        }
    }
    
    // capacity条件チェック
    if (ruleConditions.capacity_min) {
        if (userInput.capacity < ruleConditions.capacity_min) {
            return false;
        }
    }
    
    if (ruleConditions.capacity_max) {
        if (userInput.capacity > ruleConditions.capacity_max) {
            return false;
        }
    }
    
    // すべての条件を満たした
    return true;
}
```

---

## 9つの選定パターン（初期データ）

### 初期データ投入SQL

```sql
-- 1. 10GbE必須（大規模）
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '10GbE必須（大規模）',
    100,
    '{"network": ["10gbe"], "users": ["50+"], "budget": ["300+"]}',
    'TS-H1277AFX',
    '10GbE対応で超高速ファイル転送、Ryzen 7 8コアCPUで4K/8K動画編集に最適、大規模企業向け最高性能モデル',
    '12ベイで大容量データに対応、PCIe拡張スロット×3で高い拡張性、24時間365日の保守で安心'
);

-- 2. 10GbE必須（中規模）
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '10GbE必須（中規模）',
    90,
    '{"network": ["10gbe"]}',
    'TS-432PXU',
    '10GbE対応で超高速ファイル転送、動画編集・CADデータに最適、複数人の同時アクセスでも快適',
    'コストパフォーマンスに優れた10GbEモデル、10GbE NIC追加費用込みで約66万円'
);

-- 3. 監視カメラシステム
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '監視カメラシステム',
    85,
    '{"purposes": ["surveillance"]}',
    'TS-h765eU',
    'WD Purple（監視カメラ専用HDD、180万時間MTBF）、QVR Pro（NVR機能）で最大64ch対応、24時間連続書き込み対応',
    'AIイベント検知、顔認識機能、WD Purple 4TB×4構成で約62万円'
);

-- または業種が監視カメラ・セキュリティの場合
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '監視カメラ業種',
    85,
    '{"industry": ["surveillance"]}',
    'TS-h765eU',
    'WD Purple（監視カメラ専用HDD、180万時間MTBF）、QVR Pro（NVR機能）で最大64ch対応、24時間連続書き込み対応',
    'AIイベント検知、顔認識機能、WD Purple 4TB×4構成で約62万円'
);

-- 4. ランサムウェア対策・BCP
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    'ランサムウェア対策・BCP',
    80,
    '{"purposes": ["ransomware", "bcp"]}',
    'TS-h765eU',
    'ニアラインHDD（5年保証、高信頼性）、本番+バックアップの2台構成でランサムウェア対策、オフラインバックアップで3-2-1ルール遵守',
    'RAID 6で2台同時故障にも対応、医療・官公庁に最適な高信頼性構成、2台構成で約192万円'
);

-- 5. 医療・官公庁業種
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '医療・官公庁業種',
    75,
    '{"industry": ["medical", "government"]}',
    'TS-h765eU',
    'ニアラインHDD（5年保証、高信頼性）、本番+バックアップの2台構成推奨、オフラインバックアップで3-2-1ルール遵守',
    'RAID 6で2台同時故障にも対応、個人情報保護法・HIPAA対応、暗号化機能標準搭載'
);

-- 6. 仮想化環境バックアップ
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '仮想化環境バックアップ',
    70,
    '{"purposes": ["virtualization"]}',
    'TS-h765eU',
    'VMware vSphere、Hyper-V対応、8GB RAMで仮想マシンバックアップに最適、スナップショット機能で世代管理',
    '高速復元機能で業務継続性を確保、RAID 6構成で約88万円'
);

-- 7. 小規模・低予算
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '小規模・低予算',
    60,
    '{"users": ["1-5"], "budget": ["0-30"]}',
    'TS-233',
    '小規模オフィスに最適なコストパフォーマンス、シンプルなRAID 1構成で信頼性確保、導入・運用コストが低い',
    'クラウド連携も可能、2TB×2のRAID 1構成で約15万円'
);

-- 8. 中小企業標準（2.5GbE）
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '中小企業標準',
    50,
    '{"users": ["5-20", "1-5"], "budget": ["30-80"]}',
    'TS-433eU',
    '中小企業に最適なバランス型モデル、2.5GbE対応で高速ファイル転送、RAID 5で容量と信頼性のバランスが良好',
    '4ベイで将来の容量拡張が容易、8TB×4のRAID 5構成で約56万円'
);

-- または2.5GbE指定の場合
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '中小企業標準（2.5GbE指定）',
    50,
    '{"network": ["2.5gbe"]}',
    'TS-433eU',
    '中小企業に最適なバランス型モデル、2.5GbE対応で高速ファイル転送、RAID 5で容量と信頼性のバランスが良好',
    '4ベイで将来の容量拡張が容易、コストパフォーマンスに優れる'
);

-- 9. 中堅企業・高性能
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '中堅企業・高性能',
    40,
    '{"users": ["20-50"], "budget": ["80-300"]}',
    'TS-h765eU',
    '中堅企業向けの高性能モデル、8GB RAMで仮想化にも対応、RAID 6で2台同時故障にも対応',
    'オンサイト保守で安心運用、8TB×4のRAID 6構成で約73万円'
);

-- または容量が20TB超の場合
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '大容量要件',
    40,
    '{"capacity_min": 20, "budget": ["80-300"]}',
    'TS-h765eU',
    '中堅企業向けの高性能モデル、大容量データに対応、8GB RAMで仮想化にも対応',
    'RAID 6で2台同時故障にも対応、拡張性に優れる'
);

-- 10. 大規模・エンタープライズ
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    '大規模・エンタープライズ',
    30,
    '{"users": ["50+"], "budget": ["300+"]}',
    'TS-H1277AFX',
    '大規模企業向け最高性能モデル、Ryzen 8コアCPUで高い処理能力、12ベイで大容量データに対応',
    'PCIe拡張スロット×3で高い拡張性、24時間365日の保守で安心、12TB×12のRAID 6構成で約350万円'
);

-- 11. デフォルト推奨（最低優先度）
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason, additional_notes) VALUES (
    'デフォルト推奨',
    1,
    '{}',
    'TS-433eU',
    '多くの企業に適したバランス型モデル、2.5GbE対応で高速転送、コストパフォーマンスに優れる',
    '4ベイで将来の拡張が容易、8TB×4のRAID 5構成で約56万円'
);
```

---

## 管理画面での設定方法

### 1. 選定ルール一覧画面（admin/selection-rules.html）

#### UI構成
```
┌─────────────────────────────────────────────────┐
│ 選定ルール管理                    [+ 新規作成]  │
├─────────────────────────────────────────────────┤
│ [検索] [フィルタ: 全て▼] [優先度順▼] [並び替え] │
├─────┬────────┬──────┬───────┬────┬──────┤
│優先度│ルール名 │推奨モデル│ステータス│作成日│アクション│
├─────┼────────┼──────┼───────┼────┼──────┤
│ 100 │10GbE必須 │TS-H1277..│  有効   │11/13│[編集][削除]│
│  90 │10GbE中規模│TS-432PXU│  有効   │11/13│[編集][削除]│
│  85 │監視カメラ │TS-h765eU│  有効   │11/13│[編集][削除]│
│  ...│  ...    │  ...    │  ...   │ ... │    ...    │
└─────┴────────┴──────┴───────┴────┴──────┘
```

#### 機能
- **ドラッグ&ドロップで優先度変更**
- **一括有効化/無効化**
- **条件の検索・フィルタリング**
- **ルールのテスト実行**（条件を入力して推奨製品を確認）

---

### 2. 選定ルール編集画面（admin/selection-rule-edit.html）

#### フォーム構成

```
┌─────────────────────────────────────────┐
│ 選定ルール編集                           │
├─────────────────────────────────────────┤
│                                         │
│ ルール名 *                               │
│ [10GbE必須（大規模）              ]     │
│                                         │
│ 優先度 * (0-100)                        │
│ [100] ←──────────────────────→         │
│  低                            高        │
│                                         │
│ 条件設定 *                              │
│ ┌─────────────────────────────────┐   │
│ │ ○ ビジュアルエディタ  ● JSON    │   │
│ ├─────────────────────────────────┤   │
│ │                                 │   │
│ │ ネットワーク速度:                │   │
│ │ ☑ 1GbE  ☑ 2.5GbE  ☑ 10GbE     │   │
│ │                                 │   │
│ │ ユーザー数:                      │   │
│ │ ☐ 1-5人  ☐ 5-20人               │   │
│ │ ☐ 20-50人  ☑ 50人以上           │   │
│ │                                 │   │
│ │ 予算:                            │   │
│ │ ☐ ～30万円  ☐ 30～80万円        │   │
│ │ ☐ 80～300万円  ☑ 300万円以上    │   │
│ │                                 │   │
│ │ 業種: (任意)                     │   │
│ │ [選択してください        ▼]     │   │
│ │                                 │   │
│ │ 用途: (任意)                     │   │
│ │ ☐ ファイル共有  ☐ バックアップ  │   │
│ │ ☑ 動画編集  ☐ 監視カメラ        │   │
│ │                                 │   │
│ │ 容量範囲: (任意)                 │   │
│ │ 最小: [20] TB  最大: [100] TB   │   │
│ │                                 │   │
│ └─────────────────────────────────┘   │
│                                         │
│ JSON表示:                               │
│ ┌─────────────────────────────────┐   │
│ │ {                               │   │
│ │   "network": ["10gbe"],         │   │
│ │   "users": ["50+"],             │   │
│ │   "budget": ["300+"]            │   │
│ │ }                               │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 推奨モデル *                            │
│ [TS-H1277AFX              ▼]           │
│  (製品マスタから選択)                   │
│                                         │
│ 推奨理由 *                              │
│ ┌─────────────────────────────────┐   │
│ │10GbE対応で超高速ファイル転送、  │   │
│ │Ryzen 7 8コアCPUで4K/8K動画編集  │   │
│ │に最適、大規模企業向け最高性能   │   │
│ │モデル                           │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 追加の推奨事項 (任意)                   │
│ ┌─────────────────────────────────┐   │
│ │12ベイで大容量データに対応、     │   │
│ │PCIe拡張スロット×3で高い拡張性、 │   │
│ │24時間365日の保守で安心          │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ステータス                              │
│ ○ 有効  ○ 無効                         │
│                                         │
│ ─────────────────────────────────── │
│                                         │
│ [テスト実行]  [保存]  [キャンセル]     │
│                                         │
└─────────────────────────────────────┘
```

#### バリデーション
- ルール名: 必須、1～100文字
- 優先度: 必須、0～100の整数
- 条件: 必須、少なくとも1つの条件を設定
- 推奨モデル: 必須、製品マスタに存在するモデル
- 推奨理由: 必須、1文字以上

---

### 3. ルールのテスト実行

#### テスト画面（モーダルダイアログ）

```
┌─────────────────────────────────────┐
│ ルールのテスト実行          [×閉じる]│
├─────────────────────────────────────┤
│                                     │
│ ユーザー入力条件を設定してください   │
│                                     │
│ 業種: [医療・福祉        ▼]         │
│ ユーザー数: ○ 1-5  ○ 5-20          │
│            ○ 20-50  ● 50+          │
│ 予算: ● ～30  ○ 30-80               │
│      ○ 80-300  ○ 300+              │
│ ネットワーク: ○ 1GbE  ○ 2.5GbE     │
│              ● 10GbE               │
│ 用途: ☑ ファイル共有  ☑ バックアップ│
│      ☑ 動画編集                    │
│ 容量: [50] TB                       │
│                                     │
│ [テスト実行]                         │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ テスト結果:                         │
│ ✓ このルールにマッチしました！       │
│                                     │
│ 推奨モデル: TS-H1277AFX             │
│ 推奨理由:                           │
│ 10GbE対応で超高速ファイル転送、...  │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ 他の該当ルール:                     │
│ • 10GbE必須（中規模）[優先度: 90]   │
│ • 医療・官公庁業種 [優先度: 75]     │
│                                     │
└─────────────────────────────────────┘
```

---

## 実装例（コード）

### フロントエンド（管理画面）

#### selection-rules.js（管理画面用JavaScript）

```javascript
// 選定ルール一覧の取得と表示
async function loadSelectionRules() {
    const response = await fetch('/api/selection-rules', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    const rules = await response.json();
    
    const tableBody = document.getElementById('rulesTableBody');
    tableBody.innerHTML = rules.map(rule => `
        <tr data-rule-id="${rule.id}" draggable="true">
            <td>${rule.priority}</td>
            <td>${rule.rule_name}</td>
            <td>${rule.recommended_model}</td>
            <td>
                <span class="badge ${rule.is_active ? 'bg-success' : 'bg-secondary'}">
                    ${rule.is_active ? '有効' : '無効'}
                </span>
            </td>
            <td>${formatDate(rule.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editRule(${rule.id})">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn btn-sm btn-warning" onclick="testRule(${rule.id})">
                    <i class="fas fa-vial"></i> テスト
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteRule(${rule.id})">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </td>
        </tr>
    `).join('');
    
    // ドラッグ&ドロップで優先度変更
    enableDragAndDrop();
}

// ルールの保存
async function saveRule() {
    const ruleData = {
        rule_name: document.getElementById('ruleName').value,
        priority: parseInt(document.getElementById('priority').value),
        conditions: buildConditionsJSON(),
        recommended_model: document.getElementById('recommendedModel').value,
        reason: document.getElementById('reason').value,
        additional_notes: document.getElementById('additionalNotes').value,
        is_active: document.querySelector('input[name="status"]:checked').value === '1'
    };
    
    // バリデーション
    if (!validateRule(ruleData)) {
        return;
    }
    
    const method = editingRuleId ? 'PUT' : 'POST';
    const url = editingRuleId 
        ? `/api/selection-rules/${editingRuleId}` 
        : '/api/selection-rules';
    
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(ruleData)
    });
    
    if (response.ok) {
        alert('選定ルールを保存しました');
        window.location.href = 'selection-rules.html';
    } else {
        alert('保存に失敗しました');
    }
}

// ビジュアルエディタからJSON条件を構築
function buildConditionsJSON() {
    const conditions = {};
    
    // ネットワーク速度
    const network = Array.from(document.querySelectorAll('input[name="network"]:checked'))
        .map(cb => cb.value);
    if (network.length > 0) {
        conditions.network = network;
    }
    
    // ユーザー数
    const users = Array.from(document.querySelectorAll('input[name="users"]:checked'))
        .map(cb => cb.value);
    if (users.length > 0) {
        conditions.users = users;
    }
    
    // 予算
    const budget = Array.from(document.querySelectorAll('input[name="budget"]:checked'))
        .map(cb => cb.value);
    if (budget.length > 0) {
        conditions.budget = budget;
    }
    
    // 業種
    const industry = document.getElementById('industry').value;
    if (industry) {
        conditions.industry = [industry];
    }
    
    // 用途
    const purposes = Array.from(document.querySelectorAll('input[name="purposes"]:checked'))
        .map(cb => cb.value);
    if (purposes.length > 0) {
        conditions.purposes = purposes;
    }
    
    // 容量範囲
    const capacityMin = document.getElementById('capacityMin').value;
    if (capacityMin) {
        conditions.capacity_min = parseInt(capacityMin);
    }
    
    const capacityMax = document.getElementById('capacityMax').value;
    if (capacityMax) {
        conditions.capacity_max = parseInt(capacityMax);
    }
    
    return JSON.stringify(conditions);
}

// ルールのテスト実行
async function testRule(ruleId) {
    // テスト用モーダルを表示
    const modal = new bootstrap.Modal(document.getElementById('testRuleModal'));
    modal.show();
    
    // テスト実行ボタンのイベント
    document.getElementById('runTest').onclick = async () => {
        const testInput = {
            industry: document.getElementById('testIndustry').value,
            users: document.querySelector('input[name="testUsers"]:checked').value,
            budget: document.querySelector('input[name="testBudget"]:checked').value,
            network: document.querySelector('input[name="testNetwork"]:checked').value,
            purposes: Array.from(document.querySelectorAll('input[name="testPurposes"]:checked'))
                .map(cb => cb.value),
            capacity: parseInt(document.getElementById('testCapacity').value)
        };
        
        // テスト実行API呼び出し
        const response = await fetch(`/api/selection-rules/${ruleId}/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(testInput)
        });
        
        const result = await response.json();
        
        // 結果表示
        document.getElementById('testResult').innerHTML = result.matched
            ? `<div class="alert alert-success">
                 ✓ このルールにマッチしました！<br>
                 推奨モデル: ${result.recommended_model}<br>
                 推奨理由: ${result.reason}
               </div>`
            : `<div class="alert alert-warning">
                 × このルールにマッチしませんでした。
               </div>`;
    };
}
```

---

## 運用シナリオ

### シナリオ1: 新製品追加時

**状況:** 新しいQNAP製品「TS-XXX」を追加

**手順:**
1. **製品マスタに追加**
   - `admin/products.html` で新製品を登録

2. **選定ルールを作成**
   - `admin/selection-rules.html` で「新製品推奨」ルールを作成
   - 優先度を高めに設定（例: 95）
   - 条件: 特定の用途や予算範囲
   - 推奨モデル: TS-XXX

3. **既存ルールの優先度調整**
   - 競合する既存ルールの優先度を下げる

4. **テスト実行**
   - テスト機能で想定ユーザーの条件を入力
   - TS-XXXが推奨されることを確認

---

### シナリオ2: 季節キャンペーン

**状況:** 年末セールで特定モデルを優先的に推奨したい

**手順:**
1. **キャンペーンルールを作成**
   - ルール名: 「年末セール特別推奨」
   - 優先度: 95（通常ルールより高い）
   - 条件: 予算範囲や用途
   - 推奨モデル: キャンペーン対象製品

2. **期間限定で有効化**
   - キャンペーン開始時: ルールを有効化
   - キャンペーン終了時: ルールを無効化

---

### シナリオ3: 在庫調整

**状況:** 特定モデルの在庫が少なくなった

**手順:**
1. **該当ルールを無効化**
   - 在庫が少ないモデルを推奨するルールを無効化

2. **代替ルールを作成**
   - 在庫が豊富な代替モデルを推奨するルールを作成
   - 同等の条件で設定

3. **在庫復帰後**
   - 元のルールを再度有効化

---

### シナリオ4: 営業戦略の変更

**状況:** 高単価モデルの販売を強化したい

**手順:**
1. **高単価モデルの優先度を上げる**
   - 該当ルールの優先度を +10 する

2. **条件を緩和**
   - 予算条件を緩和（例: 80万円以上 → 50万円以上）

3. **効果測定**
   - 選定パターンの利用統計で効果を確認
   - コンバージョン率を分析

---

## まとめ

### 選定ルールの設定のポイント

1. **優先度の設計**
   - 100: 絶対条件（10GbE必須など）
   - 80-90: 特殊用途（監視カメラ、ランサムウェア対策）
   - 60-70: 業種別推奨
   - 40-50: 規模別推奨
   - 1-10: デフォルト

2. **条件の粒度**
   - 複雑すぎる条件は避ける
   - 明確な優先度で制御

3. **テストの徹底**
   - 新規ルール追加時は必ずテスト
   - 既存ルールとの競合を確認

4. **定期的な見直し**
   - 四半期ごとに選定パターンの利用統計を確認
   - 効果の低いルールは削除または条件変更

---

**次のステップ:**
1. 実装計画の確認
2. データベーススキーマの最終調整
3. バックエンドAPI実装
4. 管理画面UI実装
5. テストデータ投入とテスト実行
