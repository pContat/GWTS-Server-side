import { ObjectionModule } from '@willsoto/nestjs-objection';
import { Module } from '@nestjs/common';
import { MigrationsService } from './services/migration.service';
import {ConfigService} from "../core/config/config.service";

@Module({
  imports: [
    ObjectionModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        return {
          config: {
            ...config.databaseConfiguration
          }
        };
      }
    })
  ],
  exports: [ObjectionModule, MigrationsService],
  providers: [MigrationsService]
})
export class DatabaseModule {}
