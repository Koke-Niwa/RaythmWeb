(() => {
  const login = document.querySelector('[data-admin-login]');
  const content = document.querySelector('[data-admin-content]');
  const tokenInput = document.querySelector('[data-admin-token]');
  const connectButton = document.querySelector('[data-admin-connect]');
  const refreshButton = document.querySelector('[data-admin-refresh]');
  const filter = document.querySelector('[data-admin-filter]');
  const list = document.querySelector('[data-admin-list]');
  const message = document.querySelector('[data-admin-message]');
  const summary = document.querySelector('[data-admin-summary]');
  if (!login || !content || !tokenInput || !connectButton || !refreshButton || !filter || !list || !message || !summary) return;

  let adminToken = sessionStorage.getItem('raythmAdminToken') || '';
  tokenInput.value = adminToken;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

  const safeExternalUrl = (value) => {
    try {
      const url = new URL(String(value));
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };

  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${adminToken}`,
        ...(options.headers || {})
      }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || '処理に失敗しました。');
    return result;
  };

  const render = (submissions) => {
    summary.textContent = `${submissions.length}件の応募`;
    if (!submissions.length) {
      list.innerHTML = '<p class="admin-empty">該当する応募はありません。</p>';
      return;
    }

    list.innerHTML = submissions.map((entry) => {
      const checked = Boolean(entry.checked_at);
      const musicUrl = safeExternalUrl(entry.music_url);
      const midiUrl = safeExternalUrl(entry.midi_url);
      const jacketUrl = safeExternalUrl(entry.jacket_url);
      return `
      <article class="admin-card ${checked ? 'is-confirmed' : 'is-unconfirmed'}" data-receipt="${escapeHtml(entry.receipt_id)}">
        <div class="admin-card-head">
          <div>
            <h2>${escapeHtml(entry.title)}</h2>
            <p class="admin-card-meta">${escapeHtml(entry.artist)} ・ ${escapeHtml(entry.receipt_id)}</p>
          </div>
          <span class="admin-confirmation-badge">${checked ? '確認済み' : '未確認'}</span>
        </div>
        <dl class="admin-card-details">
          <div><dt>受付日時</dt><dd>${escapeHtml(new Date(entry.created_at).toLocaleString('ja-JP'))}</dd></div>
          <div><dt>メール</dt><dd><a href="mailto:${escapeHtml(entry.email)}">${escapeHtml(entry.email)}</a></dd></div>
          <div><dt>活動アカウント</dt><dd>${entry.accounts?.length ? entry.accounts.map((account) => {
            const href = safeExternalUrl(account);
            return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(account)}</a>` : escapeHtml(account);
          }).join('<br>') : '—'}</dd></div>
          <div><dt>歌声合成ソフト</dt><dd>${escapeHtml(entry.vocal_synth || '—')}</dd></div>
          <div><dt>希望称号</dt><dd>${escapeHtml(entry.player_title || '—')}</dd></div>
          <div><dt>補足事項</dt><dd>${escapeHtml(entry.notes || '—')}</dd></div>
          <div><dt>MP3共有リンク</dt><dd>${musicUrl ? `<a href="${escapeHtml(musicUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(musicUrl)}</a>` : '—'}</dd></div>
          <div><dt>MIDI共有リンク</dt><dd>${midiUrl ? `<a href="${escapeHtml(midiUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(midiUrl)}</a>` : '—'}</dd></div>
          <div><dt>ジャケット共有リンク</dt><dd>${jacketUrl ? `<a href="${escapeHtml(jacketUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(jacketUrl)}</a>` : '—'}</dd></div>
        </dl>
        <div class="admin-card-actions">
          ${musicUrl ? `<a class="admin-external-link" href="${escapeHtml(musicUrl)}" target="_blank" rel="noopener noreferrer">MP3リンクを開く</a>` : ''}
          ${midiUrl ? `<a class="admin-external-link" href="${escapeHtml(midiUrl)}" target="_blank" rel="noopener noreferrer">MIDIリンクを開く</a>` : ''}
          ${jacketUrl ? `<a class="admin-external-link" href="${escapeHtml(jacketUrl)}" target="_blank" rel="noopener noreferrer">ジャケットリンクを開く</a>` : ''}
          <button class="admin-mark-confirmed" type="button" data-confirmed="${checked ? 'false' : 'true'}">${checked ? '未確認に戻す' : '確認済みにする'}</button>
          ${checked ? `<p class="admin-confirmed-note">確認日時：${escapeHtml(new Date(entry.checked_at).toLocaleString('ja-JP'))}</p>` : ''}
        </div>
      </article>
    `;
    }).join('');
  };

  const loadSubmissions = async () => {
    message.textContent = '';
    message.classList.remove('is-success');
    refreshButton.disabled = true;
    try {
      const query = filter.value ? `?view=${encodeURIComponent(filter.value)}` : '';
      const result = await request(`/api/admin/submissions${query}`);
      render(result.submissions);
      login.hidden = true;
      content.hidden = false;
    } catch (error) {
      message.textContent = error.message;
      if (content.hidden) {
        login.hidden = false;
        content.hidden = true;
        tokenInput.focus();
      }
    } finally {
      refreshButton.disabled = false;
    }
  };

  connectButton.addEventListener('click', () => {
    adminToken = tokenInput.value.trim();
    sessionStorage.setItem('raythmAdminToken', adminToken);
    loadSubmissions();
  });
  tokenInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') connectButton.click();
  });
  refreshButton.addEventListener('click', loadSubmissions);
  filter.addEventListener('change', loadSubmissions);

  list.addEventListener('click', async (event) => {
    const confirmationButton = event.target.closest('[data-confirmed]');
    if (!confirmationButton) return;
    const card = confirmationButton.closest('[data-receipt]');
    const nextConfirmed = confirmationButton.dataset.confirmed === 'true';

    message.textContent = '';
    confirmationButton.disabled = true;
    confirmationButton.textContent = '更新しています…';
    try {
      await request('/api/admin/confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: card.dataset.receipt, confirmed: nextConfirmed })
      });
      await loadSubmissions();
      message.classList.add('is-success');
      message.textContent = nextConfirmed ? '確認済みにしました。' : '未確認に戻しました。';
    } catch (error) {
      message.classList.remove('is-success');
      message.textContent = error.message;
      confirmationButton.disabled = false;
      confirmationButton.textContent = nextConfirmed ? '確認済みにする' : '未確認に戻す';
    }
  });

  if (adminToken) loadSubmissions();
})();
