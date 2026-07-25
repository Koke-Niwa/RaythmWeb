ALTER TABLE music_submissions
  ADD COLUMN access_token_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS music_submissions_access_token_hash_idx
  ON music_submissions(access_token_hash)
  WHERE access_token_hash IS NOT NULL;
