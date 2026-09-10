import { loadHomepageConfig } from './config.js';
import { ClockWidget } from './clock.js';
import { WeatherWidget } from './weather.js';
import { DisksWidget } from './disks.js';

function ensureChild(parent, id, className) {
  let el = document.getElementById(id);
  if (el) return el;
  el = document.createElement('div');
  el.id = id;
  el.className = className;
  parent.appendChild(el);
  return el;
}

function mountHeader() {
  const root = document.getElementById('information-widgets');
  if (!root) return null;
  return {
    root,
    clock: ensureChild(root, 'clock', 'clock'),
    weather: ensureChild(root, 'weather', 'weather'),
  };
}

function mountDisks() {
  let root = document.getElementById('disks');
  if (root) return root;

  root = document.createElement('div');
  root.id = 'disks';

  const style = document.getElementById('style');
  if (style) {
    style.prepend(root);
  } else {
    const footer = document.getElementById('footer');
    if (footer) footer.prepend(root);
    else document.body.appendChild(root);
  }
  return root;
}

async function start() {
  const config = await loadHomepageConfig();
  const header = mountHeader();
  if (header && (config.clockEnabled || config.dateEnabled || config.weatherEnabled)) {
    new ClockWidget(header.clock, config).start();
    new WeatherWidget(header.weather, config).start();
  }
  new DisksWidget(mountDisks(), config).start();
}

await start();
