-- MediFind SQLite Database Schema
-- Version: 1.0.0

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. PHARMACIES
CREATE TABLE IF NOT EXISTS pharmacies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    locality TEXT NOT NULL,
    city TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    phone TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    login_pin TEXT NOT NULL DEFAULT '1234',
    pin_hash TEXT NOT NULL DEFAULT '',
    is_24x7 INTEGER NOT NULL DEFAULT 0 CHECK(is_24x7 IN (0, 1)),
    opening_hours TEXT NOT NULL,
    accuracy REAL NOT NULL DEFAULT 0.90 CHECK(accuracy >= 0.0 AND accuracy <= 1.0),
    response_rate REAL NOT NULL DEFAULT 0.85 CHECK(response_rate >= 0.0 AND response_rate <= 1.0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. MEDICINES
CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    strength TEXT NOT NULL,
    form TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    mrp REAL NOT NULL,
    requires_prescription INTEGER NOT NULL DEFAULT 0 CHECK(requires_prescription IN (0, 1)),
    pack_size TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK(status IN ('in_stock', 'out_of_stock', 'low_stock')),
    price REAL NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 10 CHECK(stock_quantity >= 0),
    source TEXT NOT NULL CHECK(source IN ('ping', 'manual', 'csv', 'unverified')),
    confirmed_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(pharmacy_id, medicine_id)
);

-- 4. SEARCHES
CREATE TABLE IF NOT EXISTS searches (
    id TEXT PRIMARY KEY,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    radius_km REAL NOT NULL DEFAULT 5.0,
    results_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. PINGS
CREATE TABLE IF NOT EXISTS pings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT NOT NULL,
    search_id TEXT REFERENCES searches(id) ON DELETE SET NULL,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'yes', 'no', 'expired')),
    response_time_seconds INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    replied_at TEXT
);

-- 6. RESERVATIONS
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'requested', 'confirmed', 'accepted', 'rejected', 'dispensed', 'collected', 'cancelled', 'expired')),
    notes TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. REPORTS
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK(reason IN ('out_of_stock', 'price_mismatch', 'store_closed', 'other')),
    user_note TEXT,
    resolved INTEGER NOT NULL DEFAULT 0 CHECK(resolved IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- INDEXES FOR ULTRA-FAST LOOKUPS
CREATE INDEX IF NOT EXISTS idx_pharmacies_lat_lng ON pharmacies(lat, lng);
CREATE INDEX IF NOT EXISTS idx_medicines_brand ON medicines(brand_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON inventory(medicine_id, pharmacy_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_confirmed_at ON inventory(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_pings_batch_id ON pings(batch_id);
CREATE INDEX IF NOT EXISTS idx_pings_pharmacy_status ON pings(pharmacy_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_token ON reservations(token);
CREATE INDEX IF NOT EXISTS idx_reservations_pharmacy_status ON reservations(pharmacy_id, status);
CREATE INDEX IF NOT EXISTS idx_searches_medicine_created ON searches(medicine_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_pharmacy_medicine ON reports(pharmacy_id, medicine_id);

-- 8. UNMET DEMAND VIEW
-- Aggregates customer searches, ping refusals ('no'), and wrong-stock reports where availability failed
CREATE VIEW IF NOT EXISTS view_unmet_demand AS
SELECT 
    m.id AS medicine_id,
    (m.brand_name || ' ' || m.strength) AS medicine_name,
    m.generic_name,
    m.strength,
    m.form,
    COUNT(DISTINCT s.id) AS search_count,
    (COUNT(DISTINCT CASE WHEN p.status = 'no' THEN p.id END) + COUNT(DISTINCT r.id)) AS unfulfilled,
    MAX(s.created_at) AS last_searched_at
FROM medicines m
LEFT JOIN searches s ON s.medicine_id = m.id
LEFT JOIN pings p ON p.medicine_id = m.id
LEFT JOIN reports r ON r.medicine_id = m.id AND r.reason = 'out_of_stock'
GROUP BY m.id, m.brand_name, m.strength, m.generic_name, m.form;
