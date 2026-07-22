const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

if (navigation && !navigation.querySelector('a[href="news.html"]')) {
  const homeLink = navigation.querySelector('a[href="index.html"]');
  const newsLink = document.createElement('a');
  newsLink.href = 'news.html';
  newsLink.textContent = 'お知らせ';
  if ((location.pathname.split('/').pop() || 'index.html') === 'news.html') newsLink.setAttribute('aria-current', 'page');
  homeLink?.insertAdjacentElement('afterend', newsLink);
}

const musicCallsMenu = document.querySelector('#music-calls-menu');
if (musicCallsMenu) {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const musicCalls = [
    { href: 'submission-1.html', label: '第1回楽曲公募' },
    { href: 'submission.html', label: '第2回楽曲公募' }
  ];
  musicCallsMenu.replaceChildren(...musicCalls.map(({ href, label }) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    if (currentPage === href) link.setAttribute('aria-current', 'page');
    return link;
  }));
}

const musicCallNumber = document.body.dataset.musicCall;
const entryTermsIntro = document.querySelector('.entry-terms-intro');
if (musicCallNumber && entryTermsIntro) {
  entryTermsIntro.textContent = `本規約は、raythmが実施する「raythm 第${musicCallNumber}回楽曲公募」への応募に適用されます。応募フォームを送信した時点で、本規約に同意したものとみなします。`;
}

if (navigation) {
  const playGuideLink = navigation.querySelector('a[href="how-to-play.html"]');
  if (playGuideLink) {
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    const playGuides = [
      { href: 'how-to-play.html', label: '基本' },
      { href: 'multiplayer.html', label: 'マルチプレイ' },
      { href: 'studio.html', label: 'スタジオ' },
      { href: 'notes.html', label: 'ノーツの種類' }
    ];
    const playSection = document.createElement('div');
    playSection.className = 'nav-section';
    const playToggle = document.createElement('button');
    playToggle.className = 'nav-section-toggle';
    playToggle.type = 'button';
    playToggle.setAttribute('aria-expanded', 'false');
    playToggle.setAttribute('aria-controls', 'play-guides-menu');
    playToggle.innerHTML = '<span>遊び方</span><span class="nav-section-icon" aria-hidden="true"></span>';
    const playMenu = document.createElement('div');
    playMenu.className = 'nav-submenu';
    playMenu.id = 'play-guides-menu';
    playMenu.replaceChildren(...playGuides.map(({ href, label }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      if (currentPage === href) link.setAttribute('aria-current', 'page');
      return link;
    }));
    playSection.append(playToggle, playMenu);
    playGuideLink.replaceWith(playSection);
  }
}

