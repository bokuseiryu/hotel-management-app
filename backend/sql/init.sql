-- ホテル運営データ管理システム データベース初期化スクリプト
-- Hotel Management System Database Initialization Script

-- ユーザーテーブルの作成
-- Users table creation
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 日報データテーブルの作成
-- Daily report data table creation
CREATE TABLE IF NOT EXISTS daily_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hotel_name TEXT NOT NULL,
    date TEXT NOT NULL,
    -- 月末までの回収予定額 (Projected revenue by end of month)
    projected_revenue REAL NOT NULL DEFAULT 0,
    -- 稼働率 OCC (Occupancy Rate OCC)
    occupancy_rate_occ REAL NOT NULL DEFAULT 0,
    -- 当月累計販売数 (Cumulative sales for the current month)
    cumulative_sales INTEGER NOT NULL DEFAULT 0,
    -- 平均単価 ADR (Average Daily Rate ADR)
    average_daily_rate_adr REAL NOT NULL DEFAULT 0,
    -- 月売上目標 (Monthly Sales Target)
    monthly_sales_target REAL NOT NULL DEFAULT 0,
    -- 達成率 (Achievement Rate) - 計算式を更新
    achievement_rate REAL GENERATED ALWAYS AS (CASE WHEN monthly_sales_target > 0 THEN (projected_revenue / monthly_sales_target) * 100 ELSE 0 END) STORED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_name, date)
);

-- 初期ユーザーデータは initDatabase.js スクリプトによってハッシュ化されたパスワードで挿入されます。
-- Initial user data is inserted by the initDatabase.js script with hashed passwords.

-- サンプルデータの挿入（開発テスト用）
-- 2026年1月の実績データ (Actual Data for Jan 2026)
INSERT OR IGNORE INTO daily_reports (hotel_name, date, monthly_sales_target, projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr) VALUES
-- ホテル新今宮
('ホテル新今宮', '2026-01-02', 20000000, 10235793, 37.0, 2216, 4619),
('ホテル新今宮', '2026-01-03', 20000000, 10709874, 39.0, 2332, 4593),
('ホテル新今宮', '2026-01-04', 20000000, 11383115, 42.2, 2499, 4555),
('ホテル新今宮', '2026-01-05', 20000000, 11734169, 42.0, 2508, 4679),
('ホテル新今宮', '2026-01-06', 20000000, 11988946, 45.0, 2669, 4492),
('ホテル新今宮', '2026-01-07', 20000000, 11996714, 45.0, 2694, 4453),
('ホテル新今宮', '2026-01-08', 20000000, 12173445, 46.0, 2744, 4436),
('ホテル新今宮', '2026-01-09', 20000000, 12225506, 47.0, 2779, 4399),
('ホテル新今宮', '2026-01-10', 20000000, 12481646, 48.0, 2848, 4383),
('ホテル新今宮', '2026-01-11', 20000000, 12598382, 49.0, 2899, 4346),
('ホテル新今宮', '2026-01-12', 20000000, 12820841, 50.0, 2957, 4336),
('ホテル新今宮', '2026-01-13', 20000000, 12914431, 50.0, 2990, 4319),
('ホテル新今宮', '2026-01-14', 20000000, 13209900, 51.0, 3035, 4353),

-- ホテル動物園前
('ホテル動物園前', '2026-01-02', 7680000, 2881667, 42.4, 473, 6092),
('ホテル動物園前', '2026-01-03', 7680000, 2960736, 43.6, 487, 6080),
('ホテル動物園前', '2026-01-04', 7680000, 3149547, 46.9, 523, 6022),
('ホテル動物園前', '2026-01-05', 7680000, 3217314, 47.6, 531, 6059),
('ホテル動物園前', '2026-01-06', 7680000, 3161063, 47.6, 531, 5953),
('ホテル動物園前', '2026-01-07', 7680000, 3478513, 52.6, 587, 5926),
('ホテル動物園前', '2026-01-08', 7680000, 3578224, 54.2, 605, 5914),
('ホテル動物園前', '2026-01-09', 7680000, 3584758, 54.7, 611, 5867),
('ホテル動物園前', '2026-01-10', 7680000, 3666106, 55.6, 621, 5904),
('ホテル動物園前', '2026-01-11', 7680000, 3710322, 56.1, 626, 5927),
('ホテル動物園前', '2026-01-12', 7680000, 3743525, 56.5, 631, 5933),
('ホテル動物園前', '2026-01-13', 7680000, 3964382, 60.2, 672, 5899);

