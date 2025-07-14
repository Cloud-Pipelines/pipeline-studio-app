interface TypedStorage<
  TKeys extends string,
  TMapping extends Record<TKeys, unknown>,
> {
  setItem<TKey extends TKeys>(key: TKey, value: TMapping[TKey]): void;
  getItem<TKey extends TKeys>(key: TKey): TMapping[TKey];
}

export function getStorage<
  TKeys extends string,
  TMapping extends Record<TKeys, unknown>,
>(): TypedStorage<TKeys, TMapping> {
  return {
    setItem(key, value) {
      try {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }

        /**
         * On localStoage.setItem, the storage event is only triggered on other tabs and windows.
         * So we manually dispatch a storage event to trigger the subscribe function on the current window as well.
         */
        window.dispatchEvent(
          new StorageEvent("storage", { key, newValue: JSON.stringify(value) }),
        );
      } catch {
        // Ignore if storage restriction error
      }
    },
    getItem(key) {
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          return JSON.parse(storedValue);
        }
      } catch {
        // Ignore if storage restriction or parsing error
      }
      return null;
    },
  };
}