if (menuButton && navigation) {
  const navBackdrop = document.createElement('button');
  navBackdrop.className = 'nav-backdrop';
  navBackdrop.type = 'button';
  navBackdrop.tabIndex = -1;
  navBackdrop.setAttribute('aria-label', 'メニューを閉じる');
  document.body.append(navBackdrop);
  document.body.append(navigation);

  const setNavigationOpen = (isOpen) => {
    navigation.classList.toggle('open', isOpen);
    navBackdrop.classList.toggle('open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    document.documentElement.classList.toggle('nav-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
    if (!isOpen) {
      navigation.querySelectorAll('.nav-section-toggle').forEach((button) => {
        button.setAttribute('aria-expanded', 'false');
        document.getElementById(button.getAttribute('aria-controls'))?.classList.remove('is-open');
      });
    }
  };

  menuButton.addEventListener('click', () => {
    setNavigationOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navBackdrop.addEventListener('click', () => setNavigationOpen(false));

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setNavigationOpen(false);
  });

  navigation.querySelectorAll('.nav-section-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const submenu = document.getElementById(button.getAttribute('aria-controls'));
      if (!submenu) return;
      const willOpen = button.getAttribute('aria-expanded') !== 'true';

      navigation.querySelectorAll('.nav-section-toggle').forEach((otherButton) => {
        if (otherButton === button) return;
        otherButton.setAttribute('aria-expanded', 'false');
        document.getElementById(otherButton.getAttribute('aria-controls'))?.classList.remove('is-open');
      });

      button.setAttribute('aria-expanded', String(willOpen));
      submenu.classList.toggle('is-open', willOpen);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setNavigationOpen(false);
      menuButton.focus();
    }
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const noteGuideItems = [...document.querySelectorAll('[data-note-item]')];
if (noteGuideItems.length) {
  noteGuideItems.forEach((item) => {
    const sprite = item.querySelector('.note-sprite');
    if (!sprite) return;

    [sprite.dataset.normalSrc, sprite.dataset.raySrc].forEach((source) => {
      if (!source) return;
      const preload = new Image();
      preload.src = source;
    });

    item.querySelectorAll('[data-note-variant]').forEach((button) => {
      button.addEventListener('click', () => {
        const variant = button.dataset.noteVariant;
        const nextSource = variant === 'ray' ? sprite.dataset.raySrc : sprite.dataset.normalSrc;
        if (!nextSource) return;

        sprite.src = nextSource;
        sprite.alt = `${variant === 'ray' ? 'Ray' : 'Normal'} ${sprite.dataset.altBase}`;
        item.classList.toggle('is-ray', variant === 'ray');
        item.querySelectorAll('[data-note-variant]').forEach((variantButton) => {
          const isActive = variantButton === button;
          variantButton.classList.toggle('is-active', isActive);
          variantButton.setAttribute('aria-pressed', String(isActive));
        });
      });
    });
  });

  const reduceNoteMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let noteScrollFrame = 0;
  const updateNoteScroll = () => {
    noteScrollFrame = 0;
    if (reduceNoteMotion.matches) return;
    const viewportHeight = window.innerHeight;
    noteGuideItems.forEach((item) => {
      const stage = item.querySelector('.note-lane-stage');
      const copy = item.querySelector('.note-guide-copy');
      if (!stage || !copy) return;
      const triggerElement = window.innerWidth <= 760 ? stage : copy;
      const triggerRect = triggerElement.getBoundingClientRect();
      const triggerCenter = triggerRect.top + triggerRect.height / 2;
      const centerDelta = viewportHeight / 2 - triggerCenter;
      const holdDistance = viewportHeight * .035;
      const travelDistance = viewportHeight * .35;
      let progress = .5;
      if (centerDelta < -holdDistance) {
        const phase = Math.min(1, Math.max(0, (centerDelta + travelDistance) / (travelDistance - holdDistance)));
        const easedPhase = phase * phase * (3 - 2 * phase);
        progress = easedPhase * .5;
      } else if (centerDelta > holdDistance) {
        const phase = Math.min(1, Math.max(0, (centerDelta - holdDistance) / (travelDistance - holdDistance)));
        const easedPhase = phase * phase * (3 - 2 * phase);
        progress = .5 + easedPhase * .5;
      }
      const travel = -190 + progress * 380;
      const opacity = Math.min(1, progress * 7, (1 - progress) * 12);
      stage.style.setProperty('--note-travel', `${travel.toFixed(1)}px`);
      stage.style.setProperty('--note-opacity', opacity.toFixed(3));
    });
  };
  const requestNoteScrollUpdate = () => {
    if (noteScrollFrame) return;
    noteScrollFrame = requestAnimationFrame(updateNoteScroll);
  };
  updateNoteScroll();
  window.addEventListener('scroll', requestNoteScrollUpdate, { passive: true });
  window.addEventListener('resize', requestNoteScrollUpdate, { passive: true });
  reduceNoteMotion.addEventListener?.('change', requestNoteScrollUpdate);
}

const studioScreen = document.querySelector('[data-studio-screen]');
const studioDetail = document.querySelector('[data-studio-detail]');
if (studioScreen && studioDetail) {
  const studioHotspots = [...studioScreen.querySelectorAll('.studio-hotspot')];
  const studioDetailTitle = studioDetail.querySelector('[data-studio-detail-title]');
  const studioDetailDescription = studioDetail.querySelector('[data-studio-detail-description]');
  const defaultStudioDetailTitle = studioDetailTitle.textContent;
  const defaultStudioDetailDescription = studioDetailDescription.textContent;
  let pinnedStudioHotspot = null;

  const showStudioDetail = (hotspot) => {
    studioHotspots.forEach((button) => {
      const isActive = button === hotspot;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-expanded', String(isActive));
    });
    studioDetailTitle.textContent = hotspot.dataset.studioTitle || '';
    studioDetailDescription.textContent = hotspot.dataset.studioDescription || '';
  };

  const hideStudioDetail = () => {
    studioHotspots.forEach((button) => {
      button.classList.remove('is-active');
      button.setAttribute('aria-expanded', 'false');
    });
    studioDetailTitle.textContent = defaultStudioDetailTitle;
    studioDetailDescription.textContent = defaultStudioDetailDescription;
  };

  studioHotspots.forEach((hotspot) => {
    hotspot.setAttribute('aria-expanded', 'false');
    hotspot.addEventListener('pointerenter', () => {
      if (!pinnedStudioHotspot) showStudioDetail(hotspot);
    });
    hotspot.addEventListener('pointerleave', () => {
      if (!pinnedStudioHotspot) hideStudioDetail();
    });
    hotspot.addEventListener('focus', () => showStudioDetail(hotspot));
    hotspot.addEventListener('blur', () => {
      if (!pinnedStudioHotspot) hideStudioDetail();
    });
    hotspot.addEventListener('click', () => {
      if (pinnedStudioHotspot === hotspot) {
        pinnedStudioHotspot = null;
        hideStudioDetail();
        return;
      }
      pinnedStudioHotspot = hotspot;
      showStudioDetail(hotspot);
    });
  });

  studioScreen.addEventListener('click', (event) => {
    if (event.target.closest('.studio-hotspot') || !pinnedStudioHotspot) return;
    pinnedStudioHotspot = null;
    hideStudioDetail();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !pinnedStudioHotspot) return;
    pinnedStudioHotspot = null;
    hideStudioDetail();
  });
}

const songSearch = document.querySelector('[data-song-search]');
const songSearchEmpty = document.querySelector('.song-search-empty');
if (songSearch) {
  const songCards = [...document.querySelectorAll('.song-card')];
  const normalizeSearchText = (value) => value.normalize('NFKC').toLocaleLowerCase('ja').trim();

  songSearch.addEventListener('input', () => {
    const query = normalizeSearchText(songSearch.value);
    let visibleCount = 0;
    songCards.forEach((card) => {
      const matches = normalizeSearchText(card.textContent).includes(query);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });
    if (songSearchEmpty) songSearchEmpty.hidden = visibleCount !== 0;
  });
}

const newsArchiveList = document.querySelector('[data-news-archive]');
if (newsArchiveList) {
  const newsItems = [...newsArchiveList.querySelectorAll('.news-item')];
  const pageSize = 100;
  const pageCount = Math.max(1, Math.ceil(newsItems.length / pageSize));
  const requestedPage = Number.parseInt(new URLSearchParams(location.search).get('page') || '1', 10);
  const currentPage = Math.min(pageCount, Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1));
  const pageStart = (currentPage - 1) * pageSize;

  newsItems.forEach((item, index) => {
    item.hidden = index < pageStart || index >= pageStart + pageSize;
  });

  const pagination = document.querySelector('[data-news-pagination]');
  if (pagination) {
    const makeControl = (label, page, className, disabled) => {
      const control = document.createElement(disabled ? 'span' : 'a');
      control.className = className;
      control.textContent = label;
      if (disabled) control.setAttribute('aria-disabled', 'true');
      else control.href = `news.html?page=${page}`;
      return control;
    };
    pagination.replaceChildren(
      makeControl('← 前のページ', currentPage - 1, 'news-prev', currentPage === 1),
      Object.assign(document.createElement('span'), { className: 'news-page-status', textContent: `${currentPage} / ${pageCount}` }),
      makeControl('次のページ →', currentPage + 1, 'news-next', currentPage === pageCount)
    );
  }
}

