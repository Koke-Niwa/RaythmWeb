(() => {
  const form = document.querySelector('[data-confirm-form]');
  const dialog = document.querySelector('.entry-confirm-dialog');
  const confirmView = dialog?.querySelector('[data-confirm-view]');
  const successView = dialog?.querySelector('[data-success-view]');
  const confirmButton = dialog?.querySelector('[data-confirm-submit]');
  if (!form || !dialog || !confirmView || !successView || !confirmButton) return;

  const isLocal = ['127.0.0.1', 'localhost'].includes(location.hostname);
  const configuredSiteKey = document.querySelector('meta[name="turnstile-site-key"]')?.content?.trim();
  const turnstileSiteKey = configuredSiteKey || (isLocal ? '1x00000000000000000000AA' : '');
  let clientRequestId = crypto.randomUUID();
  const createAccessToken = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...bytes))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/g, '');
  };
  let accessToken = createAccessToken();
  let sending = false;

  form.dataset.liveSubmission = 'true';

  const savedEntryLink = document.createElement('p');
  savedEntryLink.className = 'submission-saved-link';
  savedEntryLink.innerHTML = '<a href="my-submissions.html">この端末に保存された応募内容を確認する</a>';
  form.before(savedEntryLink);

  const firstAssetField = form.querySelector('.download-link-field');
  const notesField = document.createElement('div');
  notesField.className = 'field';
  notesField.innerHTML = `
    <label for="music-notes">補足事項 <span class="optional-label">任意・1000文字まで</span></label>
    <textarea id="music-notes" rows="5" maxlength="1000" placeholder="制作メンバー、権利関係、楽曲について伝えておきたいことなど"></textarea>
  `;
  firstAssetField?.before(notesField);

  const status = document.createElement('p');
  status.className = 'submission-send-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  form.querySelector('.call-submit')?.before(status);

  const confirmStatus = document.createElement('p');
  confirmStatus.className = 'submission-confirm-status';
  confirmStatus.setAttribute('role', 'alert');
  confirmButton.parentElement?.before(confirmStatus);

  const receipt = document.createElement('div');
  receipt.className = 'submission-receipt';
  receipt.innerHTML = '<span>応募ID</span><strong data-receipt-id></strong><small>この番号を入力する必要はありません。確認情報はこのブラウザに保存されます。</small>';
  successView.querySelector('[data-success-close]')?.before(receipt);

  const successActions = document.createElement('div');
  successActions.className = 'submission-success-actions';
  successActions.innerHTML = `
    <a class="button" href="my-submissions.html">応募内容を確認する</a>
    <button class="submission-copy-link" type="button">確認リンクをコピー</button>
  `;
  receipt.after(successActions);

  if (!dialog.querySelector('[data-summary="notes"]')) {
    const notesSummary = document.createElement('div');
    notesSummary.innerHTML = '<dt>補足事項</dt><dd data-summary="notes"></dd>';
    dialog.querySelector('[data-summary="vocalSynth"]')?.closest('div')?.after(notesSummary);
  }

  const turnstileArea = document.createElement('div');
  turnstileArea.className = 'submission-turnstile';
  const authorship = form.querySelector('.authorship-check');
  authorship?.before(turnstileArea);

  if (turnstileSiteKey) {
    turnstileArea.innerHTML = `<div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-theme="dark" data-language="ja"></div>`;
    const turnstileScript = document.createElement('script');
    turnstileScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    turnstileScript.async = true;
    turnstileScript.defer = true;
    document.head.append(turnstileScript);
  } else {
    turnstileArea.textContent = '送信者確認の設定が完了していないため、現在は応募できません。';
    form.querySelector('.call-submit')?.setAttribute('disabled', '');
  }

  const setSending = (next) => {
    sending = next;
    confirmButton.disabled = next;
    confirmButton.classList.toggle('is-sending', next);
    confirmButton.innerHTML = next
      ? '送信しています…'
      : '応募する <span aria-hidden="true">↗</span>';
  };

  const buildPayload = () => {
    const payload = new FormData();
    payload.set('clientRequestId', clientRequestId);
    payload.set('accessToken', accessToken);
    payload.set('title', form.querySelector('#music-title')?.value || '');
    payload.set('artist', form.querySelector('#music-artist')?.value || '');
    payload.set('email', form.querySelector('#music-email')?.value || '');
    form.querySelectorAll('.account-input').forEach((input) => {
      if (input.value.trim()) payload.append('accounts', input.value.trim());
    });
    payload.set('vocalSynth', form.querySelector('#music-vocal-synth')?.value || '');
    payload.set('playerTitle', form.querySelector('#music-player-title')?.value || '');
    payload.set('notes', form.querySelector('#music-notes')?.value || '');
    payload.set('authorshipAccepted', form.querySelector('#music-authorship')?.checked ? 'yes' : 'no');
    payload.set('musicUrl', form.querySelector('#music-url')?.value || '');
    payload.set('midiUrl', form.querySelector('#midi-url')?.value || '');
    payload.set('jacketUrl', form.querySelector('#jacket-url')?.value || '');
    const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value || '';
    if (turnstileToken) payload.set('cf-turnstile-response', turnstileToken);
    return payload;
  };

  confirmButton.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (sending) return;

    confirmStatus.textContent = '';
    setSending(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: buildPayload(),
        headers: { Accept: 'application/json' }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        const fieldMessage = result.fieldErrors ? Object.values(result.fieldErrors)[0] : '';
        throw new Error(fieldMessage || result.message || '応募を送信できませんでした。');
      }

      const savedSubmission = {
        receiptId: result.receiptId,
        accessToken,
        title: form.querySelector('#music-title')?.value || '',
        artist: form.querySelector('#music-artist')?.value || '',
        createdAt: new Date().toISOString()
      };
      let storageSaved = true;
      try {
        const current = JSON.parse(localStorage.getItem('raythmSubmissionAccess') || '[]');
        const next = Array.isArray(current)
          ? [savedSubmission, ...current.filter((item) => item?.receiptId !== result.receiptId)].slice(0, 10)
          : [savedSubmission];
        localStorage.setItem('raythmSubmissionAccess', JSON.stringify(next));
      } catch {
        storageSaved = false;
      }

      const confirmationUrl = new URL('my-submissions.html', location.href);
      confirmationUrl.hash = new URLSearchParams({
        receipt: result.receiptId,
        token: accessToken
      }).toString();
      successActions.querySelector('.submission-copy-link').onclick = async () => {
        const copyButton = successActions.querySelector('.submission-copy-link');
        try {
          await navigator.clipboard.writeText(confirmationUrl.href);
          copyButton.textContent = 'コピーしました';
        } catch {
          copyButton.textContent = 'コピーできませんでした';
        }
      };

      successView.querySelector('[data-receipt-id]').textContent = result.receiptId;
      if (!storageSaved) {
        receipt.querySelector('small').textContent = 'このブラウザに確認情報を保存できませんでした。下の確認リンクをコピーしてください。';
      }
      confirmView.hidden = true;
      successView.hidden = false;
      dialog.setAttribute('aria-labelledby', 'entry-success-title');
      form.reset();
      clientRequestId = crypto.randomUUID();
      accessToken = createAccessToken();
      status.textContent = '';
      if (window.turnstile) window.turnstile.reset();
    } catch (error) {
      confirmStatus.textContent = error instanceof Error ? error.message : '応募を送信できませんでした。';
    } finally {
      setSending(false);
    }
  }, { capture: true });

  form.addEventListener('submit', () => {
    status.textContent = '入力内容を確認しています。';
    confirmStatus.textContent = '';
  }, { capture: true });
})();
