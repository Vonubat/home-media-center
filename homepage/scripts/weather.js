import { Widget } from './widget.js';
import { conditionText, iconUrl, metaIconUrl, WMO_CODES } from './weather-codes.js';

const REFRESH_MS = 5 * 60 * 1000;

export class WeatherWidget extends Widget {
  start() {
    if (!this.config.weatherEnabled) {
      this.hide();
      return;
    }

    this.show();
    const days = String(this.config.weatherForecastDays);
    const hasSkeleton =
      this.root.querySelector('.weather__forecast') && this.root.dataset.forecastDays === days;
    this.root.dataset.forecastDays = days;
    this.renderOptions = {
      city: this.config.weatherCity,
      timezone: this.config.datetimeTimezone,
      units: this.config.weatherUnits,
    };
    if (!hasSkeleton) {
      this.html(this.#renderSkeletonHtml(this.config.weatherForecastDays));
    }
    this.#load();
  }

  async #load() {
    try {
      await this.#refresh();
    } catch (e) {
      console.warn('weather: failed to load', e);
      this.html(this.#renderUnavailableHtml(this.config.weatherCity, this.config.weatherForecastDays));
    }
    if (!this.#mockCodeFromLocation()) {
      this.every(() => {
        this.#refresh().catch((err) => console.warn('weather: refresh failed', err));
      }, REFRESH_MS);
    }
  }

  #round(value) {
    return Math.round(Number(value));
  }