const entryConfirmDialog = document.querySelector('.entry-confirm-dialog');
const entryConfirmForm = document.querySelector('[data-confirm-form]');
const entryConfirmView = entryConfirmDialog?.querySelector('[data-confirm-view]');
const entrySuccessView = entryConfirmDialog?.querySelector('[data-success-view]');
const entryTermsDialog = document.querySelector('.entry-terms-dialog');
const entryTermsOpen = document.querySelector('[data-entry-terms-open]');
let entryDialogScrollY = 0;

const lockEntryDialogScroll = () => {
  entryDialogScrollY = window.scrollY;
  document.documentElement.classList.add('dialog-open');
  document.body.classList.add('dialog-open');
  document.body.style.top = `-${entryDialogScrollY}px`;
};

const unlockEntryDialogScroll = () => {
  document.documentElement.classList.remove('dialog-open');
  document.body.classList.remove('dialog-open');
  document.body.style.top = '';
  window.scrollTo(0, entryDialogScrollY);
};

const accountList = entryConfirmForm?.querySelector('[data-account-list]');
const accountAddButton = entryConfirmForm?.querySelector('[data-account-add]');

const updateAccountAddButton = () => {
  if (!accountList || !accountAddButton) return;
  accountAddButton.disabled = accountList.querySelectorAll('.account-input').length >= 3;
};

accountAddButton?.addEventListener('click', () => {
  if (!accountList || accountList.querySelectorAll('.account-input').length >= 3) return;
  const row = document.createElement('div');
  row.className = 'account-row';
  row.innerHTML = '<input class="account-input" type="url" placeholder="SNSやWebサイトのURL"><button class="account-remove" type="button" aria-label="活動アカウントを削除">×</button>';
  row.querySelector('.account-remove')?.addEventListener('click', () => {
    row.remove();
    updateAccountAddButton();
  });
  accountList.append(row);
  row.querySelector('input')?.focus();
  updateAccountAddButton();
});

updateAccountAddButton();

