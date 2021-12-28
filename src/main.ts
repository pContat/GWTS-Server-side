import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DealFinder } from './business-search/service/deal-finder.service';
import { ImportService } from './businness-import/import.service';
import { ConfigService } from './core/config/config.service';
import { AppLogger } from './core/logger/logger.service';
import { MigrationsService } from './database/services/migration.service';
import morgan = require('morgan');

async function bootstrap() {
  const appOptions: NestApplicationOptions = {
    logger: console, // by the time nest is bootstrapping
  };
  const app = await NestFactory.create(AppModule, appOptions);

  const configurationService = app.get(ConfigService);
  const appLogger = app.get(AppLogger);
  const morganFormat = configurationService.isProduction ? 'combined' : 'dev';
  app.use(morgan(morganFormat, appLogger.morganOption));
  app.useLogger(appLogger);

  // update the db if required
  const migrationService = app.get(MigrationsService);
  await migrationService.migrate();

  const importService = app.get(ImportService);
  if (await importService.requiredImport()) {
    appLogger.log('required import');
    await importService.importItems();
    appLogger.log(`import done`);
  }

  // todo : comment that
  const dealService = app.get(DealFinder);
  await dealService.findDeal();

  await app.listen(configurationService.expressPort);
}

(async () => {
  try {
    await bootstrap();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
