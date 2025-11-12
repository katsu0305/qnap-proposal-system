# QNAP NAS 提案支援システム

QNAP NAS製品の提案支援Webサイトとバックエンド管理システム

## プロジェクト構成

```
Qnap/
├── Web/          # WEB1 - 静的フロントエンドサイト
│   ├── index.html
│   ├── selection.html    # 製品選定ツール
│   ├── estimate.html     # 見積もり作成
│   ├── comparison.html   # 製品比較
│   ├── solutions.html    # 業種別ソリューション
│   ├── cases.html        # 導入事例
│   ├── technical.html    # 技術資料
│   ├── js/
│   ├── css/
│   └── docs/            # ドキュメント
│
└── WEB2/         # WEB2 - 動的管理システム（実装予定）
    └── implementation_plan.md  # 実装計画書
```

## WEB1 - 静的サイト

### 概要
QNAP NAS製品の提案を支援する静的Webサイト。製品選定ツール、見積もり作成、業種別ソリューションなどを提供。

### 主な機能
- **製品選定ツール**: 8つの入力パラメータから最適な製品を推奨
- **見積もり作成**: 製品・保守プラン・導入支援の見積書作成
- **製品比較**: 5製品のスペック比較
- **業種別ソリューション**: 医療、製造、官公庁、流通、IT業界向け提案
- **導入事例**: 実際の導入事例紹介
- **技術資料**: 製品の技術仕様書

### 製品選定ロジック
9つのパターンで製品を選定：
1. 10GbE必須要件
2. 監視カメラシステム
3. ランサムウェア対策/BCP
4. 仮想化環境
5. 小規模・低予算
6. 中小企業向け
7. 中堅企業向け
8. 大規模企業向け
9. デフォルト推奨

### 技術スタック
- HTML5, CSS3
- Bootstrap 5.3.0
- Font Awesome 6.4.0
- Vanilla JavaScript
- localStorage（データ連携）

### GitHubリポジトリ
https://github.com/katsu0305/estimate

---

## WEB2 - 動的管理システム（実装予定）

### 概要
管理者が商材・製品・オプション・価格を動的に管理できる拡張版システム。

### 主な機能
- 管理者ログイン・認証
- 製品マスタ管理（CRUD操作）
- 保守プランマスタ管理
- 導入支援マスタ管理
- 周辺機器マスタ管理
- 業種別推奨事項管理
- 製品選定ルール管理
- 価格設定管理

### 技術スタック（予定）
- **バックエンド**: Node.js + Express.js
- **データベース**: SQLite（開発）→ PostgreSQL/MySQL（本番）
- **認証**: JSON Web Token (JWT)
- **フロントエンド**: HTML5 + Bootstrap 5 + Vanilla JavaScript
- **API設計**: RESTful API

### 実装計画
詳細は `WEB2/implementation_plan.md` を参照

---

## セットアップ方法

### WEB1（静的サイト）
```bash
cd Web
# ブラウザで index.html を開く
```

### WEB2（実装予定）
```bash
cd WEB2
npm install
npm run dev
```

---

## ライセンス
Private Project

## 作成者
GitHub Copilot (2025年11月)
