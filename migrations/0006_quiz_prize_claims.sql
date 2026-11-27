CREATE TABLE prize_claims_new (
  id TEXT PRIMARY KEY,
  game TEXT NOT NULL CHECK (game IN ('bingo', 'photo-hunt', 'quiz')),
  guest_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (game, id)
);
INSERT INTO prize_claims_new (id, game, guest_name, created_at)
  SELECT id, game, guest_name, created_at FROM prize_claims;
DROP TABLE prize_claims;
ALTER TABLE prize_claims_new RENAME TO prize_claims;
CREATE INDEX prize_claims_created_at ON prize_claims(created_at DESC);