-- 履歴データの挿入 (Historical Data Insertion)
-- ホテル新今宮 (2024)
INSERT OR IGNORE INTO daily_reports (hotel_name, date, monthly_sales_target, projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr) VALUES
('ホテル新今宮', '2024-01-31', 17000000, 20330362, 81.0, 4786, 4248),
('ホテル新今宮', '2024-02-29', 17000000, 20179218, 86.0, 4594, 4393),
('ホテル新今宮', '2024-03-31', 19500000, 22547708, 91.4, 5442, 4143),
('ホテル新今宮', '2024-04-30', 20400000, 22167683, 90.8, 5230, 4239),
('ホテル新今宮', '2024-05-31', 19500000, 21465597, 90.8, 5230, 4009),
('ホテル新今宮', '2024-06-30', 18000000, 18293436, 89.8, 5174, 3536),
('ホテル新今宮', '2024-07-31', 18000000, 19546080, 85.4, 4919, 3974),
('ホテル新今宮', '2024-08-31', 20500000, 20509746, 78.9, 4695, 4368),
('ホテル新今宮', '2024-09-30', 19000000, 21501143, 88.2, 5079, 4233),
('ホテル新今宮', '2024-10-31', 21000000, 24875369, 92.2, 5487, 4534),
('ホテル新今宮', '2024-11-30', 21000000, 26135211, 91.1, 5420, 4822),
('ホテル新今宮', '2024-12-31', 22500000, 25073299, 87.4, 5176, 4844);

-- ホテル新今宮 (2025)
INSERT OR IGNORE INTO daily_reports (hotel_name, date, monthly_sales_target, projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr) VALUES
('ホテル新今宮', '2025-01-31', 17000000, 20330362, 81.0, 4786, 4248),
('ホテル新今宮', '2025-02-28', 17000000, 20179218, 86.0, 4594, 4393),
('ホテル新今宮', '2025-03-31', 23500000, 26234727, 94.2, 5608, 4678),
('ホテル新今宮', '2025-04-30', 24500000, 36677704, 95.4, 5497, 6672),
('ホテル新今宮', '2025-05-31', 23000000, 34580285, 97.4, 5610, 6164),
('ホテル新今宮', '2025-06-30', 20000000, 26894548, 91.1, 5248, 5125),
('ホテル新今宮', '2025-07-31', 22000000, 26096093, 90.8, 5406, 4827),
('ホテル新今宮', '2025-08-31', 23000000, 29793552, 88.6, 5276, 5647),
('ホテル新今宮', '2025-09-30', 19000000, 34783625, 94.5, 5442, 6392),
('ホテル新今宮', '2025-10-31', 25800000, 31226033, 88.8, 5283, 5911),
('ホテル新今宮', '2025-11-30', 27000000, 24988515, 73.1, 4350, 5744),
('ホテル新今宮', '2025-12-31', 24100000, 20182418, 87.4, 5176, 5278);

-- ホテル動物園前 (2024)
INSERT OR IGNORE INTO daily_reports (hotel_name, date, monthly_sales_target, projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr) VALUES
('ホテル動物園前', '2024-03-31', 7300000, 7696531, 82.1, 916, 8402),
('ホテル動物園前', '2024-04-30', 7200000, 8139408, 88.0, 950, 8567),
('ホテル動物園前', '2024-05-31', 6500000, 6649740, 71.3, 796, 8354),
('ホテル動物園前', '2024-06-30', 6000000, 5231859, 80.1, 865, 6048),
('ホテル動物園前', '2024-07-31', 7000000, 7042460, 96.3, 1075, 6477),
('ホテル動物園前', '2024-08-31', 7200000, 7330640, 94.6, 1056, 6942),
('ホテル動物園前', '2024-10-31', 7000000, 8021733, 98.1, 1095, 7326),
('ホテル動物園前', '2024-11-30', 7100000, 8350603, 97.9, 1057, 7900),
('ホテル動物園前', '2024-12-31', 7000000, 8477529, 90.1, 1006, 8427);

-- ホテル動物園前 (2025)
INSERT OR IGNORE INTO daily_reports (hotel_name, date, monthly_sales_target, projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr) VALUES
('ホテル動物園前', '2025-01-31', 6500000, 7323715, 89.7, 1001, 7316),
('ホテル動物園前', '2025-03-31', 7000000, 7647534, 91.1, 1017, 7519),
('ホテル動物園前', '2025-04-30', 7500000, 9934419, 98.6, 1065, 9328),
('ホテル動物園前', '2025-05-31', 7800000, 10884895, 96.7, 1079, 10088),
('ホテル動物園前', '2025-06-30', 7000000, 7831403, 83.9, 906, 8644);

-- インデックスの作成
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_reports_hotel_date ON daily_reports(hotel_name, date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- トリガーの作成（更新時刻の自動更新）
-- Create trigger for auto-updating updated_at
CREATE TRIGGER IF NOT EXISTS update_daily_reports_timestamp 
    AFTER UPDATE ON daily_reports
    FOR EACH ROW
BEGIN
    UPDATE daily_reports 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
