import { first, includes, isNil, isString, last } from 'lodash';

import {PathLike, readFile, writeFile} from 'fs';

const junkFiles = [
  '.DS_Store',
  '.AppleDouble',
  '.LSOverride',
  'Icon\r',
  '._test',
  '.Spotlight-V100',
  '.Spotlight-V100/Store-V2/C6DBF25D-81D4-4B57-907E-B4A555E72C90/0.directoryStoreFile',
  '.Trashes',
  '__MACOSX',
  'test~',
  'Thumbs.db',
  'ehthumbs.db',
  'Desktop.ini',
  'npm-debug.log',
  '.test.swp',
  '@eaDir',
];

export class FileUtils {
  static async getBase64Data(path: PathLike): Promise<any> {
    const dataFromFile: Buffer = await FileUtils.readFileAsyncWithoutEncode(
      path,
    );
    return dataFromFile.toString('base64');
  }

  static removeExtension(filename: string): string {
    return filename.substr(0, filename.lastIndexOf('.')) || filename;
  }

  static async readFileAsyncWithoutEncode(path: PathLike): Promise<any> {
    return new Promise((resolve, reject) => {
      readFile(path, (err, data: Buffer) => {
        err ? reject(err) : resolve(data);
      });
    });
  }

  static async readFileAsync(path: PathLike): Promise<any> {
    return new Promise((resolve, reject) => {
      readFile(path, { encoding: 'utf8' }, (err, list: string) => {
        err ? reject(err) : resolve(list);
      });
    });
  }

  static isJunkFile(name: string) {
    return name.charAt(0) === '.' || includes(junkFiles, name); // .ds on mac for example
  }

  static getNameWithoutExtension(path: string) {
    return first(path.split('.'));
  }

  static getFileName(filePath: string) {
    return !isNil(filePath) && isString(filePath)
      ? last(filePath.split('/'))
      : undefined;
  }

  static getFileExtension(filename: string) {
    if (!isNil(filename) && isString(filename)) {
      const extension = last(filename.split('.'));
      return extension ? extension.toLowerCase() : undefined;
    }
    return undefined;
  }


  static async createJsonFile(content : any , path : string){
    // stringify JSON Object
    const jsonContent = JSON.stringify(content);

    return new Promise( (resolve, reject) => {
      writeFile(path, jsonContent, 'utf8',  (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    })

  }
}
