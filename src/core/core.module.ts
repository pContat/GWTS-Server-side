import {Global, Module} from '@nestjs/common';
import {AppLogger} from './logger/logger.service';

@Global()
@Module({
  imports: [],
  providers: [ AppLogger],
  exports: [],
})
export class CoreModule {}
