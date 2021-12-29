import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './feature/business-search/search.module';
import { ImportModule } from './feature/business-import/import.module';
import { ConfigurationModule } from './core/configuration/configuration.module';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './core/database/database.module';
import { LoggerModule } from './core/logger/logger.module';

@Module({
  imports: [
    CoreModule,
    ConfigurationModule,
    LoggerModule,
    DatabaseModule,
    ImportModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
