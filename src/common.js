'use strict';

export function pickAndRename(object, mapping) {
  let result = {};
  if (object == null) return result;
  for (let oldKey in mapping) {
    if (mapping.hasOwnProperty(oldKey) && oldKey in object) {
      let newKey = mapping[oldKey];
      result[newKey] = object[oldKey];
    }
  }
  return result;
}
