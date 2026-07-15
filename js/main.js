const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

if (menuButton && navigation) {
  const navBackdrop = document.createElement('button');
  navBackdrop.className = 'nav-backdrop';
  navBackdrop.type = 'button';
  navBackdrop.tabIndex = -1;
  navBackdrop.setAttribute('aria-label', 'メニューを閉じる');
  document.body.append(navBackdrop);

  const setNavigationOpen = (isOpen) => {
    navigation.classList.toggle('open', isOpen);
    navBackdrop.classList.toggle('open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  };

  menuButton.addEventListener('click', () => {
    setNavigationOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navBackdrop.addEventListener('click', () => setNavigationOpen(false));

  navigation.addEventListener('click', () => {
    setNavigationOpen(false);
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

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.filter-button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('.song-card').forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.genre !== filter;
    });
  });
});

const demoForm = document.querySelector('.form-demo');
if (demoForm) {
  demoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const note = demoForm.querySelector('.demo-note');
    if (note) note.textContent = 'デモのため送信は行われません。募集開始時にフォームを有効化します。';
  });
}

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
