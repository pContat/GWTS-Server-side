import { Readable } from 'stream';
import { ThirdParty } from '../../common/interface/third-party';

export interface FileInfo {
  uri: string;
  fileName: string;
}

export interface SaveOption {
  isPublic: boolean;
  contentType?: string; // or use mime.lookup(fileName)
}

export interface FileStorageInterface extends ThirdParty {
  // should return Cdn or proxy uri depending on file
  getUri(fileName: string, isPublic: boolean): string;

  deleteFile(fileName: string): Promise<void>;

  saveFileStream(
    fileName: string,
    fileStream: Readable,
    option: SaveOption,
  ): Promise<FileInfo>;

  saveFile(
    fileName: string,
    fileContent: Buffer,
    option: SaveOption,
  ): Promise<FileInfo>;

  doesFileExist(filename: string): Promise<boolean>;

  readFile(filename: string, range?: { start: number; end: number }): Readable;

  getFileContent(fileName: string): Promise<string>;

  getFileName(url: string): string;
}
