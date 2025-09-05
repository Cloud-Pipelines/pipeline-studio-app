interface TypedStorage<
  TKeys extends string,
  TMapping extends Record<TKeys, unknown>,
> {
  setItem<TKey extends TKeys>(key: TKey, value: TMapping[TKey]): void;
  getItem<TKey extends TKeys>(key: TKey): TMapping[TKey] | null;
}

type EncoderDecoder<
  TKeys extends string,
  TMapping extends Record<TKeys, unknown>,
> = {
  encode: (value: TMapping[TKeys]) => string;
  decode: <TKey extends TKeys>(value: string) => TMapping[TKey];
};

export function getStorage<
  TKeys extends string,
  TMapping extends Record<TKeys, unknown>,
>(
  encoderDecoder: EncoderDecoder<TKeys, TMapping> = {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
): TypedStorage<TKeys, TMapping> {
  return {
    setItem(key, value) {
      try {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, encoderDecoder.encode(value));
        }

        /**
         * On localStoage.setItem, the storage event is only triggered on other tabs and windows.
         * So we manually dispatch a storage event to trigger the subscribe function on the current window as well.
         */
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: encoderDecoder.encode(value),
          }),
        );
      } catch {
        // Ignore if storage restriction error
      }
    },
    getItem<TKey extends TKeys>(key: TKey): TMapping[TKey] | null {
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          return encoderDecoder.decode(storedValue);
        }
      } catch {
        // Ignore if storage restriction or parsing error
      }
      return null;
    },
  };
}