const setEntrySummary = () => {
  if (!entryConfirmDialog || !entryConfirmForm) return;
  if (!entryConfirmDialog.querySelector('[data-summary="playerTitle"]')) {
    const playerTitleRow = document.createElement('div');
    playerTitleRow.innerHTML = '<dt>希望する称号名</dt><dd data-summary="playerTitle"></dd>';
    entryConfirmDialog.querySelector('[data-summary="vocalSynth"]')?.closest('div')?.after(playerTitleRow);
  }
  const isChartEntry = Boolean(entryConfirmForm.querySelector('#chart-file'));
  const values = isChartEntry ? {
    creator: entryConfirmForm.querySelector('#chart-name')?.value.trim() || '',
    chartFile: entryConfirmForm.querySelector('#chart-file')?.files?.[0]?.name || ''
  } : {
    title: entryConfirmForm.querySelector('#music-title')?.value || '',
    artist: entryConfirmForm.querySelector('#music-artist')?.value || '',
    email: entryConfirmForm.querySelector('#music-email')?.value || '',
    account: [...entryConfirmForm.querySelectorAll('.account-input')].map((input) => input.value.trim()).filter(Boolean).join(' / ') || '未入力',
    vocalSynth: entryConfirmForm.querySelector('#music-vocal-synth')?.value.trim() || '未入力',
    playerTitle: entryConfirmForm.querySelector('#music-player-title')?.value.trim() || '未入力',
    mode: entryConfirmForm.querySelector('#music-community')?.checked ? 'Community楽曲として公開' : '非公開型（採用時のみOfficial楽曲として収録）',
    file: entryConfirmForm.querySelector('#music-file')?.files?.[0]?.name || '',
    midi: entryConfirmForm.querySelector('#music-midi')?.files?.[0]?.name || '',
    jacket: entryConfirmForm.querySelector('#music-jacket')?.files?.[0]?.name || '未入力'
  };

  Object.entries(values).forEach(([key, value]) => {
    const output = entryConfirmDialog.querySelector(`[data-summary="${key}"]`);
    if (output) output.textContent = value;
  });
};

document.querySelectorAll('.form-demo').forEach((demoForm) => {
  demoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (demoForm === entryConfirmForm && entryConfirmDialog) {
      setEntrySummary();
      entryConfirmView.hidden = false;
      entrySuccessView.hidden = true;
      entryConfirmDialog.setAttribute('aria-labelledby', 'entry-confirm-title');
      lockEntryDialogScroll();
      entryConfirmDialog.showModal();
      return;
    }
  });
});

entryConfirmDialog?.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => {
  entryConfirmDialog.close();
});

entryConfirmDialog?.querySelector('[data-confirm-submit]')?.addEventListener('click', () => {
  entryConfirmView.hidden = true;
  entrySuccessView.hidden = false;
  entryConfirmDialog.setAttribute('aria-labelledby', 'entry-success-title');
  entryConfirmForm?.reset();
});

entryConfirmDialog?.querySelector('[data-success-close]')?.addEventListener('click', () => {
  entryConfirmDialog.close();
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

entryConfirmDialog?.addEventListener('close', () => {
  unlockEntryDialogScroll();
});

entryTermsOpen?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (!entryTermsDialog) return;
  lockEntryDialogScroll();
  entryTermsDialog.showModal();
});

entryTermsDialog?.querySelectorAll('[data-entry-terms-close]').forEach((button) => {
  button.addEventListener('click', () => entryTermsDialog.close());
});

entryTermsDialog?.addEventListener('close', unlockEntryDialogScroll);

const topButton = document.querySelector('.top-button');
if (topButton) {
  const updateTopButton = () => {
    const showAfter = Math.max(480, window.innerHeight * 0.75);
    topButton.classList.toggle('visible', window.scrollY > showAfter);
  };
  updateTopButton();
  window.addEventListener('scroll', updateTopButton, { passive: true });
  window.addEventListener('resize', updateTopButton, { passive: true });
}

const homeHeader = document.querySelector('.home-page .site-header');
const homeHero = document.querySelector('.home-page .hero');
if (homeHeader && homeHero) {
  let headerFadeFrame = 0;
  const updateHeaderBackground = () => {
    headerFadeFrame = 0;
    const heroBottom = homeHero.offsetTop + homeHero.offsetHeight;
    const fadeStart = heroBottom - homeHeader.offsetHeight;
    const fadeDistance = Math.max(180, window.innerHeight * 0.22);
    const progress = Math.min(1, Math.max(0, (window.scrollY - fadeStart) / fadeDistance));
    homeHeader.style.setProperty('--header-bg-opacity', (progress * 0.72).toFixed(3));
    homeHeader.style.setProperty('--header-blur', `${(progress * 16).toFixed(1)}px`);
  };
  const requestHeaderBackgroundUpdate = () => {
    if (headerFadeFrame) return;
    headerFadeFrame = requestAnimationFrame(updateHeaderBackground);
  };
  updateHeaderBackground();
  window.addEventListener('scroll', requestHeaderBackgroundUpdate, { passive: true });
  window.addEventListener('resize', requestHeaderBackgroundUpdate, { passive: true });
}

(() => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const header = document.querySelector('.header-inner');
  if (!header || !AudioContextClass) return;

  const control = document.createElement('div');
  control.className = 'audio-control';
  control.setAttribute('role', 'group');
  control.setAttribute('aria-label', 'BGMコントロール');
  control.innerHTML = `
    <button class="volume-trigger" type="button" aria-label="BGMをミュート" title="音量" disabled>
      <span class="speaker-icon" aria-hidden="true"></span>
    </button>
    <div class="volume-popover">
      <input class="volume-slider" id="bgm-volume" type="range" min="0" max="1" step="0.01" aria-label="BGM音量">
    </div>
  `;
  header.insertBefore(control, menuButton || navigation);

  const steamLogo = document.createElement('span');
  steamLogo.className = 'header-steam';
  steamLogo.setAttribute('role', 'img');
  steamLogo.setAttribute('aria-label', 'Steam');
  steamLogo.innerHTML = '<img src="assets/icons/steam-wordmark.svg" alt="">';
  header.insertBefore(steamLogo, menuButton || navigation);

  const xLink = document.createElement('a');
  xLink.className = 'header-x';
  xLink.href = 'https://x.com/raythm_official';
  xLink.target = '_blank';
  xLink.rel = 'noopener noreferrer';
  xLink.setAttribute('aria-label', 'raythm公式Xを開く');
  xLink.innerHTML = '<span aria-hidden="true"></span>';
  header.insertBefore(xLink, steamLogo);

  const volumeTrigger = control.querySelector('.volume-trigger');
  const volume = control.querySelector('.volume-slider');
  const canvas = document.querySelector('#title-spectrum');
  const canvasContext = canvas?.getContext('2d') || null;

  const syncViewportLayout = () => {
    document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
  };
  syncViewportLayout();
  window.addEventListener('resize', syncViewportLayout, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(syncViewportLayout).observe(header);

  const AUDIO_START_KEY = 'raythm.audio.sequenceStart';
  const AUDIO_PAUSED_KEY = 'raythm.audio.pausedAt';
  const AUDIO_PLAY_KEY = 'raythm.audio.shouldPlay';
  const VOLUME_KEY = 'raythm.audio.volume';
  const initialVolume = Math.min(1, Math.max(0, Number(localStorage.getItem(VOLUME_KEY) ?? 0.45)));
  volume.value = String(initialVolume);

  const audioContext = new AudioContextClass({ latencyHint: 'interactive' });
  const analyser = audioContext.createAnalyser();
  const gain = audioContext.createGain();
  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0;
  analyser.minDecibels = -100;
  analyser.maxDecibels = -10;
  analyser.connect(gain);
  gain.connect(audioContext.destination);
  gain.gain.value = initialVolume;

  let introBuffer = null;
  let loopBuffer = null;
  let activeSources = [];
  let introMedia = null;
  let loopMedia = null;
  let mediaMode = false;
  let isPlaying = false;
  let audioReady = false;
  let volumeBeforeMute = initialVolume || 0.45;

  const stopSources = () => {
    activeSources.forEach((source) => {
      try { source.stop(); } catch (_) { /* already stopped */ }
      source.disconnect();
    });
    activeSources = [];
    if (introMedia) {
      introMedia.onended = null;
      introMedia.pause();
    }
    if (loopMedia) loopMedia.pause();
    isPlaying = false;
  };

  const updateVolumeControl = () => {
    const muted = Number(volume.value) <= 0.001;
    control.classList.toggle('is-muted', muted);
    volumeTrigger.setAttribute('aria-label', muted ? 'BGMのミュートを解除' : 'BGMをミュート');
    volume.setAttribute('aria-valuetext', `${Math.round(Number(volume.value) * 100)}%`);
  };

  const sequenceElapsed = () => {
    const sequenceStart = Number(sessionStorage.getItem(AUDIO_START_KEY));
    if (Number.isFinite(sequenceStart) && sequenceStart > 0) {
      return Math.max(0, (Date.now() - sequenceStart) / 1000);
    }
    const pausedAt = Number(sessionStorage.getItem(AUDIO_PAUSED_KEY));
    return Number.isFinite(pausedAt) && pausedAt >= 0 ? pausedAt : 0;
  };

  const createSource = (buffer, loop = false) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(analyser);
    activeSources.push(source);
    return source;
  };

  const scheduleMediaSequence = async () => {
    if (!introMedia || !loopMedia) return;
    let elapsed = sequenceElapsed();
    if (!sessionStorage.getItem(AUDIO_START_KEY)) {
      sessionStorage.setItem(AUDIO_START_KEY, String(Date.now() - elapsed * 1000));
      sessionStorage.removeItem(AUDIO_PAUSED_KEY);
    }

    if (elapsed < introMedia.duration - 0.01) {
      introMedia.currentTime = Math.min(elapsed, Math.max(0, introMedia.duration - 0.01));
      loopMedia.currentTime = 0;
      introMedia.onended = () => {
        if (!isPlaying) return;
        loopMedia.currentTime = 0;
        loopMedia.play().catch(() => {});
      };
      await introMedia.play();
    } else {
      loopMedia.currentTime = Math.max(0, (elapsed - introMedia.duration) % loopMedia.duration);
      await loopMedia.play();
    }

    sessionStorage.setItem(AUDIO_PLAY_KEY, '1');
    isPlaying = true;
    control.classList.add('is-playing');
  };

  const scheduleSequence = async () => {
    if (audioContext.state !== 'running') return;
    stopSources();

    if (mediaMode) {
      try {
        await scheduleMediaSequence();
      } catch (_) {
        isPlaying = false;
      }
      return;
    }
    if (!introBuffer || !loopBuffer) return;

    let elapsed = sequenceElapsed();
    if (!sessionStorage.getItem(AUDIO_START_KEY)) {
      sessionStorage.setItem(AUDIO_START_KEY, String(Date.now() - elapsed * 1000));
      sessionStorage.removeItem(AUDIO_PAUSED_KEY);
    }

    const startAt = audioContext.currentTime + 0.035;
    if (elapsed < introBuffer.duration - 0.01) {
      const intro = createSource(introBuffer);
      const safeOffset = Math.min(elapsed, Math.max(0, introBuffer.duration - 0.01));
      intro.start(startAt, safeOffset);

      const loop = createSource(loopBuffer, true);
      loop.start(startAt + (introBuffer.duration - safeOffset), 0);
    } else {
      const loop = createSource(loopBuffer, true);
      const loopOffset = (elapsed - introBuffer.duration) % loopBuffer.duration;
      loop.start(startAt, Math.max(0, loopOffset));
    }

    sessionStorage.setItem(AUDIO_PLAY_KEY, '1');
    isPlaying = true;
    control.classList.add('is-playing');
  };

  const resumePlayback = async () => {
    try {
      await audioContext.resume();
      if (audioContext.state === 'running') await scheduleSequence();
    } catch (_) {
      isPlaying = false;
    }
  };

  const pausePlayback = async () => {
    const elapsed = sequenceElapsed();
    sessionStorage.setItem(AUDIO_PAUSED_KEY, String(elapsed));
    sessionStorage.removeItem(AUDIO_START_KEY);
    sessionStorage.setItem(AUDIO_PLAY_KEY, '0');
    stopSources();
    await audioContext.suspend();
  };

  volumeTrigger.addEventListener('click', () => {
    const currentVolume = Number(volume.value);
    if (currentVolume > 0.001) {
      volumeBeforeMute = currentVolume;
      volume.value = '0';
    } else {
      volume.value = String(volumeBeforeMute);
    }
    volume.dispatchEvent(new Event('input', { bubbles: true }));
  });

  volume.addEventListener('input', () => {
    const nextVolume = Number(volume.value);
    localStorage.setItem(VOLUME_KEY, String(nextVolume));
    gain.gain.setTargetAtTime(nextVolume, audioContext.currentTime, 0.015);
    if (nextVolume > 0.001) volumeBeforeMute = nextVolume;
    updateVolumeControl();
  });

  const loadBuffer = async (path) => {
    const response = await fetch(new URL(path, document.baseURI), { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Audio load failed: ${response.status}`);
    return audioContext.decodeAudioData(await response.arrayBuffer());
  };

  const loadMediaElement = (media) => new Promise((resolve, reject) => {
    const cleanup = () => {
      media.removeEventListener('canplaythrough', onReady);
      media.removeEventListener('error', onError);
    };
    const onReady = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Media element load failed')); };
    if (media.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) { resolve(); return; }
    media.addEventListener('canplaythrough', onReady, { once: true });
    media.addEventListener('error', onError, { once: true });
    media.load();
  });

  const loadMediaFallback = async () => {
    mediaMode = true;
    introMedia = new Audio('assets/audio/ColorAr-ray_inst_intro.mp3');
    loopMedia = new Audio('assets/audio/ColorAr-ray_inst_loop.mp3');
    introMedia.preload = 'auto';
    loopMedia.preload = 'auto';
    loopMedia.loop = true;
    audioContext.createMediaElementSource(introMedia).connect(analyser);
    audioContext.createMediaElementSource(loopMedia).connect(analyser);
    await Promise.all([loadMediaElement(introMedia), loadMediaElement(loopMedia)]);
  };

  const markAudioReady = () => {
    audioReady = true;
    volumeTrigger.disabled = false;
    control.classList.remove('is-loading');
    sessionStorage.setItem(AUDIO_PLAY_KEY, '1');
    resumePlayback();
  };

  const preloadAudio = location.protocol === 'file:'
    ? loadMediaFallback()
    : Promise.all([
      loadBuffer('assets/audio/ColorAr-ray_inst_intro.mp3'),
      loadBuffer('assets/audio/ColorAr-ray_inst_loop.mp3'),
    ]).then(([intro, loop]) => {
      introBuffer = intro;
      loopBuffer = loop;
    }).catch(() => loadMediaFallback());

  control.classList.add('is-loading');
  updateVolumeControl();

  const unlockAudio = () => {
    if (!isPlaying) resumePlayback();
    if (audioReady && audioContext.state === 'running') {
      document.removeEventListener('pointerdown', unlockAudio, true);
      document.removeEventListener('click', unlockAudio, true);
      document.removeEventListener('keydown', unlockAudio, true);
    }
  };
  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('click', unlockAudio, true);
  document.addEventListener('keydown', unlockAudio, true);

  preloadAudio.then(markAudioReady).catch(() => {
    control.classList.remove('is-loading');
    control.classList.add('has-error');
    volumeTrigger.disabled = true;
    volumeTrigger.title = 'BGMを読み込めませんでした';
    volumeTrigger.setAttribute('aria-label', 'BGMを読み込めませんでした');
  });

  if (!canvas || !canvasContext) return;

  // Port of Rofutok112/raythm title_spectrum_visualizer.cpp.
  const BAR_COUNT = 64;
  const smoothedLevels = new Float32Array(BAR_COUNT);
  const bars = new Float32Array(BAR_COUNT);
  const peaks = new Float32Array(BAR_COUNT);
  const peakVelocities = new Float32Array(BAR_COUNT);
  const peakHoldTimes = new Float32Array(BAR_COUNT);
  const fftDb = new Float32Array(analyser.frequencyBinCount);
  const rawLevels = new Float32Array(BAR_COUNT);
  let previousFrameTime = performance.now();

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const hero = canvas.closest('.hero');
  let spectrumFadeFrame = 0;
  const updateSpectrumVisibility = () => {
    spectrumFadeFrame = 0;
    const fadeDistance = Math.max(360, Math.min(720, window.innerHeight * 0.72));
    const visibility = clamp(1 - window.scrollY / fadeDistance, 0, 1);
    hero?.style.setProperty('--hero-visibility', String(visibility));
    hero?.classList.toggle('is-faded', visibility <= 0.005);
  };
  const requestSpectrumVisibilityUpdate = () => {
    if (spectrumFadeFrame) return;
    spectrumFadeFrame = requestAnimationFrame(updateSpectrumVisibility);
  };
  updateSpectrumVisibility();
  window.addEventListener('scroll', requestSpectrumVisibilityUpdate, { passive: true });
  window.addEventListener('resize', requestSpectrumVisibilityUpdate, { passive: true });
  const smoothstep01 = (value) => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const logFrequencyFade = (frequency, start, end) => {
    const safeFrequency = Math.max(frequency, 1);
    return smoothstep01((Math.log(safeFrequency) - Math.log(start)) / (Math.log(end) - Math.log(start)));
  };
  const perceptualCorrectionDb = (frequency) => {
    const lowReduction = (1 - logFrequencyFade(frequency, 80, 900)) * -14;
    const presenceRise = logFrequencyFade(frequency, 900, 2400) * 12;
    const airRolloff = logFrequencyFade(frequency, 6500, 14000) * -8;
    return lowReduction + presenceRise + airRolloff;
  };
  const amplitudeToDbLevel = (amplitude, frequency) => {
    const db = 20 * Math.log10(Math.max(amplitude, 0.00001));
    return clamp((db + perceptualCorrectionDb(frequency) + 50) / 22, 0, 1);
  };
  const suppressBelowThreshold = (level) => {
    const threshold = 0.025;
    if (level >= threshold) return level;
    return threshold * Math.pow(clamp(level / threshold, 0, 1), 1.4);
  };
  const blendForDt = (dt, timeConstant) => 1 - Math.exp(-dt / Math.max(timeConstant, 0.0001));

  const updateSpectrum = (dt) => {
    rawLevels.fill(0);
    if (isPlaying && audioContext.state === 'running') {
      analyser.getFloatFrequencyData(fftDb);
      const sampleRate = audioContext.sampleRate;
      const binWidth = sampleRate / 4096;
      const minBin = Math.max(1, Math.floor(1 / binWidth));
      const nyquist = Math.max(sampleRate * 0.5, 2);
      const maxFrequency = Math.min(16000, nyquist * 0.96);
      const maxBin = clamp(Math.ceil(maxFrequency / binWidth), minBin + BAR_COUNT, fftDb.length);
      const binSpan = maxBin / minBin;
      const edges = new Int32Array(BAR_COUNT + 1);
      edges[0] = minBin;

      for (let i = 1; i <= BAR_COUNT; i += 1) {
        const requested = Math.ceil(minBin * Math.pow(binSpan, i / BAR_COUNT));
        edges[i] = clamp(requested, edges[i - 1] + 1, maxBin - (BAR_COUNT - i));
      }

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const begin = edges[i];
        const end = edges[i + 1];
        let amplitudeSum = 0;
        for (let bin = begin; bin < end; bin += 1) {
          amplitudeSum += Math.pow(10, fftDb[bin] / 20);
        }
        const average = amplitudeSum / Math.max(1, end - begin);
        const centerHz = ((begin + end) * 0.5) * binWidth;
        rawLevels[i] = suppressBelowThreshold(amplitudeToDbLevel(average, centerHz));
      }
    }

    const frameDt = dt <= 0 ? 1 / 240 : Math.min(dt, 1 / 20);
    for (let i = 0; i < BAR_COUNT; i += 1) {
      const left = rawLevels[Math.max(0, i - 1)];
      const right = rawLevels[Math.min(BAR_COUNT - 1, i + 1)];
      let target = clamp(left * 0.2 + rawLevels[i] * 0.6 + right * 0.2, 0, 1);
      if (target < 0.002) target = 0;

      const inputBlend = blendForDt(frameDt, target > smoothedLevels[i] ? 0.006 : 0.026);
      smoothedLevels[i] += (target - smoothedLevels[i]) * inputBlend;
      const barBlend = blendForDt(frameDt, smoothedLevels[i] > bars[i] ? 0.004 : 0.018);
      bars[i] += (smoothedLevels[i] - bars[i]) * barBlend;

      if (bars[i] > peaks[i]) {
        peaks[i] = bars[i];
        peakVelocities[i] = 0;
        peakHoldTimes[i] = 0.001;
      } else if (peakHoldTimes[i] > 0) {
        peakHoldTimes[i] = Math.max(0, peakHoldTimes[i] - frameDt);
        peaks[i] = Math.max(peaks[i], bars[i]);
      } else {
        peakVelocities[i] = Math.min(32, peakVelocities[i] + 64 * frameDt);
        peaks[i] = Math.max(bars[i], peaks[i] - peakVelocities[i] * frameDt);
      }
    }
  };

  const mixColor = (from, to, amount) => from.map((value, index) => value + (to[index] - value) * amount);
  const colorString = (color) => `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;

  const drawSpectrum = () => {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.max(1, Math.round(rect.width * pixelRatio));
    const targetHeight = Math.max(1, Math.round(rect.height * pixelRatio));
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    canvasContext.clearRect(0, 0, rect.width, rect.height);

    const gap = 3;
    const blockHeight = 8;
    const blockGap = 3;
    const blockStep = blockHeight + blockGap;
    const barWidth = Math.max(0, (rect.width - gap * (BAR_COUNT - 1)) / BAR_COUNT);
    const baseline = rect.height - 3;
    const low = [107, 33, 168, 128 / 255];
    const mid = [168, 85, 247, 178 / 255];
    const top = [216, 180, 254, 230 / 255];

    for (let i = 0; i < BAR_COUNT; i += 1) {
      const x = i * (barWidth + gap);
      const height = clamp(bars[i], 0, 1) * rect.height;
      for (let bottom = baseline; bottom > baseline - height; bottom -= blockStep) {
        const blockTop = Math.max(baseline - height, bottom - blockHeight);
        const segmentHeight = bottom - blockTop;
        if (segmentHeight <= 0.5) continue;
        const colorT = clamp((baseline - blockTop) / Math.max(1, rect.height), 0, 1);
        const color = colorT < 0.6
          ? mixColor(low, mid, colorT / 0.6)
          : mixColor(mid, top, (colorT - 0.6) / 0.4);
        canvasContext.fillStyle = colorString(color);
        canvasContext.fillRect(x, blockTop, barWidth, segmentHeight);
      }

      const peakY = baseline - clamp(peaks[i], 0, 1) * rect.height - 2;
      canvasContext.fillStyle = 'rgba(216, 180, 254, 0.43)';
      canvasContext.fillRect(x, peakY - 1, barWidth, 4);
      canvasContext.fillStyle = 'rgba(216, 180, 254, 0.65)';
      canvasContext.fillRect(x, peakY, barWidth, 2);
    }
  };

  const animate = (time) => {
    const dt = (time - previousFrameTime) / 1000;
    previousFrameTime = time;
    updateSpectrum(dt);
    drawSpectrum();
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
})();
