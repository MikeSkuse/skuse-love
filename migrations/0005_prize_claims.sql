CREATE TABLE IF NOT EXISTS prize_claims (
  id TEXT PRIMARY KEY,
  game TEXT NOT NULL CHECK (game IN ('bingo', 'photo-hunt')),
  guest_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (game, id)
);
CREATE INDEX IF NOT EXISTS prize_claims_created_at ON prize_claims(created_at DESC);
