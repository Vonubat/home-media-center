(function bootHomepage() {
  const FORECAST_DAYS_DEFAULT = 5;
  const TIMEZONE_DEFAULT = 'Europe/Minsk';

  function isOn(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    if (value === true || value === false) return value;
    const s = String(value).trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'off'].includes(s)) return false;
    return fallback;
  }

  function clampForecastDays(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return FORECAST_DAYS_DEFAULT;
    return Math.min(7, Math.max(1, Math.round(n)));
  }

  function readBootConfig() {
    const defaults = {
      clockEnabled: true,
      clockShowSeconds: true,
      clockHour12: false,
      dateEnabled: true,
      weatherEnabled: true,
      weatherForecastDays: FORECAST_DAYS_DEFAULT,
      datetimeTimezone: TIMEZONE_DEFAULT,
    };
    const el = document.getElementById('__NEXT_DATA__');
    if (!el?.textContent) return defaults;
    try {
      const raw = JSON.parse(el.textContent)?.props?.pageProps?.initialSettings?.clockWeather;
      if (!raw || typeof raw !== 'object') return defaults;
      return {
        clockEnabled: isOn(raw.clockEnabled, defaults.clockEnabled),
        clockShowSeconds: isOn(raw.clockShowSeconds, defaults.clockShowSeconds),
        clockHour12: isOn(raw.clockHour12, defaults.clockHour12),
        dateEnabled: isOn(raw.dateEnabled, defaults.dateEnabled),
        weatherEnabled: isOn(raw.weatherEnabled, defaults.weatherEnabled),
        weatherForecastDays: clampForecastDays(raw.weatherForecastDays),
        datetimeTimezone: String(raw.datetimeTimezone || defaults.datetimeTimezone),
      };
    } catch {
      return defaults;
    }
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatTime(date, config) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: config.datetimeTimezone,
      hour: '2-digit',
      minute: '2-digit',
      second: config.clockShowSeconds ? '2-digit' : undefined,
      hour12: config.clockHour12,
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value || '00';
    let text = config.clockShowSeconds
      ? `${pad(get('hour'))}:${pad(get('minute'))}:${pad(get('second'))}`
      : `${pad(get('hour'))}:${pad(get('minute'))}`;
    const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value;
    if (config.clockHour12 && dayPeriod) {
      text += ` ${dayPeriod.toUpperCase()}`;
    }
    return text;
  }

  function formatDate(date, config) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: config.datetimeTimezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  function tickClock(clock, config) {
    const timeEl = clock.querySelector('.clock__time');
    const dateEl = clock.querySelector('.clock__date');
    const now = new Date();
    if (timeEl) timeEl.textContent = formatTime(now, config);
    if (dateEl) dateEl.textContent = formatDate(now, config);
  }

  function skeletonDayHtml() {
    return `
      <div class="weather__day">
        <div class="skel weather__skel--icon"></div>
        <div class="weather__day-name"><div class="skel weather__skel--label"></div></div>
        <div class="weather__range"><div class="skel weather__skel--range"></div></div>
      </div>
    `;
  }

  function skeletonMetaHtml() {
    return Array.from(
      { length: 4 },
      () => '<span class="weather__stat"><span class="skel weather__skel--stat"></span></span>',
    ).join('');
  }

  function weatherSkeletonHtml(forecastDays) {
    const days = Array.from({ length: forecastDays }, () => skeletonDayHtml()).join('');
    return `
      <div class="weather__hero skel weather__skel--hero"></div>
      <div class="weather__now">
        <div class="weather__city"><div class="skel weather__skel--city"></div></div>
        <div class="weather__temps">
          <span class="weather__temp"><span class="skel weather__skel--temp"></span></span>
          <span class="weather__feels"><span class="skel weather__skel--feels"></span></span>
        </div>
        <div class="weather__cond"><div class="skel weather__skel--cond"></div></div>
        <div class="weather__meta">${skeletonMetaHtml()}</div>
      </div>
      <div class="weather__forecast">${days}</div>
    `;
  }

  function paintClock(root, config) {
    let clock = document.getElementById('clock');
    if (!clock) {
      clock = document.createElement('div');
      clock.id = 'clock';
      clock.className = 'clock';
      root.appendChild(clock);
    }
    if (!config.clockEnabled && !config.dateEnabled) {
      clock.hidden = true;
      return clock;
    }
    clock.hidden = false;
    if (!clock.querySelector('.clock__time') && !clock.querySelector('.clock__date')) {
      clock.innerHTML = `
        ${config.clockEnabled ? '<div class="clock__time"></div>' : ''}
        ${config.dateEnabled ? '<div class="clock__date"></div>' : ''}
      `;
    }
    tickClock(clock, config);
    if (!clock.dataset.bootTimer) {
      const id = setInterval(
        () => tickClock(clock, config),
        config.clockShowSeconds ? 1000 : 30_000,
      );
      clock.dataset.bootTimer = String(id);
    }
    return clock;
  }

  function paintWeather(root, config) {
    let weather = document.getElementById('weather');
    if (!weather) {
      weather = document.createElement('div');
      weather.id = 'weather';
      weather.className = 'weather';
      root.appendChild(weather);
    }
    if (!config.weatherEnabled) {
      weather.hidden = true;
      return weather;
    }
    weather.hidden = false;
    weather.dataset.forecastDays = String(config.weatherForecastDays);
    if (!weather.querySelector('.weather__forecast')) {
      weather.innerHTML = weatherSkeletonHtml(config.weatherForecastDays);
    }
    return weather;
  }

  function mountHeaderShells() {
    const root = document.getElementById('information-widgets');
    if (!root) return false;
    const config = readBootConfig();
    paintClock(root, config);
    paintWeather(root, config);
    return true;
  }

  function loadModule() {
    const src = '/scripts/index.js';
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    document.documentElement.appendChild(script);
  }

  function boot() {
    if (!mountHeaderShells()) return false;
    loadModule();
    return true;
  }

  if (boot()) return;

  const observer = new MutationObserver(() => {
    if (boot()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => {
    if (boot()) observer.disconnect();
  });
})();
