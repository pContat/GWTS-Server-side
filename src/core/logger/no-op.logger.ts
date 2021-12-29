import { ConsoleLogger, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NoOpLogger extends ConsoleLogger {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  error(message: string, trace: string, context?: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  log(message: any, context?: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  warn(message: any, context?: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  debug(message: string, context?: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  verbose(message: string, context?: string) {}
}
