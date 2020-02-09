import { isNil } from 'lodash';
import * as moment from 'moment';

export class DateUtils {
  static isNowBetweenInterval(intervalStart: number, intervalEnd: number) {
    const now = Date.now();
    const endDateValid = isNil(intervalEnd) || intervalEnd > now;
    const startDateValid = isNil(intervalStart) || intervalStart <= now;
    return endDateValid && startDateValid;
  }

  static birthdayLongToString(birthday: number): string | undefined {
    const isLongAgeValid = birthday > 10000000;
    return isLongAgeValid
      ? `${DateUtils.getDayOfBirthdayLong(
          birthday,
        )}/${DateUtils.getMonthOfBirthdayLong(
          birthday,
        )}/${DateUtils.getYearOfBirthdayLong(birthday)}`
      : undefined;
  }

  // format : DD/MM/YYYY
  static birthdayStringToLong(birthday: string) {
    const withoutSeparator = birthday.replace(/\//g, '');
    if (withoutSeparator.length === 8) {
      const rightOrder =
        withoutSeparator.substring(4, 8) +
        withoutSeparator.substring(2, 4) +
        withoutSeparator.substring(0, 2);
      return +rightOrder;
    }
    return null;
  }

  static birthdayLongToAge(birthday: number) {
    const isLongAgeValid = birthday > 10000000;
    return isLongAgeValid
      ? Math.floor((DateUtils.getNowLong() - birthday) / 10000)
      : undefined;
  }

  static getNowLong() {
    const dateObj = new Date();
    const month = dateObj.getUTCMonth() + 1; // months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();

    return Number(`${year}${month}${day}`);
  }

  static jsDateToUnixTimestamp(date: Date): number {
    return moment(date.getTime()).unix();
  }

  static isExpired(timestamp: number) {
    // convert date to integer
    return +Date.now() > timestamp;
  }

  static isSameSecond(date1: Date, date2: Date) {
    // convert date to integer
    return moment(date1).isSame(moment(date2), 'second');
  }

  static getMonthAndYear(date: Date) {
    // convert date to integer
    const mDate = moment(date);
    return mDate.year() + mDate.month();
  }

  private static getMonthOfBirthdayLong(birthday: number): string {
    const birthdayString = String(birthday);
    return birthdayString.substring(4, 6);
  }

  private static getYearOfBirthdayLong(birthday: number): string {
    const birthdayString = String(birthday);
    return birthdayString.substring(0, 4);
  }

  private static getDayOfBirthdayLong(birthday: number): string {
    const birthdayString = String(birthday);
    return birthdayString.substring(6, 8);
  }

  // 2019-02-24
  public static LFormat(date: Date): string {
    return moment(date).format('L');
  }
}
