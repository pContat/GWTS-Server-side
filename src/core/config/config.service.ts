import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import { Config } from 'knex';
import * as config from '../../../knexfile';

export interface EnvConfig {
  [key: string]: string;
}

export type LoggerLevel = 'debug' | 'info' | 'error' | 'warn';

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor() {
    if (!this.isProduction) {
      const result = dotenv.config({ path: '.env.dev' });
      if (result.error) {
        throw result.error;
      }
    }
    this.envConfig = this.validateInput(process.env);
  }

  get expressPort(): number {
    return Number(this.envConfig.PORT);
  }

  get baseUrl(): string {
    return this.envConfig.BASE_URL;
  }

  get secret(): string {
    return this.envConfig.SECRET;
  }

  get databaseConfiguration(): Config {
    return this.isProduction ? config.production : config.development;
  }

  get corsConfiguration() {
    return {
      credentials: true,
      origin: [this.get('CORS_HOST')],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders:
        'Content-type,Accept,Authorization,Set-Cookie,x-xsrf-token',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  get isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  get logLevel(): LoggerLevel {
    return this.envConfig.LOG_LEVEL as LoggerLevel;
  }

  get(key: string): string {
    return this.envConfig[key];
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid(['development', 'production', 'test', 'provision'])
        .default('development'),
      PORT: Joi.number().default(3000),
      LOG_LEVEL: Joi.string()
        .valid(['debug', 'info', 'error', 'warn'])
        .default('info'),
      SECRET: Joi.string().required(),
      BASE_URL: Joi.string().required(),
      CORS_HOST: Joi.string().required(),
      DATABASE_HOST: Joi.string()
        .ip()
        .required(),
      DATABASE_NAME: Joi.string().required(),
      DATABASE_USER: Joi.string().required(),
      DATABASE_ACCESS_KEY: Joi.string().required(),
      DATABASE_PORT: Joi.number(),
    }).options({ stripUnknown: true });

    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
    );
    if (error) {
      console.log(`Config validation error: ${error.message}`);
      // throw is catch on service creation
      process.exit(1);
    }
    return validatedEnvConfig;
  }
}
