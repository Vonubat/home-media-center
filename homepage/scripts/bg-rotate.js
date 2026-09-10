const INTERVAL_MS = 10000;
const FADE_MS = 2000;
const PRELOAD_AHEAD = 3;

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
}

async function startBgRotate() {
  let images;

  try {
    const res = await fetch(`/images/images.json?t=${Date.now()}`);
    images = await res.json();
  } catch (e) {
    console.warn('bg-rotate: failed to fetch images.json', e);
    return;
  }

  if (!images.length) {
    console.warn('bg-rotate: no images found');
    return;
  }

  for (let i = images.length - 1; i > 0; i -= 1) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [images[i], images[j]] = [images[j], images[i]];
  }

  const bgDiv = [...document.querySelectorAll('*')].find((el) =>
    getComputedStyle(el).backgroundImage.includes('/images/'),
  );

  if (!bgDiv) {
    console.warn('bg-rotate: background div not found');
    return;
  }

  const pos = getComputedStyle(bgDiv).position;
  if (pos === 'static') bgDiv.style.position = 'relative';
  bgDiv.style.overflow = 'hidden';

  const gradient = document.createElement('div');
  gradient.style.cssText = 'position:absolute;inset:0;background:rgba(10,10,10,0.7);z-index:1;';
  bgDiv.appendChild(gradient);

  let current = 0;
  let currentEl = null;

  for (let i = 0; i < Math.min(PRELOAD_AHEAD + 1, images.length); i += 1) {
    await preload(images[i]);
  }

  function show(index, fade) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;inset:0;z-index:0;
      background:url("${images[index]}") center/cover no-repeat;
      opacity:0;
    `;
    gradient.before(el);

    if (fade) {
      el.getBoundingClientRect();
      el.style.transition = `opacity ${FADE_MS}ms ease-in-out`;
    }
    el.style.opacity = '1';

    if (!currentEl) {
      bgDiv.style.backgroundImage = 'none';
    }

    const old = currentEl;
    if (old) {
      setTimeout(() => old.remove(), fade ? FADE_MS : 0);
    }
    currentEl = el;
  }

  show(0, false);

  async function next() {
    current = (current + 1) % images.length;
    show(current, true);
    preload(images[(current + PRELOAD_AHEAD) % images.length]);
  }

  setInterval(next, INTERVAL_MS);
  console.info(`bg-rotate: started with ${images.length} images, ${INTERVAL_MS / 1000}s interval`);
}

await startBgRotate();
