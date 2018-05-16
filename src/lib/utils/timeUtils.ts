import logger from "../logger/logger";

export const green = "\u001b[42m \u001b[0m";
export const red = "\u001b[41m \u001b[0m";


export function clock(start?: any) {
  if (!start) {
    return process.hrtime();
  }
  const end = process.hrtime(start);
  return Math.round(end[0] * 1000 + end[1] / 1000000);
}

/**
 * Async timeout
 */
export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function timeFunction(callback: Function, params: any) {
  const start = clock();
  const result = callback(params);
  const end = clock(start);
  logger.info(`time to execute function  ${callback.name} : ${end} `);
  return result;
}

export async function timeAsyncFunction(callback: Function, params: any) {
  const start = clock();
  const result = await callback(params);
  const end = clock(start);
  logger.info(`time to execute function  ${callback.name} : ${end} `);
  return result;
}


export function isSpecial(str: string) {
  return /[~`!#$%\()^&_.*+=°\\[\]\\';,/{}|\\":<>\?]/g.test(str);
}

export function getRandomInt(min = 1, max = 100000): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

export function millisToMinutesAndSeconds(millis: number): string {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  const padding = seconds < "10" ? "0" : "";
  return `${minutes}:${padding}${seconds} min`;
}



