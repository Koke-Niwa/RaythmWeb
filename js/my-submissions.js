(() => {
  const storageKey = 'raythmSubmissionAccess';
  const list = document.querySelector('[data-submission-list]');
  if (!list) return;

  const readSaved = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  };

  const writeSaved = (entries) => {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  };

  const importFromHash = () => {
    const params = new URLSearchParams(location.hash.slice(1));
    const receiptId = params.get('receipt') || '';
    const accessToken = params.get('token') || '';
    if (!receiptId || !accessToken) return;

    const entries = readSaved();
    writeSaved([
      { receiptId, accessToken, createdAt: new Date().toISOString() },
      ...entries.filter((entry) => entry?.receiptId !== receiptId)
    ].slice(0, 10));
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  };

  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  const statusLabel = {
    received: '受付済み',
    reviewing: '確認中',
    accepted: '採用',
    rejected: '不採用'
  };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const safeUrl = (value) => {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  };

  const renderCard = (submission) => {
    const musicUrl = safeUrl(submission.musicUrl);
    const midiUrl = safeUrl(submission.midiUrl);
    const jacketUrl = safeUrl(submission.jacketUrl);
    const jacket = jacketUrl
      ? `<li><span>ジャケット</span><strong><a href="${escapeHtml(jacketUrl)}" target="_blank" rel="noopener noreferrer">共有リンクを開く</a></strong></li>`
      : '';
    return `
      <article class="saved-submission-card">
        <header>
          <div>
            <p class="saved-submission-id">${escapeHtml(submission.receiptId)}</p>
            <h2>${escapeHtml(submission.title)}</h2>
            <p>${escapeHtml(submission.artist)}</p>
          </div>
          <span class="saved-submission-status is-${escapeHtml(submission.status)}">${statusLabel[submission.status] || '受付済み'}</span>
        </header>
        <dl class="saved-submission-meta">
          <div><dt>応募日時</dt><dd>${formatDate(submission.createdAt)}</dd></div>
          <div><dt>希望する称号名</dt><dd>${escapeHtml(submission.playerTitle || '指定なし')}</dd></div>
          <div><dt>補足事項</dt><dd>${escapeHtml(submission.notes || 'なし')}</dd></div>
        </dl>
        <ul class="saved-submission-files">
          <li><span>MP3音源</span><strong>${musicUrl ? `<a href="${escapeHtml(musicUrl)}" target="_blank" rel="noopener noreferrer">共有リンクを開く</a>` : '—'}</strong></li>
          <li><span>MIDI</span><strong>${midiUrl ? `<a href="${escapeHtml(midiUrl)}" target="_blank" rel="noopener noreferrer">共有リンクを開く</a>` : '—'}</strong></li>
          ${jacket}
        </ul>
        <button class="saved-submission-remove" type="button" data-remove="${escapeHtml(submission.receiptId)}">この端末から確認情報を削除</button>
      </article>
    `;
  };

  const loadOne = async (entry) => {
    const response = await fetch('/api/my-submission', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiptId: entry.receiptId,
        accessToken: entry.accessToken
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || '応募情報を確認できませんでした。');
    return result.submission;
  };

  const render = async () => {
    importFromHash();
    const entries = readSaved();
    if (!entries.length) {
      list.innerHTML = `
        <div class="saved-submissions-empty">
          <h2>この端末に保存された応募はありません</h2>
          <p>応募完了後、このブラウザから内容を確認できるようになります。</p>
        </div>
      `;
      return;
    }

    const results = await Promise.allSettled(entries.map(loadOne));
    const cards = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => renderCard(result.value));
    const failed = results.length - cards.length;
    list.innerHTML = `${failed ? '<p class="saved-submissions-error">一部の応募情報を確認できませんでした。</p>' : ''}${cards.join('')}`;
  };

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    const receiptId = button.dataset.remove;
    if (!confirm('この端末から確認情報を削除しますか？ 応募データそのものは削除されません。')) return;
    writeSaved(readSaved().filter((entry) => entry?.receiptId !== receiptId));
    render();
  });

  render().catch(() => {
    list.innerHTML = '<p class="saved-submissions-error">応募情報を読み込めませんでした。時間をおいてもう一度お試しください。</p>';
  });
})();
