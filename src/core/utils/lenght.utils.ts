import { maxBy } from 'lodash';

export class LengthUtils {
  /**
   * Return the highest byte length in a set of document
   */
  static maxByteLength(data: any[]): number {
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

  static byteLength(data: any): number {
    return data instanceof Buffer ? data.byteLength : Buffer.byteLength(data);
  }

  static objectByteLength(data: any): number {
    const stringContent: string = JSON.stringify(data);
    return Buffer.byteLength(stringContent);
  }
}
