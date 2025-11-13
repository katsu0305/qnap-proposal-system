-- ============================================================================
-- QNAP提案システム データベーススキーマ (拡張版)
-- バージョン: 2.0
-- 作成日: 2025年11月13日
-- 説明: 選定ログ・見積書管理機能を含む完全なスキーマ
-- ============================================================================

-- ============================================================================
-- 1. ユーザー管理テーブル
-- ============================================================================

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

CREATE INDEX idx_users_username ON users(username);

-- ============================================================================
-- 2. 製品マスタテーブル
-- ============================================================================

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

CREATE INDEX idx_products_model_name ON products(model_name);
CREATE INDEX idx_products_is_active ON products(is_active);

-- ============================================================================
-- 3. 保守プランマスタテーブル
-- ============================================================================

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

CREATE INDEX idx_maintenance_is_active ON maintenance_plans(is_active);

-- ============================================================================
-- 4. 導入支援サービスマスタテーブル
-- ============================================================================

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

CREATE INDEX idx_setup_is_active ON setup_services(is_active);

-- ============================================================================
-- 5. 周辺機器マスタテーブル
-- ============================================================================

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

CREATE INDEX idx_accessories_category ON accessories(category);
CREATE INDEX idx_accessories_is_active ON accessories(is_active);

-- ============================================================================
-- 6. 業種別推奨事項マスタテーブル
-- ============================================================================

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
    FOREIGN KEY (recommended_model) REFERENCES products(model_name) ON UPDATE CASCADE
);

CREATE INDEX idx_industry_recommendations_industry ON industry_recommendations(industry);
CREATE INDEX idx_industry_recommendations_model ON industry_recommendations(recommended_model);

-- ============================================================================
-- 7. 製品選定ルールテーブル
-- ============================================================================

CREATE TABLE selection_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(100) NOT NULL,
    priority INTEGER NOT NULL,
    conditions TEXT NOT NULL, -- JSON形式
    recommended_model VARCHAR(50),
    reason TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recommended_model) REFERENCES products(model_name) ON UPDATE CASCADE
);

CREATE INDEX idx_selection_rules_priority ON selection_rules(priority DESC);
CREATE INDEX idx_selection_rules_model ON selection_rules(recommended_model);
CREATE INDEX idx_selection_rules_is_active ON selection_rules(is_active);

-- ============================================================================
-- 8. 製品選定ログテーブル（★新規追加）
-- ============================================================================

CREATE TABLE selection_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(64) NOT NULL UNIQUE, -- UUID推奨
    input_conditions TEXT NOT NULL, -- JSON形式
    recommended_model VARCHAR(50),
    applied_rule VARCHAR(100),
    selection_reason TEXT,
    client_ip VARCHAR(45), -- IPv6対応
    user_agent TEXT,
    referrer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recommended_model) REFERENCES products(model_name) ON UPDATE CASCADE
);

CREATE INDEX idx_selection_logs_session_id ON selection_logs(session_id);
CREATE INDEX idx_selection_logs_model ON selection_logs(recommended_model);
CREATE INDEX idx_selection_logs_created_at ON selection_logs(created_at DESC);
CREATE INDEX idx_selection_logs_applied_rule ON selection_logs(applied_rule);

-- ============================================================================
-- 9. 見積書テーブル（★新規追加）
-- ============================================================================

CREATE TABLE quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_number VARCHAR(50) NOT NULL UNIQUE, -- 例: Q-20251113-0001
    selection_log_id INTEGER, -- NULL許可（手動作成の場合）
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    company_name VARCHAR(200),
    industry VARCHAR(50),
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, approved, rejected, expired
    notes TEXT,
    valid_until DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (selection_log_id) REFERENCES selection_logs(id) ON DELETE SET NULL
);

CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_customer_email ON quotes(customer_email);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_industry ON quotes(industry);

-- ============================================================================
-- 10. 見積書明細テーブル（★新規追加）
-- ============================================================================

CREATE TABLE quote_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL,
    item_type VARCHAR(20) NOT NULL, -- product, maintenance, setup, accessory
    item_id INTEGER NOT NULL, -- 各マスタテーブルのID
    item_name VARCHAR(200) NOT NULL, -- スナップショット
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL, -- スナップショット
    subtotal DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_item_type ON quote_items(item_type);
CREATE INDEX idx_quote_items_item_id ON quote_items(item_id);

-- ============================================================================
-- 初期データ投入（管理者ユーザー）
-- ============================================================================

