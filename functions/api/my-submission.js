import {
  hashAccessToken,
  isValidAccessToken,
  json,
  normalizeText
} from '../_lib/submission-utils.js';

const publicSubmission = (row) => ({
  receiptId: row.receipt_id,
  createdAt: row.created_at,
  status: row.status,
  title: row.title,
  artist: row.artist,
  playerTitle: row.player_title,
  notes: row.notes,
  musicUrl: row.music_url,
  midiUrl: row.midi_url,
  jacketUrl: row.jacket_url
});

export const onRequestPost = async ({ request, env }) => {
  if (!env.DB) {
    return json({ ok: false, message: '応募情報の保存先が設定されていません。' }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: '確認情報を読み取れませんでした。' }, 400);
  }

  const receiptId = normalizeText(payload?.receiptId, 40);
  const accessToken = normalizeText(payload?.accessToken, 64);
  if (!receiptId || !isValidAccessToken(accessToken)) {
    return json({ ok: false, message: '確認情報が正しくありません。' }, 400);
  }

  const accessTokenHash = await hashAccessToken(accessToken);
  const row = await env.DB.prepare(`
    SELECT
      receipt_id, created_at, status, title, artist, player_title, notes,
      music_url, midi_url, jacket_url
    FROM music_submissions
    WHERE receipt_id = ?1 AND access_token_hash = ?2
  `).bind(receiptId, accessTokenHash).first();

  if (!row) {
    return json({ ok: false, message: '応募情報を確認できませんでした。' }, 404);
  }

  return json({ ok: true, submission: publicSubmission(row) });
};
