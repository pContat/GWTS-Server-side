import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { F_OK } from 'constants';
import {
  access,
  createReadStream,
  createWriteStream,
  mkdir,
  readFile,
  unlink,
  writeFile,
} from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { AppConfiguration } from '../../configuration/configuration';
import {
  FileInfo,
  FileStorageInterface,
  SaveOption,
} from '../file-storage.interface';

@Injectable()
export class LocalStorage implements FileStorageInterface {
  readonly basePath: string;

  readonly logger = new Logger(LocalStorage.name);

  constructor(private configurationService: ConfigService<AppConfiguration>) {
    this.basePath = configurationService.get('LOCAL_PATH');
    this.isHealthy()
      .then(() => this.logger.log('File Storage healthy'))
      .catch(() => {
        this.logger.error('Dependency is not healthy');
      });
  }

  async isHealthy(): Promise<boolean> {
    const exist = await new Promise<boolean>(resolve => {
      access(this.basePath, F_OK, err => {
        err ? resolve(false) : resolve(true);
      });
    });
    if (!exist) {
      mkdir(this.basePath, _ => {
        throw new Error('storage folder does not exist');
      });
    }
    return exist;
  }

  async deleteFile(fileName: string): Promise<void> {
    const path = this.getPath(fileName);
    return new Promise((resolve, reject) => {
      unlink(path, err => {
        err ? reject(err) : resolve();
      });
    });
  }

  async doesFileExist(fileName: string): Promise<boolean> {
    const path = this.getPath(fileName);
    return new Promise(resolve => {
      access(path, F_OK, err => {
        err ? resolve(false) : resolve(true);
      });
    });
  }

  // will return http://localhost:4000/local/${fileName}
  getUri(fileName: string, isPublic: boolean): string {
    return `${fileName}`;
  }

  private getPath(fileName: string): string {
    return join(this.basePath, fileName);
  }

  public getFileName(url: string): string {
    return url;
  }

  readFile(fileName: string, range?: { start: number; end: number }): Readable {
    const path = this.getPath(fileName);
    const option = range ? { start: range.start, end: range.end } : {};
    return createReadStream(path, option);
  }

  async getFileContent(fileName: string): Promise<string> {
    const path = await this.getPath(fileName);
    return new Promise((resolve, reject) => {
      readFile(path, { encoding: 'utf8' }, (err, fileContent: string) => {
        err ? reject(err) : resolve(fileContent);
      });
    });
  }

  async saveFileStream(
    fileName: string,
    fileStream: Readable,
    option: { isPublic: true; contentType?: string },
  ): Promise<FileInfo> {
    const path = await this.getPath(fileName);
    return new Promise((resolve, reject) => {
      fileStream
        .pipe(createWriteStream(path, { flags: 'w' }))
        .on('close', () => {
          resolve({
            uri: this.getUri(fileName, option.isPublic),
            fileName,
          });
        })
        .on('error', reject);
    });
  }

  async saveFile(
    fileName: string,
    fileContent: Buffer,
    option: SaveOption,
  ): Promise<FileInfo> {
    const path = await this.getPath(fileName);
    return new Promise((resolve, reject) => {
      writeFile(path, fileContent, { flag: 'w' }, err => {
        if (err) {
          reject(err);
        } else {
          resolve({
            uri: this.getUri(fileName, option.isPublic),
            fileName,
          });
        }
      });
    });
  }
}
