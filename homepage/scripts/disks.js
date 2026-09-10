import { Widget } from './widget.js';
import { driveLetter } from './config.js';

const REFRESH_MS = 30_000;

export class DisksWidget extends Widget {
  start() {
    this.volumes = this.config.disks || [];
    if (!this.volumes.length) {
      this.hide();
      return;
    }

    this.show();
    this.html(this.#renderPlaceholderHtml(this.volumes.length));
    this.#load();
  }

  async #load() {
    try {
      await this.#refresh();
    } catch (e) {
      console.warn('disks: failed to load', e);
      this.html(this.#renderUnavailableHtml());
    }
    this.every(() => {
      this.#refresh().catch((err) => console.warn('disks: refresh failed', err));
    }, REFRESH_MS);
  }

  #iconHtml() {
    return `
      <svg class="disk__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 3v2h16V8H4zm13.25 7.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z"/>
      </svg>
    `;
  }

  #idHtml(letter) {
    return `<span class="disk__id">${this.#iconHtml()}<span class="disk__letter">${letter}</span></span>`;
  }

  #formatFreeOf(available, size) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let total = Number(size);
    while (total >= 1024 && unitIndex < units.length - 1) {
      total /= 1024;
      unitIndex += 1;
    }
    const free = Number(available) / 1024 ** unitIndex;
    const roundValue = (value) =>
      value >= 10 || unitIndex === 0 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${roundValue(free)}/${roundValue(total)} ${units[unitIndex]} free`;
  }

  #renderPlaceholderHtml(count) {
    return Array.from({ length: Math.max(count, 1) }, () => `
      <div class="disk disk--empty">
        <div class="disk__row">
          ${this.#idHtml('')}
          <span class="disk__pct"></span>
        </div>
        <div class="disk__bar"></div>
        <div class="disk__amount"></div>
      </div>
    `).join('');
  }

  #escape(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  #renderChipHtml(disk) {
    const letter = this.#escape(disk.letter);
    return `
      <div class="disk" title="${letter}: ${disk.percent}% used">
        <div class="disk__row">
          ${this.#idHtml(letter)}
          <span class="disk__pct">${disk.percent}%</span>
        </div>
        <div class="disk__bar" aria-hidden="true">
          <div class="disk__bar-fill" style="width:${disk.percent}%"></div>
        </div>
        <div class="disk__amount">${disk.freeLabel}</div>
      </div>
    `;
  }

  #renderUnavailableHtml() {
    return `
      <div class="disk disk--empty">
        <div class="disk__row">
          ${this.#idHtml('–')}
          <span class="disk__pct">–</span>
        </div>
        <div class="disk__amount">Disks unavailable</div>
      </div>
    `;
  }

  #parseDrive(payload) {
    const drive = payload?.drive;
    const size = Number(drive?.size);
    const available = Number(drive?.available);
    if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(available)) {
      return null;
    }
    const used = Math.max(0, size - available);
    return {
      percent: Math.min(100, Math.max(0, Math.round((used / size) * 100))),
      freeLabel: this.#formatFreeOf(available, size),
    };
  }

  #dedupeDisks(disks) {
    const seen = new Map();
    for (const disk of disks) {
      if (!seen.has(disk.letter)) {
        seen.set(disk.letter, disk);
      }
    }
    return [...seen.values()];
  }

  async #fetchDisk(mount) {
    const res = await fetch(`/api/widgets/resources?type=disk&target=${encodeURIComponent(mount)}`);
    if (!res.ok) {
      throw new Error(`disk ${mount} ${res.status}`);
    }
    return res.json();
  }

  async #refresh() {
    const results = await Promise.all(
      this.volumes.map(async (volume) => {
        try {
          const payload = await this.#fetchDisk(volume.mount);
          if (payload?.error) return null;
          const stats = this.#parseDrive(payload);
          if (!stats) return null;
          return {
            letter: driveLetter(volume.hostPath) || '?',
            ...stats,
          };
        } catch (e) {
          console.warn('disks: skip', volume.mount, e);
          return null;
        }
      }),
    );
    const disks = this.#dedupeDisks(results.filter(Boolean));
    if (!disks.length) {
      throw new Error('no disk stats');
    }
    this.html(disks.map((disk) => this.#renderChipHtml(disk)).join(''));
  }
}
