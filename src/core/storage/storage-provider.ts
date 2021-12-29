import { isProduction } from '../../common/utils/configuration.utils';
import { LocalStorage } from './local/local-storage.service';

export const apiStorage = 'STORAGE_INTERFACE';

export const storageProvider = {
  provide: apiStorage,
  useClass: isProduction() ? LocalStorage : LocalStorage,
};
