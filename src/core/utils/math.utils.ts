export class MathUtils {
  static getRandomInt(min = 1, max = 100000): number {
    const ceilMin = Math.ceil(min);
    const ceilMax = Math.floor(max);
    return Math.floor(Math.random() * (ceilMax - ceilMin)) + ceilMin;
  }

  static withDigitPrecision(numberToFormat: number, precision: number): string {
    return Number(numberToFormat).toPrecision(precision);
  }
}
