class Store<K, V> extends Map<K, V> {
  public ["constructor"]: typeof Store;

  public constructor(entries?: Array<[K, V]>) {
    super(entries);
  }

  public array(): V[] {
    return [...this.values()];
  }

  public keyArray(): K[] {
    return [...this.keys()];
  }

  public first(amount?: number): V | V[] | undefined {
    if (!amount) return this.values().next().value;
    amount = Math.min(this.size, amount);
    const values = this.values();
    return Array.from({ length: amount }, (): V => values.next().value);
  }

  public firstKey(amount?: number): K | K[] | undefined {
    if (!amount) return this.keys().next().value;
    amount = Math.min(this.size, amount);
    const values = this.keys();
    return Array.from({ length: amount }, (): K => values.next().value);
  }

  public last(amount?: number): V | V[] | undefined {
    const arr = this.array();
    if (!amount) return arr[arr.length - 1];
    return arr.slice(-amount);
  }

  public lastKey(amount?: number): K | K[] | undefined {
    const arr = this.keyArray();
    if (!amount) return arr[arr.length - 1];
    return arr.slice(-amount);
  }

  public find(
    fn: (value: V, key: K, collection: this) => boolean,
    thisArg?: unknown
  ): V | undefined {
    if (thisArg) fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }
    return;
  }

  public filter(
    fn: (value: V, key: K, collection: this) => boolean,
    thisArg?: unknown
  ): this {
    if (thisArg) fn = fn.bind(thisArg);
    const results = new this.constructor[Symbol.species]<K, V>() as this;
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }
    return results;
  }

  public map<T>(
    fn: (value: V, key: K, collection: this) => T,
    thisArg?: unknown
  ): T[] {
    if (thisArg) fn = fn.bind(thisArg);
    const iter = this.entries();
    return Array.from(
      { length: this.size },
      (): T => {
        const [key, value] = iter.next().value;
        return fn(value, key, this);
      }
    );
  }

  public some(
    fn: (value: V, key: K, store: this) => boolean,
    thisArg?: unknown
  ): boolean {
    if (thisArg) fn = fn.bind(thisArg);
    for (const [k, v] of this.entries()) if (fn(v, k, this)) return true;
    return false;
  }

  public sort(
    compareFunction: (
      firstValue: V,
      secondValue: V,
      firstKey: K,
      secondKey: K
    ) => number = (x, y): number => Number(x > y) || Number(x === y) - 1
  ): this {
    const entries = [...this.entries()];
    entries.sort((a, b): number => compareFunction(a[1], b[1], a[0], b[0]));

    this.clear();

    for (const [k, v] of entries) {
      this.set(k, v);
    }
    return this;
  }
}

export { Store };
