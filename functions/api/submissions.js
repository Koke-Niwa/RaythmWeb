import {
  createReceiptId,
  hashAccessToken,
  isValidEmail,
  isValidAccessToken,
  isValidUuid,
  json,
  normalizeEmail,
  normalizeText,
  validateSharedUrl,
  verifyTurnstile
} from '../_lib/submission-utils.js';

const TERMS_VERSION = '2026-07-25';

export const onRequestPost = async ({ request, env }) => {
  if (!env.DB) {
    return json({ ok: false, message: '応募受付の保存先が設定されていません。' }, 503);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, message: '送信内容を読み取れませんでした。' }, 400);
  }

  const clientRequestId = normalizeText(form.get('clientRequestId'), 64);
  const accessToken = normalizeText(form.get('accessToken'), 64);
  const title = normalizeText(form.get('title'), 120);
  const artist = normalizeText(form.get('artist'), 120);
  const email = normalizeEmail(form.get('email'));
  const accounts = form.getAll('accounts').map((value) => normalizeText(value, 500)).filter(Boolean).slice(0, 3);
  const vocalSynth = normalizeText(form.get('vocalSynth'), 300);
  const playerTitle = normalizeText(form.get('playerTitle'), 80);
  const notes = normalizeText(form.get('notes'), 1000);
  const authorshipAccepted = form.get('authorshipAccepted') === 'yes';
  const turnstileToken = normalizeText(form.get('cf-turnstile-response'), 2048);
  const musicUrl = normalizeText(form.get('musicUrl'), 2048);
  const midiUrl = normalizeText(form.get('midiUrl'), 2048);
  const jacketUrl = normalizeText(form.get('jacketUrl'), 2048);

  const fieldErrors = {};
  if (!isValidUuid(clientRequestId)) fieldErrors.form = '送信情報を更新して、もう一度お試しください。';
  if (!isValidAccessToken(accessToken)) fieldErrors.form = '確認情報を更新して、もう一度お試しください。';
  if (!title) fieldErrors.title = '楽曲タイトルを入力してください。';
  if (!artist) fieldErrors.artist = 'アーティスト名を入力してください。';
  if (!isValidEmail(email)) fieldErrors.email = '有効なメールアドレスを入力してください。';
  if (!authorshipAccepted) fieldErrors.authorshipAccepted = '応募規約への同意が必要です。';

  const musicUrlError = validateSharedUrl(musicUrl, 'MP3音源');
  const midiUrlError = validateSharedUrl(midiUrl, 'MIDIファイル');
  const jacketUrlError = validateSharedUrl(jacketUrl, 'ジャケット画像', false);
  if (musicUrlError) fieldErrors.musicUrl = musicUrlError;
  if (midiUrlError) fieldErrors.midiUrl = midiUrlError;
  if (jacketUrlError) fieldErrors.jacketUrl = jacketUrlError;

  if (Object.keys(fieldErrors).length) {
    return json({ ok: false, message: '入力内容を確認してください。', fieldErrors }, 422);
  }

  const turnstileValid = await verifyTurnstile({
    token: turnstileToken,
    secret: env.TURNSTILE_SECRET_KEY,
    ip: request.headers.get('CF-Connecting-IP'),
    localDev: env.LOCAL_DEV === 'true'
  });
  if (!turnstileValid) {
    return json({ ok: false, message: '送信者確認に失敗しました。ページを再読み込みしてお試しください。' }, 403);
  }

  const accessTokenHash = await hashAccessToken(accessToken);
  const existing = await env.DB.prepare(
    'SELECT receipt_id, access_token_hash FROM music_submissions WHERE client_request_id = ?1'
  ).bind(clientRequestId).first();
  if (existing) {
    if (existing.access_token_hash !== accessTokenHash) {
      return json({ ok: false, message: '確認情報が一致しません。ページを再読み込みして、もう一度お試しください。' }, 409);
    }
    return json({ ok: true, receiptId: existing.receipt_id, duplicate: true });
  }

  const receiptId = createReceiptId();

  try {
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO music_submissions (
        receipt_id, client_request_id, created_at, updated_at, status,
        title, artist, email, accounts_json, vocal_synth, player_title, notes,
        music_key, music_filename, music_size, music_type,
        midi_key, midi_filename, midi_size, midi_type,
        jacket_key, jacket_filename, jacket_size, jacket_type,
        music_url, midi_url, jacket_url,
        authorship_accepted, terms_version, access_token_hash
      ) VALUES (
        ?1, ?2, ?3, ?3, 'received',
        ?4, ?5, ?6, ?7, ?8, ?9, ?10,
        '', '共有リンク', 0, NULL,
        '', '共有リンク', 0, NULL,
        NULL, NULL, NULL, NULL,
        ?11, ?12, ?13,
        1, ?14, ?15
      )
    `).bind(
      receiptId,
      clientRequestId,
      now,
      title,
      artist,
      email,
      JSON.stringify(accounts),
      vocalSynth || null,
      playerTitle || null,
      notes || null,
      musicUrl,
      midiUrl,
      jacketUrl || null,
      TERMS_VERSION,
      accessTokenHash
    ).run();
  } catch (error) {
    console.error('Submission save failed', error);
    return json({ ok: false, message: '応募を保存できませんでした。時間をおいてもう一度お試しください。' }, 500);
  }

  return json({ ok: true, receiptId }, 201);
};
