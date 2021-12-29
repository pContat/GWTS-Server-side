import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';
import { AppConfiguration } from '../configuration/configuration';

@Injectable()
export class AppLogger extends ConsoleLogger {
  private winstonLogger: WinstonLogger;

  constructor(private readonly confService: ConfigService<AppConfiguration>) {
    super();

    const errorStackFormat = format(info => {
      if (info.stack) {
        // eslint-disable-next-line no-param-reassign
        info.message = `${info.message} ${info.stack}`;
      }
      return info;
    });

    this.winstonLogger = createLogger({
      level: this.confService.get('LOG_LEVEL'),
      format: format.combine(
        errorStackFormat(),
        format.colorize(),
        format.simple(),
      ),
      transports: [new transports.Console({ handleExceptions: true })],
      exitOnError: false,
    });
  }

  get morganOption() {
    return {
      stream: {
        write: (message: string) => this.log(message.trim()),
      },
      skip: (req: Request, res: Response) => {
        return req.originalUrl.includes('ping') || res.statusCode < 400;
      },
    };
  }

  error(message: string, trace: string, context?: string) {
    this.winstonLogger.error(this.addContext(context, message), trace);
  }

  log(message: any, context?: string) {
    this.winstonLogger.info(this.addContext(context, message));
  }

  warn(message: any, context?: string) {
    this.winstonLogger.warn(this.addContext(context, message));
  }

  debug(message: string, context?: string) {
    this.winstonLogger.debug(this.addContext(context, message));
  }

  verbose(message: string, context?: string) {
    this.winstonLogger.verbose(this.addContext(context, message));
  }

  private addContext = (scope: string | undefined, message: string): string => {
    const now = DateTime.now().toLocaleString(
      DateTime.DATETIME_SHORT_WITH_SECONDS,
    );

    return scope
      ? `${now} [\x1b[33m${scope}\x1b[0m] ${message}`
      : `${now} ${message}`;
  };
}
