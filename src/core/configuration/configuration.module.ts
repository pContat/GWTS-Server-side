import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { isProduction } from '../utils/configuration.utils';
import { ConfigurationService } from './configuration.service';
import { validationSchema } from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      envFilePath: '.env.dev',
      ignoreEnvFile: isProduction(),
      isGlobal: true,
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
