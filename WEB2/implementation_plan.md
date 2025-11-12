# WEB2 実装計画書

## プロジェクト概要

### 目的
WEB1（静的サイト）をベースに、管理者が商材・製品・オプション・価格を動的に管理できる拡張版システムを構築する。

### 主な機能
- 管理者ログイン・認証
- 製品マスタ管理（CRUD操作）
- 保守プランマスタ管理
- 導入支援マスタ管理
- 周辺機器マスタ管理
- 業種別推奨事項管理
- 製品選定ルール管理
- 価格設定管理

---

## アーキテクチャ設計

### 推奨構成（オプションA）

```
WEB2/
├── backend/                 # バックエンドAPI
│   ├── server.js           # Express サーバー
│   ├── config/
│   │   └── database.js     # DB接続設定
│   ├── routes/
│   │   ├── auth.js         # 認証API
│   │   ├── products.js     # 製品管理API
│   │   ├── maintenance.js  # 保守プラン管理API
│   │   ├── setup.js        # 導入支援管理API
│   │   ├── accessories.js  # 周辺機器管理API
│   │   ├── industry.js     # 業種別推奨API
│   │   └── selection.js    # 製品選定API
│   ├── models/
│   │   └── schema.sql      # DBスキーマ定義
│   └── middleware/
│       └── auth.js         # JWT認証ミドルウェア
├── admin/                   # 管理画面
│   ├── index.html          # ログイン画面
│   ├── dashboard.html      # ダッシュボード
│   ├── products.html       # 製品管理
│   ├── options.html        # オプション管理
│   └── js/
│       ├── admin.js        # 管理画面共通ロジック
│       └── api-client.js   # API通信クライアント
├── public/                  # 公開フロントエンド（WEB1ベース）
│   ├── index.html
│   ├── selection.html
│   ├── estimate.html
│   └── js/
│       └── selection-api.js # API連携版製品選定
├── package.json
└── database.sqlite         # SQLiteデータベース
```

### 技術スタック
- **バックエンド**: Node.js + Express.js
- **データベース**: SQLite（開発）→ PostgreSQL/MySQL（本番）
- **認証**: JSON Web Token (JWT)
- **フロントエンド**: HTML5 + Bootstrap 5 + Vanilla JavaScript
- **API設計**: RESTful API

---

## データベース設計

### 1. products（製品マスタ）
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name VARCHAR(50) NOT NULL UNIQUE,
    series VARCHAR(50),
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    capacity VARCHAR(50),
    drive_bays INTEGER,
    network_speed VARCHAR(20),
    cpu VARCHAR(100),
    ram VARCHAR(50),
    features TEXT,
    target_users VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**初期データ例:**
- TS-233: ¥59,800
- TS-433eU: ¥198,000
- TS-h765eU: ¥798,000
- TS-432PXU: ¥398,000
- TS-H1277AFX: ¥1,598,000

---

### 2. maintenance_plans（保守プランマスタ）
```sql
CREATE TABLE maintenance_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_name VARCHAR(100) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    features TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**初期データ例:**
- 3年保守: ¥89,800
- 5年保守: ¥119,800
- オンサイト保守: ¥298,000

---

### 3. setup_services（導入支援マスタ）
```sql
CREATE TABLE setup_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    estimated_hours DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**初期データ例:**
- 基本導入支援: ¥150,000
- 詳細設計支援: ¥250,000
- データマイグレーション支援: ¥350,000

---

