import { Module } from '@nestjs/common';
import { ConfigurationModule } from './core/configuration/configuration.module';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './core/database/database.module';
import { LoggerModule } from './core/logger/logger.module';
import { ImportModule } from './feature/business-import/import.module';
import { SearchModule } from './feature/business-search/search.module';

@Module({
  imports: [
    CoreModule,
    ConfigurationModule,
    LoggerModule,
    DatabaseModule,
    ImportModule,
    SearchModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
