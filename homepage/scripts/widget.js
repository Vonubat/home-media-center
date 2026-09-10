export class Widget {
  #timers = [];

  constructor(root, config) {
    this.root = root;
    this.config = config;
  }

  start() {
    // Subclasses override. Kept public so the widget API stays on the base class.
  }

  stop() {
    this.#timers.forEach((id) => clearInterval(id));
    this.#timers = [];
  }

  every(fn, ms) {
    const id = setInterval(fn, ms);
    this.#timers.push(id);
    return id;
  }

  hide() {
    this.root.hidden = true;
  }

  show() {
    this.root.hidden = false;
  }

  html(markup) {
    this.root.innerHTML = markup;
  }
}
