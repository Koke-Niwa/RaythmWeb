import { json, normalizeText, requireAdmin } from '../../_lib/submission-utils.js';

export const onRequestPost = async ({ request, env }) => {
  if (!requireAdmin(request, env)) {
    return json({ ok: false, message: '管理者認証が必要です。' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: '対象を読み取れませんでした。' }, 400);
  }

  const receiptId = normalizeText(body?.receiptId, 40);
  const confirmed = body?.confirmed !== false;
  if (!receiptId) {
    return json({ ok: false, message: '応募IDが正しくありません。' }, 422);
  }

  const row = await env.DB.prepare(
    'SELECT receipt_id FROM music_submissions WHERE receipt_id = ?1'
  ).bind(receiptId).first();
  if (!row) {
    return json({ ok: false, message: '応募が見つかりません。' }, 404);
  }

  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE music_submissions
    SET checked_at = ?1, updated_at = ?2
    WHERE receipt_id = ?3
  `).bind(confirmed ? now : null, now, receiptId).run();

  return json({ ok: true, checkedAt: confirmed ? now : null });
};
