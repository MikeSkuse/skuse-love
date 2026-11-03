CREATE TABLE IF NOT EXISTS tables (id TEXT PRIMARY KEY, theme TEXT NOT NULL, display_number TEXT);
CREATE TABLE IF NOT EXISTS guests (id TEXT PRIMARY KEY, name TEXT NOT NULL, table_id TEXT REFERENCES tables(id), token_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, object_key TEXT NOT NULL, mime TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
INSERT OR IGNORE INTO tables (id,theme) VALUES ('theme_1','Radiator Springs'),('theme_2','Pride Rock'),('theme_3','Pizza Planet'),('theme_4','Monstropolis'),('theme_5','Agrabah'),('theme_6','Notre Dame');