  #formatSun(iso, timezone) {
    return new Date(iso).toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  #forecastLabel(iso, index, timezone) {
    if (index === 0) return 'Today';
    return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
      timeZone: timezone,
      weekday: 'short',
    });
  }

  #windLabel(speed, units) {
    return units === 'imperial' ? `${this.#round(speed)} mph` : `${this.#round(speed)} kph`;
  }

  #weatherUrl({ latitude, longitude, timezone, units, forecastDays }) {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      timezone,
      temperature_unit: units === 'imperial' ? 'fahrenheit' : 'celsius',
      wind_speed_unit: units === 'imperial' ? 'mph' : 'kmh',
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'weather_code',
        'wind_speed_10m',
        'is_day',
      ].join(','),
      daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset'].join(','),
      forecast_days: String(forecastDays),
    });
    return `https://api.open-meteo.com/v1/forecast?${params}`;
  }

  #metaItem(icon, label, value) {
    return `
      <span class="weather__stat">
        <img src="${metaIconUrl(icon)}" alt="" width="17" height="17" />
        <span class="sr-only">${label}</span>
        ${value}
      </span>
    `;
  }

  #buildMockForecast(code, options = {}) {
    const timezone = options.timezone || 'Europe/Minsk';
    const days = options.forecastDays || 5;
    const isDay = options.isDay !== false;
    const time = [];
    const weather_code = [];
    const temperature_2m_max = [];
    const temperature_2m_min = [];
    const sunrise = [];
    const sunset = [];
    const start = new Date('2026-09-10T12:00:00Z');

    for (let i = 0; i < days; i += 1) {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + i);
      const iso = day.toISOString().slice(0, 10);
      time.push(iso);
      weather_code.push(code);
      temperature_2m_max.push(19 - i);
      temperature_2m_min.push(11 - i);
      sunrise.push(`${iso}T06:34:00`);
      sunset.push(`${iso}T19:39:00`);
    }

    return {
      timezone,
      current: {
        temperature_2m: 12,
        apparent_temperature: 10,
        relative_humidity_2m: 93,
        weather_code: code,
        wind_speed_10m: 14,
        is_day: isDay ? 1 : 0,
      },
      daily: {
        time,
        weather_code,
        temperature_2m_max,
        temperature_2m_min,
        sunrise,
        sunset,
      },
    };
  }

  #escape(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  #layoutHtml(hero, now, forecast) {
    return `${hero}<div class="weather__now">${now}</div><div class="weather__forecast">${forecast}</div>`;
  }

  #dayHtml(date, index, daily, timezone) {
    return `
      <div class="weather__day">
        <img src="${iconUrl(daily.weather_code[index], true)}" alt="" width="42" height="42" />
        <div class="weather__day-name">${this.#forecastLabel(date, index, timezone)}</div>
        <div class="weather__range">
          <span class="weather__high">${this.#round(daily.temperature_2m_max[index])}°</span>
          <span class="weather__low">${this.#round(daily.temperature_2m_min[index])}°</span>
        </div>
      </div>
    `;
  }

  #nowHtml({ city, temp, feels, condition, meta }) {
    return `
      <div class="weather__city">${city}</div>
      <div class="weather__temps">
        <span class="weather__temp">${temp}</span>
        <span class="weather__feels">${feels}</span>
      </div>
      <div class="weather__cond">${condition}</div>
      <div class="weather__meta">${meta}</div>
    `;
  }

  #renderWeatherHtml(data, options) {
    const current = data.current;
    const daily = data.daily;
    const code = current.weather_code;
    const timezone = options.timezone;
    const days = daily.time.map((date, i) => this.#dayHtml(date, i, daily, timezone)).join('');

    return this.#layoutHtml(
      `<img class="weather__hero" src="${iconUrl(code, current.is_day === 1)}" alt="" width="104" height="104" />`,
      this.#nowHtml({
        city: this.#escape(options.city),
        temp: `${this.#round(current.temperature_2m)}°`,
        feels: `/ Feels like ${this.#round(current.apparent_temperature)}°`,
        condition: conditionText(code),
        meta: [
          this.#metaItem('wind', 'Wind', this.#windLabel(current.wind_speed_10m, options.units)),
          this.#metaItem('humidity', 'Humidity', `${this.#round(current.relative_humidity_2m)}%`),
          this.#metaItem('sunrise', 'Sunrise', this.#formatSun(daily.sunrise[0], timezone)),
          this.#metaItem('sunset', 'Sunset', this.#formatSun(daily.sunset[0], timezone)),
        ].join(''),
      }),
      days,
    );
  }

  #skeletonDayHtml() {
    return `
      <div class="weather__day">
        <div class="skel weather__skel--icon"></div>
        <div class="weather__day-name"><div class="skel weather__skel--label"></div></div>
        <div class="weather__range"><div class="skel weather__skel--range"></div></div>
      </div>
    `;
  }

  #skeletonMetaHtml() {
    return Array.from(
      { length: 4 },
      () => '<span class="weather__stat"><span class="skel weather__skel--stat"></span></span>',
    ).join('');
  }

  #forecastSkeletonHtml(forecastDays) {
    return Array.from({ length: forecastDays }, () => this.#skeletonDayHtml()).join('');
  }

  #renderSkeletonHtml(forecastDays) {
    return this.#layoutHtml(
      '<div class="weather__hero skel weather__skel--hero"></div>',
      this.#nowHtml({
        city: '<div class="skel weather__skel--city"></div>',
        temp: '<span class="skel weather__skel--temp"></span>',
        feels: '<span class="skel weather__skel--feels"></span>',
        condition: '<div class="skel weather__skel--cond"></div>',
        meta: this.#skeletonMetaHtml(),
      }),
      this.#forecastSkeletonHtml(forecastDays),
    );
  }

  #renderUnavailableHtml(city, forecastDays) {
    return this.#layoutHtml(
      '<div class="weather__hero weather__hero--empty"></div>',
      this.#nowHtml({
        city: this.#escape(city),
        temp: '–',
        feels: '<span class="weather__feels--empty"></span>',
        condition: 'Weather unavailable',
        meta: this.#skeletonMetaHtml(),
      }),
      this.#forecastSkeletonHtml(forecastDays),
    );
  }

  async #geocodeCity(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`geocode ${res.status}`);
    }
    const data = await res.json();
    const hit = data.results?.[0];
    if (!hit) {
      throw new Error(`geocode: no results for ${city}`);
    }
    return {
      latitude: hit.latitude,
      longitude: hit.longitude,
      timezone: hit.timezone,
    };
  }

  #mockCodeFromLocation() {
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('weatherMock');
    if (raw == null || raw === '') return null;
    const code = Number(raw);
    return WMO_CODES.includes(code) ? code : null;
  }

  async #location() {
    if (this.config.weatherLatitude && this.config.weatherLongitude) {
      return {
        latitude: this.config.weatherLatitude,
        longitude: this.config.weatherLongitude,
        timezone: this.config.datetimeTimezone,
      };
    }
    const geo = await this.#geocodeCity(this.config.weatherCity);
    return {
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: this.config.datetimeTimezone || geo.timezone,
    };
  }

  async #refresh() {
    const mockCode = this.#mockCodeFromLocation();
    if (mockCode != null) {
      this.html(
        this.#renderWeatherHtml(
          this.#buildMockForecast(mockCode, {
            timezone: this.config.datetimeTimezone,
            forecastDays: this.config.weatherForecastDays,
          }),
          this.renderOptions,
        ),
      );
      return;
    }

    const loc = await this.#location();
    this.renderOptions.timezone = loc.timezone;
    const res = await fetch(
      this.#weatherUrl({
        latitude: loc.latitude,
        longitude: loc.longitude,
        timezone: loc.timezone,
        units: this.config.weatherUnits,
        forecastDays: this.config.weatherForecastDays,
      }),
    );
    if (!res.ok) {
      throw new Error(`open-meteo ${res.status}`);
    }
    this.html(this.#renderWeatherHtml(await res.json(), this.renderOptions));
  }
}
