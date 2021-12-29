import * as Joi from 'joi';

export interface AppConfiguration {
  NODE_ENV: string;
  PORT: string;
  DATABASE_HOST: string;
  DATABASE_NAME: string;
  DATABASE_USER: string;
  DATABASE_ACCESS_KEY: string;
  DATABASE_PORT: string;
  DATABASE_SHOW_SQL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  LOG_LEVEL: string;
  LOCAL_PATH: string;
}

export const validationSchema = Joi.object<AppConfiguration>({
  NODE_ENV: Joi.string()
    .valid(...['development', 'production', 'test'])
    .default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string()
    .valid(...['debug', 'info', 'error', 'warn'])
    .default('info'),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_ACCESS_KEY: Joi.string().required(),
  DATABASE_PORT: Joi.number(),
  DATABASE_SHOW_SQL: Joi.bool().default(false),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  LOCAL_PATH: Joi.string().default('./cache'),
});
