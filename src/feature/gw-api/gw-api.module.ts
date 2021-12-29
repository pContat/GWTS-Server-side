import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GWApiService } from './gw-http-api.service';
import { HTTPPoolExecutor } from './http-pool-executor';

@Module({
  imports: [
    HttpModule.register({
      timeout: 4000,
      maxRedirects: 5,
    }),
  ],
  providers: [GWApiService, HTTPPoolExecutor],
  exports: [GWApiService],
})
export class GwApiModule {}
