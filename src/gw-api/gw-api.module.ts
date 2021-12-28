import { HttpModule, Module } from '@nestjs/common';
import { GWApiService } from './gw-http-api.service';

@Module({
  imports: [HttpModule],
  providers: [GWApiService],
  exports: [GWApiService],
})
export class GwApiModule {}
