import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { GwApiModule } from '../gw-api/gw-api.module';
import { ImportService } from './import.service';

@Module({
  imports: [CommonModule, GwApiModule],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
