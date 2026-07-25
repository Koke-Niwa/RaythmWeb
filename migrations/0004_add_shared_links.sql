ALTER TABLE music_submissions
  ADD COLUMN music_url TEXT;

ALTER TABLE music_submissions
  ADD COLUMN midi_url TEXT;

ALTER TABLE music_submissions
  ADD COLUMN jacket_url TEXT;

ALTER TABLE music_submissions
  ADD COLUMN checked_at TEXT;

UPDATE music_submissions
SET checked_at = files_deleted_at
WHERE files_deleted_at IS NOT NULL;
