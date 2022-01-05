import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { isProduction } from './common/utils/configuration.utils';
import { ConfigurationService } from './core/configuration/configuration.service';
import { MigrationsService } from './core/database/services/migration.service';
import { AppLogger } from './core/logger/winston.logger';
import { FileStorageInterface } from './core/storage/file-storage.interface';
import { apiStorage } from './core/storage/storage-provider';
import { ImportService } from './feature/business-import/import.service';
import { DealFinder } from './feature/business-search/service/deal/deal-finder.service';
import morgan = require('morgan');

async function bootstrap() {
  const appOptions: NestApplicationOptions = {
    logger: console,
  };
  const app = await NestFactory.create(AppModule, appOptions);

  const configurationService = app.get(ConfigurationService);
  const appLogger = app.get(AppLogger);
  const morganFormat = isProduction() ? 'combined' : 'dev';
  app.use(morgan(morganFormat, appLogger.morganOption));
  app.useLogger(appLogger);

  // update the db if required
  const migrationService = app.get(MigrationsService);
  await migrationService.migrate();

  await app.listen(configurationService.webPort);

  const importService = app.get(ImportService);
  if (await importService.requiredImport()) {
    appLogger.warn(
      'empty database detected, process to import Guild Wars database',
    );
    await importService.importItems();
    appLogger.log(`import done`);
  }

  const dealService = app.get(DealFinder);
  const fileStorage = app.get<FileStorageInterface>(apiStorage);
  const deal = await dealService.findDeal();
  await fileStorage.saveFile(
    `./export_${new Date()}.json`,
    Buffer.from(JSON.stringify(deal)),
    {
      isPublic: true,
    },
  );
}

(async () => {
  try {
    await bootstrap();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
