function safeJSONParse(str, defaultValue) {
  try {
    return JSON.parse(str);
  } catch {
    console.warn('Failed to parse JSON:', str);
    return defaultValue;
  }
}

function isQuotaExceededError(err) {
  return (
    err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

export class StorageAdapter {
  constructor(storage, keys) {
    this.storage = storage;
    this.keys = keys;
  }

  #clearAll() {
    Object.values(this.keys).forEach((key) => {
      this.storage.removeItem(key);
    });
    return this;
  }

  set(name, value) {
    const key = this.keys[name];
    const encoded = JSON.stringify(value);
    try {
      this.storage.setItem(key, encoded);
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        console.warn('Storage error:', error);
        return this;
      }
      this.#clearAll();
      try {
        this.storage.setItem(key, encoded);
      } catch (retryError) {
        console.warn('Storage error:', retryError);
      }
    }
    return this;
  }

  delete(name) {
    this.storage.removeItem(this.keys[name]);
    return this;
  }

  get(name, defaultValue = null) {
    const item = this.storage.getItem(this.keys[name]);
    return item ? safeJSONParse(item, defaultValue) : defaultValue;
  }
}
