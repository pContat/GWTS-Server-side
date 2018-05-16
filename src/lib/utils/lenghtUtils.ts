import {maxBy} from "lodash";

/**
 * Return the highest byte length in a set of document
 */
export function maxByteLength(data: any[]): number {
  let max = 0;
  if (data[0] instanceof Buffer) {
    const maxElement = maxBy(data, (e: Buffer) => e.byteLength) as Buffer;
    max = maxElement.byteLength;
  } else {
    const maxElement = maxBy(data, e => e.length) as string;
    max = Buffer.byteLength(maxElement);
  }
  return max;
}

export function byteLength(data: any): number {
  return data instanceof Buffer ? data.byteLength : Buffer.byteLength(data);
}

export function objectByteLength(data: any): number {
  const stringContent: string = JSON.stringify(data);
  return Buffer.byteLength(stringContent);
}

