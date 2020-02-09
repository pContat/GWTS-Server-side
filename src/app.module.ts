import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {CoreModule} from "./core/core.module";
import {ImportModule} from "./businness-import/import.module";
import {DatabaseModule} from "./database/database.module";
import {ConfigModule} from "./core/config/config.module";

@Module({
  imports: [CoreModule,ConfigModule, DatabaseModule,ImportModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
