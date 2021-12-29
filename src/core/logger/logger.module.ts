
import { Module } from '@nestjs/common';
import { AppLogger } from './winston.logger';


@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
