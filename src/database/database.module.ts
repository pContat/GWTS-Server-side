import { Module } from '@nestjs/common';
import { ObjectionModule } from '@willsoto/nestjs-objection';
import { ConfigurationModule } from '../core/configuration/configuration.module';
import { ConfigurationService } from '../core/configuration/configuration.service';
import { BaseModel } from './models/base.model';
import { MigrationsService } from './services/migration.service';

@Module({
  imports: [
    ObjectionModule.registerAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory(config: ConfigurationService) {
        return {
          // You can specify a custom BaseModel
          // If none is provided, the default Model will be used
          // https://vincit.github.io/objection.js/#models
          Model: BaseModel,
          config: {
            ...config.databaseConfiguration,
          },
        };
      },
    }),
  ],
  exports: [ObjectionModule, MigrationsService],
  providers: [MigrationsService],
})
export class DatabaseModule {}
