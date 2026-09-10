export const DEFAULTS = {
  clockEnabled: true,
  clockShowSeconds: true,
  clockHour12: false,
  dateEnabled: true,
  weatherEnabled: true,
  weatherCity: 'Minsk',
  weatherUnits: 'metric',
  weatherForecastDays: 5,
  datetimeTimezone: 'Europe/Minsk',
  weatherLatitude: '',
  weatherLongitude: '',
};

export const FORECAST_DAYS_MIN = 1;
export const FORECAST_DAYS_MAX = 7;

function isOn(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === false) return value;
  const s = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'off'].includes(s)) return false;
  return fallback;
}

function pick(raw, key, fallback) {
  const value = raw?.[key];
  if (value === undefined || value === null || value === '') return fallback;
  return value;
}

function parseUnits(value) {
  return String(value).toLowerCase() === 'imperial' ? 'imperial' : 'metric';
}

export function clampForecastDays(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return DEFAULTS.weatherForecastDays;
  return Math.min(FORECAST_DAYS_MAX, Math.max(FORECAST_DAYS_MIN, Math.round(n)));
}

export function parseClockWeather(raw = {}) {
  return {
    clockEnabled: isOn(raw.clockEnabled, DEFAULTS.clockEnabled),
    clockShowSeconds: isOn(raw.clockShowSeconds, DEFAULTS.clockShowSeconds),
    clockHour12: isOn(raw.clockHour12, DEFAULTS.clockHour12),
    dateEnabled: isOn(raw.dateEnabled, DEFAULTS.dateEnabled),
    weatherEnabled: isOn(raw.weatherEnabled, DEFAULTS.weatherEnabled),
    weatherCity: String(pick(raw, 'weatherCity', DEFAULTS.weatherCity)),
    weatherUnits: parseUnits(pick(raw, 'weatherUnits', DEFAULTS.weatherUnits)),
    weatherForecastDays: clampForecastDays(pick(raw, 'weatherForecastDays', DEFAULTS.weatherForecastDays)),
    datetimeTimezone: String(pick(raw, 'datetimeTimezone', DEFAULTS.datetimeTimezone)),
    weatherLatitude: String(pick(raw, 'weatherLatitude', DEFAULTS.weatherLatitude)).trim(),
    weatherLongitude: String(pick(raw, 'weatherLongitude', DEFAULTS.weatherLongitude)).trim(),
  };
}

export function driveLetter(hostPath) {
  const s = String(hostPath).trim().replaceAll('\\', '/');
  const win = /^([A-Za-z]):/.exec(s);
  if (win) return win[1].toUpperCase();
  const posix = /^\/([A-Za-z])(\/|$)/.exec(s);
  if (posix) return posix[1].toUpperCase();
  return '?';
}

export function parseDisks(raw = {}) {
  const volumes = Array.isArray(raw.volumes) ? raw.volumes : [];
  return volumes
    .map((volume) => ({
      mount: String(volume.mount || '').trim(),
      hostPath: String(volume.hostPath || '').trim(),
    }))
    .filter((volume) => volume.mount);
}

function readInitialSettings() {
  const nextData = document.getElementById('__NEXT_DATA__');
  if (!nextData?.textContent) return null;
  try {
    const parsed = JSON.parse(nextData.textContent);
    const initial = parsed?.props?.pageProps?.initialSettings;
    return initial && typeof initial === 'object' ? initial : null;
  } catch {
    // Invalid __NEXT_DATA__ JSON; fall back to defaults.
    return null;
  }
}

export async function loadHomepageConfig() {
  const initial = readInitialSettings();
  if (!initial?.clockWeather) {
    console.warn('homepage: no clockWeather in settings, using defaults');
  }
  return {
    ...parseClockWeather(initial?.clockWeather && typeof initial.clockWeather === 'object' ? initial.clockWeather : {}),
    disks: parseDisks(initial?.disks && typeof initial.disks === 'object' ? initial.disks : {}),
  };
}
