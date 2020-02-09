import { pseudoRandomBytes } from 'crypto';
import { isArray } from 'lodash';
import { camelCase } from 'lodash';

export class StringUtils {
  static isSpecial(str: string) {
    return /[~`!#$%()^&_.*+=°\\[\]\\';,/{}|\\":<>?]/g.test(str);
  }

  static getRandomName() {
    const raw = pseudoRandomBytes(16);
    return raw.toString('hex') + Date.now();
  }

  static stringify(json: any, fieldName: string) {
    if (json != null && isArray(json[fieldName])) {
      json[fieldName] = JSON.stringify(json[fieldName]);
    }
    return json;
  }

  static snakeToCamel(snakeCaseString: string) {
    return camelCase(snakeCaseString);
  }
}
