import { Widget } from './widget.js';

export class ClockWidget extends Widget {
  start() {
    if (!this.config.clockEnabled && !this.config.dateEnabled) {
      this.hide();
      return;
    }

    this.show();
    const bootTimer = Number(this.root.dataset.bootTimer);
    if (bootTimer) {
      clearInterval(bootTimer);
      delete this.root.dataset.bootTimer;
    }
    if (!this.root.querySelector('.clock__time') && !this.root.querySelector('.clock__date')) {
      this.html(`
        ${this.config.clockEnabled ? '<div class="clock__time"></div>' : ''}
        ${this.config.dateEnabled ? '<div class="clock__date"></div>' : ''}
      `);
    }
    this.timeEl = this.config.clockEnabled ? this.root.querySelector('.clock__time') : null;
    this.dateEl = this.config.dateEnabled ? this.root.querySelector('.clock__date') : null;
    this.#tick();
    this.every(() => this.#tick(), this.config.clockShowSeconds ? 1000 : 30_000);
  }

  #pad(n) {
    return String(n).padStart(2, '0');
  }

  #formatTime(date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: this.config.datetimeTimezone,
      hour: '2-digit',
      minute: '2-digit',
      second: this.config.clockShowSeconds ? '2-digit' : undefined,
      hour12: this.config.clockHour12,
    }).formatToParts(date);

    const get = (type) => parts.find((p) => p.type === type)?.value || '00';
    const hour = get('hour');
    const minute = get('minute');
    const second = get('second');
    const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value;

    let text = this.config.clockShowSeconds
      ? `${this.#pad(hour)}:${this.#pad(minute)}:${this.#pad(second)}`
      : `${this.#pad(hour)}:${this.#pad(minute)}`;
    if (this.config.clockHour12 && dayPeriod) {
      text += ` ${dayPeriod.toUpperCase()}`;
    }
    return text;
  }

  #formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.config.datetimeTimezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  #tick() {
    const now = new Date();
    if (this.timeEl) this.timeEl.textContent = this.#formatTime(now);
    if (this.dateEl) this.dateEl.textContent = this.#formatDate(now);
  }
}
