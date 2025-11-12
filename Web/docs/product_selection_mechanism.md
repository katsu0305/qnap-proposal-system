# QNAP NAS 製品選定システム - 技術仕様書

## 目次
1. [概要](#概要)
2. [製品選定の仕組み](#製品選定の仕組み)
3. [業種別推奨事項](#業種別推奨事項)
4. [estimate.htmlとの連携](#estimatehtmlとの連携)
5. [データフロー](#データフロー)

---

## 概要

このドキュメントは、QNAP NASソリューション提案サイトにおける製品選定システムの技術仕様を説明します。

### システム構成
- **selection.html**: ユーザー入力フォーム
- **js/selection.js**: 製品選定ロジック（9パターンの決定木）
- **estimate.html**: 見積もり作成画面
- **localStorage**: 診断結果の保存

### 処理フロー
```
ユーザー入力 → 製品選定ロジック → 診断結果表示 → 見積もり作成
    ↓              ↓                  ↓              ↓
  8項目        9パターン決定木    業種別推奨事項    自動反映
```

---

## 製品選定の仕組み

### 1. 入力パラメータ（8項目）

#### 1.1 業種（industry）
```javascript
const industry = document.getElementById('industry').value;
```

**選択肢:**
| 値 | 業種名 | 特徴 |
|---|--------|------|
| `manufacturing` | 製造業 | 24時間稼働、IoTデータ |
| `medical` | 医療・福祉 | ランサムウェア対策、暗号化 |
| `construction` | 建設業 | CADデータ、図面管理 |
| `education` | 教育機関 | 教材共有、遠隔授業 |
| `office` | 一般企業・オフィス | 汎用的なファイル共有 |
| `government` | 官公庁・自治体 | 長期保存、法令遵守 |
| `retail` | 流通・販売 | POS連携、在庫管理 |
| `creative` | クリエイティブ | 動画編集、大容量データ |
| `surveillance` | 監視カメラ | 24時間録画、AI分析 |
| `it` | IT・ソフトウェア開発 | Git、Docker、仮想化 |

#### 1.2 ユーザー数（users）
```javascript
const users = document.querySelector('input[name="users"]:checked')?.value;
```

**選択肢:**
- `1-5`: 小規模オフィス
- `5-20`: 中小企業
- `20-50`: 中堅企業
- `50+`: 大企業

#### 1.3 必要容量（capacity）
```javascript
const capacity = parseInt(document.getElementById('capacityRange').value);
```

**範囲:** 1～100 TB（スライダー）

#### 1.4 ダウンタイム許容度（downtime）
```javascript
const downtime = document.getElementById('downtime').value;
```

**選択肢:**
- `week`: 1週間程度なら許容
- `days`: 1～2日なら許容
- `day`: 当日復旧必須
- `hours`: 数時間以内に復旧必須

#### 1.5 予算（budget）
```javascript
const budget = document.querySelector('input[name="budget"]:checked')?.value;
```

**選択肢:**
- `0-30`: ～30万円
- `30-80`: 30～80万円
- `80-300`: 80～300万円
- `300+`: 300万円以上

#### 1.6 ネットワーク速度（network）
```javascript
const network = document.querySelector('input[name="network"]:checked')?.value;
```

**選択肢:**
- `1gbe`: 1GbE（標準的な速度、100MB/秒）
- `2.5gbe`: 2.5GbE（高速転送、250MB/秒）
- `10gbe`: 10GbE（超高速、1GB/秒以上）

#### 1.7 用途（purposes）- 複数選択可
```javascript
const purposes = [];
document.querySelectorAll('input[id^="use"]:checked').forEach(cb => {
    purposes.push(cb.value);
});
```

**選択肢:**
- `file-sharing`: ファイル共有
- `backup`: バックアップ
- `video`: 動画編集
- `surveillance`: 監視カメラ録画
- `ransomware`: ランサムウェア対策
- `cloud`: クラウド連携
- `virtualization`: 仮想化環境バックアップ
- `bcp`: BCP対策（災害対策）

#### 1.8 バックアップ要件（backupRequirements）- 複数選択可
```javascript
const backupRequirements = [];
document.querySelectorAll('input[id^="backup"]:checked').forEach(cb => {
    backupRequirements.push(cb.value);
});
```

**選択肢:**
- `nas_to_nas`: NAS to NAS（オンサイト別NAS）
- `cloud`: クラウドバックアップ
- `external_hdd`: 外付けHDD

---

### 2. 製品選定ロジック（9パターンの決定木）

```javascript
function getRecommendation(users, capacity, budget, downtime, industry, network, purposes, backupRequirements) {
    let product = {};
    
    // 以下の優先順位で判定
}
```

#### パターン1: 10GbE必須 🚀
```javascript
if (network === '10gbe' || purposes.includes('video') || 
    (industry === 'creative' && capacity > 20)) {
```

**条件:**
- ネットワーク速度が10GbE
- または、動画編集用途
- または、クリエイティブ業種 ＋ 容量20TB超

**選定結果:**

**【大規模向け】TS-H1277AFX**
- 価格: ¥3,500,000前後
- 容量: 120TB (12TB×12, RAID 6)
- スペック:
  - 12ベイ
  - 10GBASE-T×2
  - Ryzen 7 9000 8コア
  - 32GB RAM（最大64GB）
- 保守: 24h365d オンサイト保守 ¥471,900
- 対象: 予算300万円以上 または ユーザー数50+

**【中小規模向け】TS-432PXU**
- 価格: ¥660,000前後
- 容量: 32TB (8TB×4, RAID 5)
- スペック:
  - 4ベイ
  - 10GbE SFP+×2
  - Alpine デュアルコア
  - 2GB RAM
- 保守: センドバック保守5年 ¥132,000
- 対象: 上記以外

---

#### パターン2: 監視カメラ業種 📹
```javascript
else if (industry === 'surveillance' || purposes.includes('surveillance')) {
```

**条件:**
- 監視カメラ・セキュリティ業種
- または、監視カメラ録画用途

**選定結果: TS-h765eU（WD Purple構成）**
- 価格: ¥620,000～670,000
- 容量: 12TB (WD Purple 4TB×4, RAID 5)
- スペック:
  - 4ベイ
  - 2.5GbE×2
  - 8GB RAM
- 保守: センドバック保守5年 ¥165,000
- 特徴:
  - WD Purple（監視カメラ専用HDD、180万時間MTBF）
  - QVR Pro（NVR機能）で最大64ch対応
  - 24時間連続書き込み対応
  - AIイベント検知、顔認識機能

---

#### パターン3: ランサムウェア/BCP対策 🛡️
```javascript
else if (purposes.includes('ransomware') || purposes.includes('bcp') || 
         industry === 'medical' || industry === 'government') {
```

**条件:**
- ランサムウェア対策用途
- または、BCP対策用途
- または、医療・福祉業種
- または、官公庁・自治体業種

**選定結果: TS-h765eU × 2台構成**
- 価格: ¥1,920,000前後
- 容量: 48TB (12TB×4, RAID 6) × 2台
- スペック:
  - 4ベイ × 2台
  - 2.5GbE×2
  - 8GB RAM
- 保守: オンサイト保守5年 ¥445,500
- 特徴:
  - ニアラインHDD（5年保証、高信頼性）
  - 本番+バックアップの2台構成
  - オフラインバックアップで3-2-1ルール遵守
  - RAID 6で2台同時故障にも対応

---

#### パターン4: 仮想化環境 💻
```javascript
else if (purposes.includes('virtualization')) {
```

**条件:**
- 仮想化環境バックアップ用途

**選定結果: TS-h765eU（8GB RAM）**
- 価格: ¥880,000前後
- 容量: 40TB (10TB×4, RAID 6)
- スペック:
  - 4ベイ
  - 2.5GbE×2
  - 8GB RAM（拡張可能）
- 保守: オンサイト保守5年 ¥280,500
- 特徴:
  - VMware vSphere、Hyper-V対応
  - スナップショット機能で世代管理
  - 高速復元機能で業務継続性確保

---

#### パターン5: 小規模・低予算 💰
```javascript
else if (users === '1-5' && budget === '0-30') {
```

**条件:**
- ユーザー数: 1～5人
- 予算: 30万円以下

**選定結果: TS-233**
- 価格: ¥150,000前後
- 容量: 4TB (2TB×2, RAID 1)
- スペック:
  - 2ベイ
  - 1GbE×1
  - Cortex-A55 クアッドコア
  - 2GB RAM
- 保守: 延長保証2年 ¥8,360
- 特徴:
  - 小規模オフィスに最適なコストパフォーマンス
  - シンプルなRAID 1構成で信頼性確保
  - 導入・運用コストが低い

---

#### パターン6: 中小企業標準 🏢
```javascript
else if ((users === '5-20' || users === '1-5') && 
         (budget === '30-80' || network === '2.5gbe')) {
```

**条件:**
- ユーザー数: 1～20人
- 予算: 30～80万円
- または、ネットワーク速度2.5GbE

**選定結果: TS-433eU**
- 価格: ¥555,000前後
- 容量: 24TB (8TB×4, RAID 5)
- スペック:
  - 4ベイ
  - 2.5GbE×2
  - Cortex-A55 クアッドコア
  - 4GB RAM
- 保守: センドバック保守5年 ¥101,200
- 特徴:
  - 中小企業に最適なバランス型モデル
  - 2.5GbE対応で高速ファイル転送
  - RAID 5で容量と信頼性のバランスが良好
  - 4ベイで将来の容量拡張が容易

---

#### パターン7: 中堅企業・高性能 🏭
```javascript
else if (users === '20-50' || (budget === '80-300' && capacity > 20)) {
```

**条件:**
- ユーザー数: 20～50人
- または、予算80～300万円 ＋ 容量20TB超

**選定結果: TS-h765eU**
- 価格: ¥730,000前後
- 容量: 32TB (8TB×4, RAID 6)
- スペック:
  - 4ベイ
  - 2.5GbE×2
  - 高性能プロセッサ
  - 8GB RAM（拡張可能）
- 保守: オンサイト保守5年 ¥280,500
- 特徴:
  - 中堅企業向けの高性能モデル
  - 8GB RAMで仮想化にも対応
  - RAID 6で2台同時故障にも対応
  - オンサイト保守で安心運用

---

#### パターン8: 大規模・エンタープライズ 🌐
```javascript
else if (users === '50+' || budget === '300+') {
```

**条件:**
- ユーザー数: 50人以上
- または、予算300万円以上

**選定結果: TS-H1277AFX**
- 価格: ¥3,500,000前後
- 容量: 120TB (12TB×12, RAID 6)
- スペック:
  - 12ベイ
  - 10GBASE-T×2
  - Ryzen 7 9000 8コア
  - 32GB RAM（最大64GB）
- 保守: 24h365d オンサイト保守 ¥471,900
- 特徴:
  - 大規模企業向け最高性能モデル
  - Ryzen 8コアCPUで高い処理能力
  - PCIe拡張スロット×3で高い拡張性
  - 24時間365日の保守で安心

---

#### パターン9: デフォルト（汎用） 📦
```javascript
else {
    // 上記に該当しない場合
}
```

**選定結果: TS-433eU**
- パターン6と同じ
- 多くの企業に適したバランス型モデル

---

### 3. 製品データ構造

選定された製品は以下の構造で返されます:

```javascript
product = {
    model: 'TS-433eU',              // モデル番号
    name: 'QNAP TS-433eU',          // 製品名
    price: '¥257,400～',            // 本体価格
    capacity: '24TB (8TB×4, RAID 5)', // 容量構成
    specs: {                        // 仕様
        bays: '4ベイ',
        network: '2.5GbE×2',
        cpu: 'Cortex-A55 クアッドコア',
        ram: '4GB'
    },
    maintenance: 'センドバック保守 5年推奨', // 保守サービス
    maintenancePrice: '¥101,200',   // 保守価格
    total: '¥555,000前後',          // 合計見積もり
    reasons: [                       // 選定理由
        '中小企業に最適なバランス型モデル',
        '2.5GbE対応で高速ファイル転送',
        'RAID 5で容量と信頼性のバランスが良好',
        '4ベイで将来の容量拡張が容易'
    ],
    additionalNotes: []              // 業種別・バックアップ推奨事項（後述）
};
```

---

## 業種別推奨事項

製品選定後、業種（`industry`）に応じて`additionalNotes`配列に推奨事項を追加します。

### 1. 医療・福祉（medical） 🏥

```javascript
if (industry === 'medical') {
    product.additionalNotes = [
        '医療機関向け推奨: ニアラインHDD（5年保証）を選択',
        'バックアップNASの追加導入を推奨（ランサムウェア対策）',
        'RAID 6構成で高い冗長性を確保',
        '暗号化機能で個人情報保護'
    ];
}
```

#### 推奨内容の詳細

| 推奨事項 | 理由 | 具体的な対応 |
|---------|------|-------------|
| **ニアラインHDD（5年保証）** | 患者データの長期保存が必要 | Seagate Exos、WD Ultrastar |
| **バックアップNASの追加** | ランサムウェア攻撃の標的になりやすい | RTRR（リアルタイムリモートレプリケーション） |
| **RAID 6構成** | 2台同時故障にも対応 | 実効容量50%（4ベイの場合） |
| **暗号化機能** | 個人情報保護法、医療情報システム安全管理ガイドライン対応 | AES 256-bit暗号化 |

#### 適用される製品選定パターン
- パターン3（ランサムウェア/BCP対策）が自動的に適用される
- 2台構成で¥1,920,000前後

---

### 2. 製造業（manufacturing） 🏭

```javascript
if (industry === 'manufacturing') {
    product.additionalNotes = [
        '製造業向け推奨: 24時間稼働対応のエンタープライズHDD',
        '10GbE環境の整備を推奨（IoTデータ収集）',
        'UPSの導入必須',
        '生産データのリアルタイムバックアップ'
    ];
}
```

#### 推奨内容の詳細

| 推奨事項 | 理由 | 具体的な対応 |
|---------|------|-------------|
| **エンタープライズHDD** | 生産ラインの24時間稼働に対応 | WD Ultrastar DC HC550（250万時間MTBF） |
| **10GbE環境** | 工場内IoTセンサーからの大量データ収集 | 転送速度: 最大1.25GB/秒 |
| **UPS必須** | 突然の停電による生産データ損失防止 | 推奨容量: 1500VA以上 |
| **リアルタイムバックアップ** | 生産計画、品質データの即時保護 | スナップショット（15分間隔） |

#### estimate.htmlでの自動反映
- UPSオプションが自動チェックされる
- 10GbEスイッチが推奨される

---

### 3. 官公庁・自治体（government） 🏛️

```javascript
if (industry === 'government') {
    product.additionalNotes = [
        '官公庁向け推奨: ニアラインHDD（長期保存対応）',
        '遠隔地バックアップでBCP対策必須',
        '公文書管理法対応の構成',
        '情報公開請求対応の全文検索機能'
    ];
}
```

#### 推奨内容の詳細

| 推奨事項 | 理由 | 具体的な対応 |
|---------|------|-------------|
| **ニアラインHDD** | 公文書の長期保存義務（5年～永久保存） | 5年保証、低消費電力 |
| **遠隔地バックアップ** | 災害時の業務継続性確保 | 本庁舎+遠隔地データセンター |
| **公文書管理法対応** | 法令遵守、改ざん防止 | WORM（Write Once Read Many）対応 |
| **全文検索機能** | 情報公開法対応、迅速な文書検索 | Qsirch（全文検索エンジン） |

#### 適用される製品選定パターン
- パターン3（ランサムウェア/BCP対策）が自動的に適用される
- 2台構成で¥1,920,000前後

---

### 4. 流通・販売（retail） 🛒

```javascript
if (industry === 'retail') {
    product.additionalNotes = [
        '流通業向け推奨: 本部+各店舗の階層構成',
        '夜間自動同期でリアルタイム在庫管理',
        'POSデータの集約・分析',
        '営業時間中の安定稼働を重視'
    ];
}
```

#### 推奨内容の詳細

| 推奨事項 | 理由 | 具体的な対応 |
|---------|------|-------------|
| **階層構成** | 本部で全店舗データを集約管理 | 本部（大容量NAS）+ 各店舗（小型NAS） |
| **夜間自動同期** | 営業時間外に店舗→本部へデータ同期 | RTRR、Qsync |
| **POSデータ集約** | 売上分析、在庫最適化 | 日次10GB程度のPOSデータ蓄積 |
| **安定稼働** | POSシステムの安定運用 | RAID 5/6、UPS、24時間サポート |

#### システム構成例
```
本部NAS（TS-h765eU）
    ├─ 店舗A NAS（TS-233）
    ├─ 店舗B NAS（TS-233）
    ├─ 店舗C NAS（TS-233）
    └─ ...
```

---

### 5. IT・ソフトウェア開発（it） 💻

```javascript
if (industry === 'it') {
    product.additionalNotes = [
        'IT開発向け推奨: SSDキャッシュ追加',
        'Docker、仮想マシン実行対応',
        'Git リポジトリ、ビルド環境の高速化',
        'スナップショット機能で開発環境の保護'
    ];
}
```

#### 推奨内容の詳細

| 推奨事項 | 理由 | 具体的な対応 |
|---------|------|-------------|
| **SSDキャッシュ** | ソースコード、ビルド環境の高速アクセス | M.2 NVMe SSD 512GB×2（ミラー構成） |
| **Docker/VM対応** | Container Station、Virtualization Station | 8GB以上のRAM必須 |
| **Git/ビルド高速化** | CI/CDパイプラインの高速化 | SSD Qtier（自動階層化） |
| **スナップショット** | コード変更の世代管理、即座にロールバック | 1時間ごと、最大256世代 |

#### 適用される製品選定パターン
- パターン4（仮想化環境）が適用されることが多い
- TS-h765eU（8GB RAM）¥880,000前後

---

### 6. クラウド連携（用途別）

```javascript
else if (purposes.includes('cloud')) {
    if (!product.additionalNotes) product.additionalNotes = [];
    product.additionalNotes.push('Box、OneDrive、Google Drive連携可能');
}
```

業種が上記5つに該当しない場合でも、用途に「クラウド連携」が含まれていれば推奨事項を追加します。

---

## バックアップ要件の推奨事項

バックアップ要件（`backupRequirements`）に応じて、詳細な推奨事項を追加します。

### 1. NAS to NAS（nas_to_nas）

```javascript
if (backupRequirements.includes('nas_to_nas')) {
    product.additionalNotes.push('【NAS to NAS】バックアップ用に2台目のNASを推奨（3-2-1ルール対応）');
    product.additionalNotes.push('  ➜ 同一モデルをもう1台導入し、RTRR（リアルタイムリモートレプリケーション）で自動バックアップ');
    product.additionalNotes.push('  ➜ 推定追加費用: ' + product.price);
}
```

**推奨内容:**
- 同一モデルをもう1台導入
- RTRR（リアルタイムリモートレプリケーション）で自動バックアップ
- 3-2-1ルール対応（3つのコピー、2種類のメディア、1つはオフサイト）
- 推定追加費用を表示

---

### 2. クラウドバックアップ（cloud）

```javascript
if (backupRequirements.includes('cloud')) {
    product.additionalNotes.push('【クラウドバックアップ】HBS 3（Hybrid Backup Sync）で自動クラウドバックアップ');
    product.additionalNotes.push('  ➜ 対応クラウド: AWS S3、Azure Blob、Google Cloud Storage、Backblaze B2等');
    product.additionalNotes.push('  ➜ ランサムウェア対策として重要なオフサイトバックアップ');
}
```

**推奨内容:**
- HBS 3（Hybrid Backup Sync）を使用
- 対応クラウドサービス: AWS S3、Azure Blob、Google Cloud Storage、Backblaze B2、Wasabi等
- ランサムウェア対策として重要なオフサイトバックアップ

---

### 3. 外付けHDD（external_hdd）

```javascript
if (backupRequirements.includes('external_hdd')) {
    product.additionalNotes.push('【外付けHDD】USB 3.2接続の外付けHDDで定期バックアップ（週次・月次）');
    product.additionalNotes.push('  ➜ 推奨容量: NAS容量と同等以上（' + (parseInt(product.capacity) || '32') + 'TB程度）');
    product.additionalNotes.push('  ➜ オフライン保管でランサムウェア対策に有効');
    product.additionalNotes.push('  ➜ USB 3.2 Gen2ポート利用で高速バックアップ可能');
}
```

**推奨内容:**
- USB 3.2接続の外付けHDDを使用
- NAS容量と同等以上の容量を推奨
- オフライン保管でランサムウェア対策に有効
- USB 3.2 Gen2ポート利用で高速バックアップ可能（最大10Gbps）

---

### 4. 複数のバックアップ方法（ベストプラクティス）

```javascript
if (backupRequirements.length >= 2) {
    product.additionalNotes.push('【データ保護ベストプラクティス】');
    product.additionalNotes.push('  ➜ 3-2-1ルール実現: 3つのコピー、2種類のメディア、1つはオフサイト');
    product.additionalNotes.push('  ➜ ランサムウェア攻撃からの復旧率を大幅に向上');
}
```

**3-2-1ルールとは:**
- **3つのコピー**: 本番データ + バックアップ2つ
- **2種類のメディア**: NAS + クラウド、または NAS + 外付けHDD
- **1つはオフサイト**: クラウドまたは遠隔地のNAS

---

## estimate.htmlとの連携

### 1. データの保存

診断結果を`localStorage`に保存:

```javascript
// selection.js
function displayResult(product) {
    // ... 結果表示処理 ...
    
    // ローカルストレージに保存
    try {
        localStorage.setItem('selectedProduct', JSON.stringify(product));
        console.log('診断結果を保存しました:', product);
    } catch (e) {
        console.error('ローカルストレージへの保存に失敗しました:', e);
    }
}
```

### 2. データの読み込みと自動反映

`estimate.html`で自動的に読み込み:

```javascript
// estimate.html
function loadSelectionResult() {
    try {
        const savedProduct = localStorage.getItem('selectedProduct');
        if (savedProduct) {
            const product = JSON.parse(savedProduct);
            
            // 1. 製品モデルを選択
            selectNasModel(product);
            
            // 2. 保守サービスを選択
            selectMaintenancePlan(product);
            
            // 3. オプションを自動チェック
            autoSelectOptions(product);
            
            // 4. 見積もりを更新
            updateEstimate();
            
            // 5. 通知を表示
            showNotification();
        }
    } catch (e) {
        console.error('診断結果の読み込みに失敗しました:', e);
    }
}
```

### 3. 製品モデルのマッピング

```javascript
function selectNasModel(product) {
    const nasModel = document.getElementById('nasModel');
    let selectedValue = '';
    
    // モデル名から適切なオプションを選択
    if (product.model === 'TS-233') {
        selectedValue = 'ts233';
    } else if (product.model === 'TS-433eU') {
        const capacity = parseInt(product.capacity);
        if (capacity <= 8) {
            selectedValue = 'ts433eu-4tb';
        } else if (capacity <= 24) {
            selectedValue = 'ts433eu-16tb';
        } else {
            selectedValue = 'ts433eu-40tb';
        }
    } else if (product.model === 'TS-h765eU') {
        const capacity = parseInt(product.capacity);
        if (capacity <= 8) {
            selectedValue = 'tsh765eu-4tb';
        } else if (capacity <= 32) {
            selectedValue = 'tsh765eu-16tb';
        } else {
            selectedValue = 'tsh765eu-40tb';
        }
    } else if (product.model === 'TS-432PXU') {
        const capacity = parseInt(product.capacity);
        if (capacity <= 8) {
            selectedValue = 'ts432pxu-4tb';
        } else if (capacity <= 24) {
            selectedValue = 'ts432pxu-16tb';
        } else {
            selectedValue = 'ts432pxu-40tb';
        }
    } else if (product.model === 'TS-H1277AFX') {
        selectedValue = 'tsh1277afx';
    }
    
    if (selectedValue) {
        nasModel.value = selectedValue;
    }
}
```

### 4. 保守サービスのマッピング

```javascript
function selectMaintenancePlan(product) {
    const maintenance = document.getElementById('maintenance');
    const maintenancePrice = parseInt(product.maintenancePrice.replace(/[^0-9]/g, ''));
    
    if (maintenancePrice === 0) {
        maintenance.value = 'standard';        // 標準保証3年
    } else if (maintenancePrice < 100000) {
        maintenance.value = 'extended5';       // 5年延長保証
    } else if (maintenancePrice < 150000) {
        maintenance.value = 'sendback';        // センドバック保守
    } else if (maintenancePrice < 250000) {
        maintenance.value = 'onsite';          // オンサイト保守
    } else {
        maintenance.value = 'premium';         // 24h365d保守
    }
}
```

### 5. オプションの自動選択

```javascript
function autoSelectOptions(product) {
    if (product.additionalNotes) {
        product.additionalNotes.forEach(note => {
            // UPS推奨がある場合
            if (note.includes('UPS') || note.includes('無停電電源')) {
                document.getElementById('ups').checked = true;
            }
            
            // データ移行が必要そうな場合
            if (note.includes('データ移行') || note.includes('バックアップ')) {
                document.getElementById('dataMigration').checked = true;
            }
            
            // 10GbE環境推奨がある場合
            if (note.includes('10GbE')) {
                document.getElementById('switch10g').checked = true;
            }
            
            // 2.5GbE環境推奨がある場合
            if (note.includes('2.5GbE')) {
                document.getElementById('switch25g').checked = true;
            }
        });
    }
}
```

---

## データフロー

### 全体フロー図

```
┌─────────────────────────────────────────────────────────────┐
│                     selection.html                          │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. ユーザー入力（8項目）                              │  │
│  │   - 業種、ユーザー数、容量、ダウンタイム               │  │
│  │   - 予算、ネットワーク速度、用途、バックアップ要件     │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                             │
│                  ▼                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 2. showResult()                                        │  │
│  │   - 入力値を収集                                        │  │
│  │   - バリデーション                                      │  │
│  │   - getRecommendation()を呼び出し                      │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                             │
│                  ▼                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 3. getRecommendation() - 製品選定ロジック            │  │
│  │                                                         │  │
│  │   パターン1: 10GbE必須？                              │  │
│  │   パターン2: 監視カメラ？                              │  │
│  │   パターン3: ランサムウェア/BCP？                      │  │
│  │   パターン4: 仮想化？                                  │  │
│  │   パターン5: 小規模・低予算？                          │  │
│  │   パターン6: 中小企業標準？                            │  │
│  │   パターン7: 中堅企業・高性能？                        │  │
│  │   パターン8: 大規模・エンタープライズ？                │  │
│  │   パターン9: デフォルト                                │  │
│  │                                                         │  │
│  │   ↓ 製品決定                                           │  │
│  │                                                         │  │
│  │   業種別推奨事項を追加（medical, manufacturing等）    │  │
│  │   バックアップ要件の推奨事項を追加                     │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                             │
│                  ▼                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 4. displayResult()                                     │  │
│  │   - 結果HTMLを生成                                      │  │
│  │   - 画面に表示                                          │  │
│  │   - localStorage.setItem('selectedProduct', product)  │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                             │
└──────────────────┼─────────────────────────────────────────┘
                   │
                   │ ユーザーが「この構成で見積もり作成」ボタンをクリック
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     estimate.html                           │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 5. loadSelectionResult()                               │  │
│  │   - localStorage.getItem('selectedProduct')           │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                             │
│                  ▼                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 6. 自動反映処理                                         │  │
│  │                                                         │  │
│  │   a. selectNasModel()                                  │  │
│  │      - モデル名→製品オプション選択                      │  │
│  │      - 容量→構成判定（4TB/16TB/40TB）                 │  │
│  │                                                         │  │
│  │   b. selectMaintenancePlan()                          │  │
│  │      - 保守価格→保守プラン選択                         │  │
│  │                                                         │  │
│  │   c. autoSelectOptions()                              │  │
│  │      - additionalNotesから自動判定                     │  │
│  │      - UPS、データ移行、スイッチ等を自動チェック        │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                             │
│                  ▼                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 7. updateEstimate()                                    │  │
│  │   - 製品価格、保守、導入支援、周辺機器を集計          │  │
│  │   - 小計、消費税、合計を計算                           │  │
│  │   - 画面に表示                                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 8. showNotification()                                  │  │
│  │   - 「診断結果を反映しました」通知を表示（5秒間）      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### データ構造の変遷

```javascript
// 1. selection.html - 入力データ
{
    industry: 'medical',
    users: '5-20',
    capacity: 30,
    downtime: 'hours',
    budget: '80-300',
    network: '2.5gbe',
    purposes: ['backup', 'ransomware'],
    backupRequirements: ['nas_to_nas', 'cloud']
}

↓ getRecommendation()

// 2. 選定結果
{
    model: 'TS-h765eU',
    name: 'QNAP TS-h765eU（ニアライン×2台構成）',
    price: '¥1,474,000～',
    capacity: '48TB (12TB×4, RAID 6) × 2台',
    specs: { ... },
    maintenance: 'オンサイト保守 5年推奨',
    maintenancePrice: '¥445,500',
    total: '¥1,920,000前後',
    reasons: [ ... ],
    additionalNotes: [
        '医療機関向け推奨: ニアラインHDD（5年保証）を選択',
        'バックアップNASの追加導入を推奨（ランサムウェア対策）',
        'RAID 6構成で高い冗長性を確保',
        '暗号化機能で個人情報保護',
        '【NAS to NAS】バックアップ用に2台目のNASを推奨（3-2-1ルール対応）',
        '  ➜ 同一モデルをもう1台導入し、RTRR（リアルタイムリモートレプリケーション）で自動バックアップ',
        '  ➜ 推定追加費用: ¥1,474,000～',
        '【クラウドバックアップ】HBS 3（Hybrid Backup Sync）で自動クラウドバックアップ',
        '  ➜ 対応クラウド: AWS S3、Azure Blob、Google Cloud Storage、Backblaze B2等',
        '  ➜ ランサムウェア対策として重要なオフサイトバックアップ'
    ]
}

↓ localStorage.setItem()

// 3. estimate.html - 読み込み・マッピング
{
    nasModel: 'tsh765eu-40tb',           // 容量から判定
    maintenance: 'onsite',                // 保守価格から判定
    options: {
        dataMigration: true,              // additionalNotesから判定
        ups: false
    }
}

↓ updateEstimate()

// 4. 見積もり
{
    productPrice: 970000,
    maintenancePrice: 150000,
    setupPrice: 100000,                   // データ移行
    accessoriesPrice: 0,
    subtotal: 1220000,
    tax: 122000,
    total: 1342000
}
```

---

## まとめ

### システムの特徴

1. **多段階の決定木**: 9つのパターンで最適な製品を選定
2. **業種特化の推奨**: 5つの主要業種に対する詳細な推奨事項
3. **バックアップ戦略**: 3-2-1ルールに基づく具体的な提案
4. **シームレスな連携**: 診断→見積もりへの自動データ連携

### 選定精度の向上ポイント

- **優先順位の明確化**: ネットワーク速度、業種、用途の順で判定
- **複合条件対応**: 複数の用途を組み合わせた判定
- **将来の拡張性**: パターンの追加が容易な構造

### 改善提案

1. **モデルIDの直接管理**: 容量判定ではなく、診断時に直接モデルIDを保存
2. **保守プランIDの追加**: 価格範囲ではなく、プランIDで管理
3. **業種推奨事項の拡充**: 残り5業種への対応
4. **機械学習の導入**: 過去の選定データから最適化

---

## 付録: 製品一覧表

| モデル | 価格帯 | ベイ数 | ネットワーク | 主な用途 | 対象規模 |
|--------|--------|--------|-------------|----------|----------|
| TS-233 | ¥15万 | 2 | 1GbE | 小規模オフィス | 1-5人 |
| TS-433eU | ¥55万 | 4 | 2.5GbE | 中小企業標準 | 5-20人 |
| TS-h765eU | ¥73万～ | 4 | 2.5GbE | 中堅企業・高性能 | 20-50人 |
| TS-432PXU | ¥66万 | 4 | 10GbE | 動画編集・10GbE | 中小規模 |
| TS-H1277AFX | ¥350万 | 12 | 10GbE | 大規模エンタープライズ | 50+人 |

---

**ドキュメントバージョン:** 1.0  
**最終更新日:** 2025年11月13日  
**作成者:** GitHub Copilot
