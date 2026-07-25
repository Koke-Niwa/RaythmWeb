import { json, normalizeText, requireAdmin } from '../../_lib/submission-utils.js';

export const onRequestGet = async ({ request, env }) => {
  if (!requireAdmin(request, env)) return json({ ok: false, message: '管理者認証が必要です。' }, 401);

  const url = new URL(request.url);
  const view = normalizeText(url.searchParams.get('view'), 30);
  const statements = {
    'confirmed-first': `
      SELECT * FROM music_submissions
      ORDER BY CASE WHEN checked_at IS NOT NULL THEN 0 ELSE 1 END, created_at DESC
      LIMIT 200
    `,
    'unconfirmed-only': `
      SELECT * FROM music_submissions
      WHERE checked_at IS NULL
      ORDER BY created_at DESC
      LIMIT 200
    `,
    'confirmed-only': `
      SELECT * FROM music_submissions
      WHERE checked_at IS NOT NULL
      ORDER BY checked_at DESC
      LIMIT 200
    `
  };
  const statement = env.DB.prepare(statements[view] || `
    SELECT * FROM music_submissions
    ORDER BY CASE WHEN checked_at IS NULL THEN 0 ELSE 1 END, created_at DESC
    LIMIT 200
  `);
  const { results } = await statement.all();

  return json({
    ok: true,
    submissions: results.map((row) => ({
      ...row,
      accounts: JSON.parse(row.accounts_json || '[]'),
      accounts_json: undefined
    }))
  });
};
