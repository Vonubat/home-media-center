const INTERVAL_MS = 10000;
const FADE_MS = 2000;
const PRELOAD_AHEAD = 3;
const IMAGE_PATH = /\.(jpe?g|png|webp|gif|avif)$/i;

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
}

function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function isImagePath(src) {
  return typeof src === 'string' && IMAGE_PATH.test(src);
}

function isCurrentBackdrop(src) {
  return /\/current\.jpe?g$/i.test(src);
}

function extractImagesPath(backgroundImage) {
  const matches = backgroundImage.matchAll(/url\((['"]?)(.*?)\1\)/g);
  for (const match of matches) {
    const raw = match[2];
    if (!raw.includes('/images/')) {
      continue;
    }
    try {
      return new URL(raw, window.location.origin).pathname;
    } catch {
      return raw;
    }
  }
  return null;
}

function buildPlaylist(manifest, visiblePath) {
  const rest = manifest.filter((src) => isImagePath(src) && src !== visiblePath && !isCurrentBackdrop(src));
  const shuffled = shuffle(rest);
  if (!visiblePath) {
    return shuffled;
  }
  return [visiblePath, ...shuffled];
}

async function startBgRotate() {
  let manifest;

  try {
    const res = await fetch(`/images/images.json?t=${Date.now()}`);
    manifest = await res.json();
  } catch (e) {
    console.warn('bg-rotate: failed to fetch images.json', e);
    return;
  }

  if (!Array.isArray(manifest)) {
    console.warn('bg-rotate: images.json is not an array');
    return;
  }

  const bgDiv = [...document.querySelectorAll('*')].find((el) =>
    getComputedStyle(el).backgroundImage.includes('/images/'),
  );

  if (!bgDiv) {
    console.warn('bg-rotate: background div not found');
    return;
  }

  const visiblePath = extractImagesPath(getComputedStyle(bgDiv).backgroundImage);
  const images = buildPlaylist(manifest, visiblePath);

  if (!images.length) {
    console.warn('bg-rotate: no images found');
    return;
  }

  let current = 0;
  let currentEl = null;
  let gradient = null;

  for (let i = 0; i < Math.min(PRELOAD_AHEAD + 1, images.length); i += 1) {
    await preload(images[i]);
  }

  function ensureLayerHost() {
    const pos = getComputedStyle(bgDiv).position;
    if (pos === 'static') bgDiv.style.position = 'relative';
    bgDiv.style.overflow = 'hidden';

    if (gradient) {
      return;
    }

    gradient = document.createElement('div');
    gradient.style.cssText = 'position:absolute;inset:0;background:rgba(10,10,10,0.7);z-index:1;';
    bgDiv.appendChild(gradient);
  }

  function show(index) {
    ensureLayerHost();

    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;inset:0;z-index:0;
      background:url("${images[index]}") center/cover no-repeat;
      opacity:0;
    `;
    gradient.before(el);

    el.getBoundingClientRect();
    el.style.transition = `opacity ${FADE_MS}ms ease-in-out`;
    el.style.opacity = '1';

    const old = currentEl;
    currentEl = el;

    setTimeout(() => {
      bgDiv.style.backgroundImage = 'none';
      old?.remove();
    }, FADE_MS);
  }

  function next() {
    current = (current + 1) % images.length;
    show(current);
    preload(images[(current + PRELOAD_AHEAD) % images.length]);
  }

  setInterval(next, INTERVAL_MS);
  console.info(`bg-rotate: started with ${images.length} images, ${INTERVAL_MS / 1000}s interval`);
}

await startBgRotate();
