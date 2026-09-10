export const ICON_BASE = 'https://cdn.jsdelivr.net/npm/@meteocons/svg-static@0.1.0/fill';

export const CONDITIONS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
};

export const WMO_CODES = Object.keys(CONDITIONS).map(Number);

const DAY_NIGHT_ICONS = {
  0: 'clear',
  1: 'partly-cloudy',
  2: 'partly-cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
};

const FIXED_ICONS = {
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'sleet',
  57: 'sleet',
  66: 'sleet',
  67: 'sleet',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  80: 'rain',
  81: 'rain',
  82: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  85: 'snow',
  86: 'snow',
  95: 'thunderstorms',
  96: 'thunderstorms-extreme',
  99: 'thunderstorms-extreme',
};

export function iconSlug(code, isDay) {
  const fixed = FIXED_ICONS[code];
  if (fixed) return fixed;
  const prefix = DAY_NIGHT_ICONS[code];
  if (prefix) return `${prefix}-${isDay ? 'day' : 'night'}`;
  return 'cloudy';
}

export function iconUrl(code, isDay = true) {
  return `${ICON_BASE}/${iconSlug(code, isDay)}.svg`;
}

export function metaIconUrl(name) {
  return `${ICON_BASE}/${name}.svg`;
}

export function conditionText(code) {
  return CONDITIONS[code] || 'Unknown';
}