-- デフォルト管理者アカウント
-- ユーザー名: admin
-- パスワード: admin123 (bcryptハッシュ: $2a$10$例)
-- 実装時に実際のbcryptハッシュに置き換えてください
INSERT INTO users (username, password_hash, email, role) 
VALUES ('admin', '$2a$10$YourBcryptHashHere', 'admin@example.com', 'admin');

-- ============================================================================
-- ビュー定義（便利なクエリ）
-- ============================================================================

-- 製品選定ログの集計ビュー
CREATE VIEW v_selection_stats AS
SELECT 
    recommended_model,
    COUNT(*) as selection_count,
    COUNT(DISTINCT DATE(created_at)) as days_selected,
    MAX(created_at) as last_selected
FROM selection_logs
GROUP BY recommended_model;

-- 見積書の集計ビュー
CREATE VIEW v_quote_stats AS
SELECT 
    strftime('%Y-%m', created_at) as month,
    status,
    COUNT(*) as quote_count,
    SUM(total) as total_amount,
    AVG(total) as avg_amount
FROM quotes
GROUP BY month, status;

-- 見積書詳細ビュー（明細込み）
CREATE VIEW v_quotes_with_items AS
SELECT 
    q.id as quote_id,
    q.quote_number,
    q.customer_name,
    q.company_name,
    q.industry,
    q.total,
    q.status,
    q.created_at,
    qi.item_type,
    qi.item_name,
    qi.quantity,
    qi.unit_price,
    qi.subtotal
FROM quotes q
LEFT JOIN quote_items qi ON q.id = qi.quote_id;

-- ============================================================================
-- トリガー定義（自動更新）
-- ============================================================================

-- quotes テーブルの updated_at 自動更新
CREATE TRIGGER update_quotes_timestamp 
AFTER UPDATE ON quotes
BEGIN
    UPDATE quotes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- products テーブルの updated_at 自動更新
CREATE TRIGGER update_products_timestamp 
AFTER UPDATE ON products
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- maintenance_plans テーブルの updated_at 自動更新
CREATE TRIGGER update_maintenance_timestamp 
AFTER UPDATE ON maintenance_plans
BEGIN
    UPDATE maintenance_plans SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- setup_services テーブルの updated_at 自動更新
CREATE TRIGGER update_setup_timestamp 
AFTER UPDATE ON setup_services
BEGIN
    UPDATE setup_services SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- accessories テーブルの updated_at 自動更新
CREATE TRIGGER update_accessories_timestamp 
AFTER UPDATE ON accessories
BEGIN
    UPDATE accessories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- industry_recommendations テーブルの updated_at 自動更新
CREATE TRIGGER update_industry_recommendations_timestamp 
AFTER UPDATE ON industry_recommendations
BEGIN
    UPDATE industry_recommendations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- selection_rules テーブルの updated_at 自動更新
CREATE TRIGGER update_selection_rules_timestamp 
AFTER UPDATE ON selection_rules
BEGIN
    UPDATE selection_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- users テーブルの updated_at 自動更新
CREATE TRIGGER update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- サンプルデータ（開発・テスト用）
-- ============================================================================

-- 製品マスタのサンプルデータ
INSERT INTO products (model_name, series, product_name, price, capacity, drive_bays, network_speed, cpu, ram, features, target_users) VALUES
('TS-233', 'TS-x33', 'QNAP TS-233 2ベイ NAS', 59800, '~8TB', 2, '2.5GbE', 'ARM Cortex-A55', '2GB', '小規模オフィス向け、静音設計', '個人事業主、SOHO'),
('TS-433eU', 'TS-x33eU', 'QNAP TS-433eU 4ベイ ラックマウントNAS', 198000, '~32TB', 4, '2.5GbE', 'ARM Cortex-A72', '4GB', 'ラックマウント、中小企業向け', '中小企業'),
('TS-h765eU', 'TS-hx65eU', 'QNAP TS-h765eU 6ベイ エンタープライズNAS', 798000, '~60TB', 6, '10GbE', 'Intel Xeon', '16GB', '10GbE標準搭載、高可用性', '中堅企業、官公庁'),
('TS-432PXU', 'TS-x32PXU', 'QNAP TS-432PXU 4ベイ 10GbE NAS', 398000, '~32TB', 4, '10GbE', 'ARM Cortex-A72', '4GB', '10GbE対応、コストパフォーマンス重視', '製造業、IT企業'),
('TS-H1277AFX', 'TS-Hx77AFX', 'QNAP TS-H1277AFX 12ベイ フラッグシップNAS', 1598000, '~120TB', 12, '25GbE', 'AMD EPYC', '32GB', '超高速、大容量、仮想化対応', '大企業、データセンター');

