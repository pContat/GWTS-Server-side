import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './business-search/search.module';
import { ImportModule } from './businness-import/import.module';
import { ConfigModule } from './core/config/config.module';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    CoreModule,
    ConfigModule,
    DatabaseModule,
    ImportModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
