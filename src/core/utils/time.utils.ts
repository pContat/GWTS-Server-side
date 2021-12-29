export const green = '\u001b[42m \u001b[0m';
export const red = '\u001b[41m \u001b[0m';

export class TimeUtils {
  static clock(start?: any) {
    if (!start) {
      return process.hrtime();
    }
    const end = process.hrtime(start);
    return Math.round(end[0] * 1000 + end[1] / 1000000);
  }

  /**
   * Async timeout
   */
  static wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static millisToMinutesAndSeconds(millis: number): string {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    const padding = seconds < '10' ? '0' : '';
    return `${minutes}:${padding}${seconds} min`;
  }
}
