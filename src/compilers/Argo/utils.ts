/**
 * @license
 * Copyright 2022 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2022 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

export function assertDefined<T>(obj: T | undefined) {
  if (obj === undefined) {
    throw TypeError("Object is undefined");
  }
  return obj;
}

export function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}
