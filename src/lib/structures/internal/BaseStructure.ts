/* eslint-disable */
// @ts-nocheck

class BaseStructure {
  public _parseOptionalData(this: any, data: any): Record<string, any> {
    const bucket = {};
    for (const key of Object.keys(data)) {
      if (typeof this[key] !== "undefined" && this[key] !== null) continue;
      if (typeof data[key] !== "undefined" && data[key] !== null)
        bucket[key] = data[key];
      continue;
    }
    return bucket;
  }
}

export { BaseStructure };
