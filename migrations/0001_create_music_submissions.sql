CREATE TABLE IF NOT EXISTS music_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id TEXT NOT NULL UNIQUE,
  client_request_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'reviewing', 'accepted', 'rejected')),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  email TEXT NOT NULL,
  accounts_json TEXT NOT NULL DEFAULT '[]',
  vocal_synth TEXT,
  player_title TEXT,
  notes TEXT,
  music_key TEXT NOT NULL,
  music_filename TEXT NOT NULL,
  music_size INTEGER NOT NULL,
  music_type TEXT,
  midi_key TEXT NOT NULL,
  midi_filename TEXT NOT NULL,
  midi_size INTEGER NOT NULL,
  midi_type TEXT,
  jacket_key TEXT,
  jacket_filename TEXT,
  jacket_size INTEGER,
  jacket_type TEXT,
  authorship_accepted INTEGER NOT NULL DEFAULT 1,
  terms_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS music_submissions_created_at_idx
  ON music_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS music_submissions_status_idx
  ON music_submissions(status);