### 4. accessories（周辺機器マスタ）
```sql
CREATE TABLE accessories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accessory_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    specifications TEXT,
    compatible_models TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**初期データ例:**
- ラックマウントレール: ¥15,000
- 10GbE拡張カード: ¥45,000
- UPS（無停電電源装置）: ¥89,000

---

### 5. industry_recommendations（業種別推奨事項マスタ）
```sql
CREATE TABLE industry_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    industry VARCHAR(50) NOT NULL,
    recommended_model VARCHAR(50),
    reason TEXT,
    additional_notes TEXT,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recommended_model) REFERENCES products(model_name)
);
```

**初期データ例:**
- 医療業界: TS-h765eU（高可用性、HIPAA対応）
- 製造業: TS-432PXU（10GbE、CAD/CAM対応）
- 官公庁: TS-h765eU（セキュリティ強化）
- 流通業: TS-433eU（POSデータ統合）
- IT業界: TS-H1277AFX（大容量、仮想化対応）

---

### 6. users（管理者ユーザーマスタ）
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 7. selection_rules（製品選定ルール）
```sql
CREATE TABLE selection_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(100) NOT NULL,
    priority INTEGER NOT NULL,
    conditions TEXT NOT NULL,
    recommended_model VARCHAR(50),
    reason TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recommended_model) REFERENCES products(model_name)
);
```

**9つの選定パターン:**
1. 10GbE必須要件
2. 監視カメラシステム
3. ランサムウェア対策/BCP
4. 仮想化環境
5. 小規模・低予算
6. 中小企業向け
7. 中堅企業向け
8. 大規模企業向け
9. デフォルト推奨

---

## API設計

### 1. 認証API

#### POST /api/auth/login
**リクエスト:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

### 2. 製品管理API

#### GET /api/products
全製品一覧取得

**レスポンス:**
```json
[
  {
    "id": 1,
    "model_name": "TS-233",
    "product_name": "QNAP TS-233 2ベイ NAS",
    "price": 59800,
    "capacity": "~8TB",
    "is_active": true
  }
]
```

#### GET /api/products/:id
製品詳細取得

#### POST /api/products
製品新規登録

**リクエスト:**
```json
{
  "model_name": "TS-233",
  "series": "TS-x33",
  "product_name": "QNAP TS-233 2ベイ NAS",
  "price": 59800,
  "capacity": "~8TB",
  "drive_bays": 2,
  "network_speed": "2.5GbE",
  "cpu": "ARM Cortex-A55",
  "ram": "2GB",
  "features": "小規模オフィス向け、静音設計",
  "target_users": "個人事業主、SOHO"
}
```

#### PUT /api/products/:id
製品情報更新

#### DELETE /api/products/:id
製品削除（論理削除: is_active = 0）

---

### 3. 保守プラン管理API

#### GET /api/maintenance
#### POST /api/maintenance
#### PUT /api/maintenance/:id
#### DELETE /api/maintenance/:id

---

### 4. 導入支援管理API

#### GET /api/setup
#### POST /api/setup
#### PUT /api/setup/:id
#### DELETE /api/setup/:id

---

### 5. 周辺機器管理API

#### GET /api/accessories
#### POST /api/accessories
#### PUT /api/accessories/:id
#### DELETE /api/accessories/:id

---

### 6. 業種別推奨API

#### GET /api/industry-recommendations
#### GET /api/industry-recommendations/:industry
#### POST /api/industry-recommendations
#### PUT /api/industry-recommendations/:id
#### DELETE /api/industry-recommendations/:id

---

### 7. 製品選定API（フロントエンド用）

#### POST /api/selection/recommend
製品推奨取得

**リクエスト:**
```json
{
  "industry": "medical",
  "users": "26-100",
  "capacity": "10-50TB",
  "downtime": "low",
  "budget": "medium",
  "network": "10gbe-required",
  "uses": ["file-sharing", "backup"],
  "backup": {
    "nas": true,
    "cloud": false,
    "hdd": true
  }
}
```

**レスポンス:**
```json
{
  "recommended_model": "TS-h765eU",
  "product": {
    "model_name": "TS-h765eU",
    "product_name": "QNAP TS-h765eU 6ベイ エンタープライズNAS",
    "price": 798000,
    "features": "10GbE標準搭載、高可用性"
  },
  "reason": "医療業界向け、10GbE必須要件を満たし、高可用性を実現",
  "additional_recommendations": [
    "定期的なバックアップ設定を推奨",
    "HIPAA対応のセキュリティ設定"
  ],
  "backup_recommendations": {
    "nas": "TS-433eUをバックアップ先として推奨",
    "hdd": "外付けHDD 8TB以上を推奨"
  }
}
```

---

## 管理画面設計

### 1. ログイン画面（admin/index.html）
- ユーザー名・パスワード入力
- JWT認証
- セッション管理（localStorage）

---

### 2. ダッシュボード（admin/dashboard.html）
- 製品数表示
- 保守プラン数表示
- 最近の更新履歴
- クイックアクション（製品追加、価格一括変更）

---

### 3. 製品管理画面（admin/products.html）

**一覧表示:**
| モデル名 | 製品名 | 価格 | 容量 | ステータス | アクション |
|---------|--------|------|------|----------|----------|
| TS-233 | QNAP TS-233... | ¥59,800 | ~8TB | 有効 | 編集/削除 |

**機能:**
- 検索・フィルタリング
- ソート（価格順、容量順）
- 新規登録ボタン
- 一括価格変更
- CSVエクスポート/インポート

---

### 4. 製品編集画面（admin/product-edit.html）

**フォーム項目:**
- モデル名（必須）
- シリーズ
- 製品名（必須）
- 価格（必須）
- 容量
- ドライブベイ数
- ネットワーク速度
- CPU
- RAM
- 特徴（テキストエリア）
- 対象ユーザー
- ステータス（有効/無効）

**バリデーション:**
- モデル名重複チェック
- 価格は正の数値
- 必須項目チェック

---

### 5. オプション管理画面（admin/options.html）

**タブ構成:**
- 保守プラン
- 導入支援
- 周辺機器

各タブで CRUD 操作可能

---

### 6. 価格設定画面（admin/pricing.html）

**一括価格変更:**
- カテゴリ選択（製品/保守/導入支援/周辺機器）
- 変更方法（固定額/パーセンテージ）
- プレビュー機能
- 一括適用

---

### 7. 業種別推奨事項管理（admin/industry.html）

**業種選択:**
- 医療
- 製造業
- 官公庁
- 流通・小売
- IT・通信
- （その他追加可能）

**推奨設定:**
- 推奨モデル選択（ドロップダウン）
- 推奨理由（テキストエリア）
- 追加注意事項（テキストエリア）
- 優先度設定

---

## 実装手順

### フェーズ1: 環境構築（1日）

1. **WEB2フォルダ初期化**
```bash
cd c:/Users/hirok/estimate/Qnap/WEB2
npm init -y
npm install express sqlite3 bcryptjs jsonwebtoken cors dotenv
npm install --save-dev nodemon
```

2. **package.json設定**
```json
{
  "scripts": {
    "start": "node backend/server.js",
    "dev": "nodemon backend/server.js"
  }
}
```

3. **フォルダ構造作成**
```bash
mkdir -p backend/{config,routes,models,middleware}
mkdir -p admin/js
mkdir -p public/js
```

4. **.env ファイル作成**
```env
PORT=3000
JWT_SECRET=your-secret-key-here
DB_PATH=./database.sqlite
```

---

### フェーズ2: バックエンド開発（3-5日）

#### ステップ1: データベース初期化
- `backend/models/schema.sql` 作成
- 初期データ投入スクリプト作成
- DB接続テスト

#### ステップ2: 認証機能実装
- `backend/routes/auth.js` 実装
- JWT発行・検証
- パスワードハッシュ化（bcrypt）

#### ステップ3: 製品管理API実装
- CRUD操作実装
- バリデーション
- エラーハンドリング

#### ステップ4: その他API実装
- 保守プランAPI
- 導入支援API
- 周辺機器API
- 業種別推奨API
- 製品選定API

---

### フェーズ3: 管理画面開発（3-5日）

#### ステップ1: ログイン画面
- `admin/index.html` 作成
- JWT認証フロー実装
- セッション管理

#### ステップ2: ダッシュボード
- `admin/dashboard.html` 作成
- 統計情報表示
- ナビゲーション実装

#### ステップ3: 製品管理画面
- `admin/products.html` 作成
- DataTable実装（検索・ソート）
- CRUD操作実装

#### ステップ4: その他管理画面
- オプション管理
- 価格設定
- 業種別推奨事項

---

### フェーズ4: フロントエンド統合（2-3日）

#### ステップ1: WEB1コピー
- `public/` に WEB1 ファイルをコピー
- 静的ファイル配信設定

#### ステップ2: selection.js API連携化
- `public/js/selection-api.js` 作成
- API呼び出しに変更
- 動的データ読み込み

#### ステップ3: estimate.html API連携化
- 製品データをAPI経由で取得
- 動的価格計算

---

### フェーズ5: テスト・デプロイ（2-3日）

#### ステップ1: 単体テスト
- API エンドポイントテスト
- CRUD操作テスト

#### ステップ2: 統合テスト
- フロントエンド→バックエンド連携テスト
- 製品選定ロジックテスト

#### ステップ3: デプロイ準備
- 本番用DB移行（PostgreSQL/MySQL）
- 環境変数設定
- セキュリティチェック

---

## セキュリティ考慮事項

### 1. 認証・認可
- JWT有効期限設定（24時間推奨）
- パスワードハッシュ化（bcrypt rounds=10）
- HTTPS通信必須

### 2. 入力検証
- SQLインジェクション対策（パラメータ化クエリ）
- XSS対策（入力サニタイズ）
- CSRF対策（トークン検証）

### 3. アクセス制御
- 管理画面は認証必須
- APIエンドポイントに認証ミドルウェア
- ロール別権限設定

---

## 今後の拡張案

### 短期（1-2ヶ月）
- [ ] ユーザーロール管理（管理者/編集者/閲覧者）
- [ ] 操作ログ記録
- [ ] CSVインポート/エクスポート機能
- [ ] 価格履歴管理

### 中期（3-6ヶ月）
- [ ] 見積書PDF出力
- [ ] メール送信機能（見積書送付）
- [ ] 顧客管理機能
- [ ] 在庫管理連携

### 長期（6ヶ月以上）
- [ ] AI自動推奨機能強化
- [ ] 販売データ分析ダッシュボード
- [ ] モバイルアプリ対応
- [ ] 多言語対応

---

## 開発スケジュール概算

| フェーズ | 期間 | 累計 |
|---------|------|------|
| 環境構築 | 1日 | 1日 |
| バックエンド開発 | 3-5日 | 4-6日 |
| 管理画面開発 | 3-5日 | 7-11日 |
| フロントエンド統合 | 2-3日 | 9-14日 |
| テスト・デプロイ | 2-3日 | 11-17日 |

**合計: 2-3週間（実稼働日）**

---

## 必要なリソース

### 開発環境
- Node.js v18以上
- SQLite（開発）/ PostgreSQL or MySQL（本番）
- Git/GitHub
- テキストエディタ（VS Code推奨）

### サーバー環境（デプロイ時）
- VPS または クラウドサーバー（AWS EC2, Azure VM, など）
- ドメイン
- SSL証明書（Let's Encrypt推奨）

---

## 次のアクション

### 推奨開始ステップ
1. **環境構築から開始** → 実装計画の実行
2. **DB設計の詳細化** → スキーマのレビューと調整
3. **プロトタイプ作成** → 小規模な機能で動作確認

### 質問事項
- データベースは SQLite / PostgreSQL / MySQL どれを選択しますか？
- 管理者ユーザーは何名想定ですか？
- 本番環境のサーバーは準備済みですか？
- GitHubリポジトリは WEB2 も同じリポジトリで管理しますか？

---

## 補足資料

### 参考ドキュメント
- Express.js 公式ドキュメント: https://expressjs.com/
- SQLite 公式ドキュメント: https://www.sqlite.org/docs.html
- JWT 概要: https://jwt.io/introduction
- Bootstrap 5 ドキュメント: https://getbootstrap.com/docs/5.3/

### WEB1 との差分
| 項目 | WEB1 | WEB2 |
|------|------|------|
| データ管理 | 静的（JS内にハードコード） | 動的（データベース） |
| 価格変更 | コード修正が必要 | 管理画面から変更可能 |
| 製品追加 | 開発者対応 | 管理者が自分で追加 |
| 認証 | なし | JWT認証 |
| API | なし | RESTful API |

---

**作成日: 2025年11月13日**
**バージョン: 1.0**
**作成者: GitHub Copilot**