-- 保守プランのサンプルデータ
INSERT INTO maintenance_plans (plan_name, duration, price, features) VALUES
('3年保守プラン', '3年', 89800, '故障時のハードウェア交換、電話サポート'),
('5年保守プラン', '5年', 119800, '故障時のハードウェア交換、電話サポート、優先対応'),
('オンサイト保守（3年）', '3年', 298000, '故障時の訪問修理、24時間対応、予防保守');

-- 導入支援サービスのサンプルデータ
INSERT INTO setup_services (service_name, service_type, price, description, estimated_hours) VALUES
('基本導入支援', 'basic', 150000, 'ネットワーク設定、初期ユーザー登録、基本操作説明', 8),
('詳細設計支援', 'advanced', 250000, 'ストレージプール設計、RAID構成、バックアップ設計', 16),
('データマイグレーション支援', 'migration', 350000, '既存データの移行作業、動作確認、ユーザートレーニング', 24);

-- 周辺機器のサンプルデータ
INSERT INTO accessories (accessory_name, category, price, specifications, compatible_models) VALUES
('ラックマウントレール', 'mounting', 15000, '19インチラック対応、耐荷重50kg', 'TS-433eU,TS-h765eU,TS-432PXU'),
('10GbE拡張カード', 'network', 45000, '10GBASE-T RJ45 x2ポート、PCIe 3.0', 'TS-433eU,TS-432PXU'),
('UPS（無停電電源装置）', 'power', 89000, '1500VA/900W、バッテリー駆動時間10分', 'すべてのモデル');

-- 業種別推奨事項のサンプルデータ
INSERT INTO industry_recommendations (industry, recommended_model, reason, additional_notes, priority) VALUES
('medical', 'TS-h765eU', '医療業界向け、高可用性とHIPAA対応', '定期的なバックアップ設定を推奨', 1),
('manufacturing', 'TS-432PXU', '製造業向け、10GbE対応でCAD/CAMデータ高速転送', '大容量HDDの導入を推奨', 1),
('government', 'TS-h765eU', '官公庁向け、セキュリティ強化とログ記録機能', 'アクセス制御の厳格化が必要', 1),
('retail', 'TS-433eU', '流通・小売業向け、POSデータ統合', 'バックアップ先として追加NASを推奨', 1),
('it', 'TS-H1277AFX', 'IT業界向け、大容量・仮想化対応', '高速ネットワーク環境の整備を推奨', 1);

-- 選定ルールのサンプルデータ
INSERT INTO selection_rules (rule_name, priority, conditions, recommended_model, reason) VALUES
('10GbE必須（大規模）', 100, '{"network":["10gbe"],"users":["50+"],"budget":["300+"]}', 'TS-H1277AFX', '10GbE対応で超高速ファイル転送、大規模環境に最適'),
('10GbE必須（中規模）', 90, '{"network":["10gbe"],"users":["26-100"]}', 'TS-h765eU', '10GbE標準搭載、中規模環境に最適なコストパフォーマンス'),
('10GbE必須（小規模）', 85, '{"network":["10gbe"],"users":["11-25"]}', 'TS-432PXU', '10GbE対応、小規模でも高速転送が必要な場合に最適'),
('監視カメラシステム', 80, '{"purposes":["surveillance"]}', 'TS-433eU', '監視カメラデータの長期保存に最適'),
('ランサムウェア対策', 75, '{"purposes":["backup"],"downtime":["low"]}', 'TS-h765eU', 'スナップショット機能でランサムウェア対策'),
('仮想化環境', 70, '{"purposes":["virtualization"],"users":["50+"]}', 'TS-H1277AFX', '仮想化環境に最適な高性能NAS'),
('小規模・低予算', 60, '{"users":["1-10"],"budget":["~100"]}', 'TS-233', '小規模オフィス向け、コストパフォーマンス重視'),
('中小企業向け', 50, '{"users":["11-25"]}', 'TS-433eU', '中小企業の標準構成に最適'),
('中堅企業向け', 40, '{"users":["26-100"]}', 'TS-h765eU', '中堅企業向け、拡張性と信頼性のバランス'),
('デフォルト推奨', 1, '{}', 'TS-433eU', '一般的な中小企業向けバランス型モデル');

-- ============================================================================
-- エンド・オブ・スキーマ
-- ============================================================================
