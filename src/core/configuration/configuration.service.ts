import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import * as config from '../../../knexfile';
import { isProduction } from '../../common/utils/configuration.utils';
import { AppConfiguration } from './configuration';

export type LoggerLevel = 'debug' | 'info' | 'error' | 'warn';

@Injectable()
export class ConfigurationService extends ConfigService<AppConfiguration> {
  get webPort(): number {
    return Number(this.get('PORT'));
  }

  get logLevel(): LoggerLevel {
    return this.get('LOG_LEVEL') as LoggerLevel;
  }

  get databaseConfiguration(): Knex.Config {
    return isProduction() ? config.production : config.development;
  }
}
