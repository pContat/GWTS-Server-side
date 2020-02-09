import { Module } from '@nestjs/common';
import {ImportService} from "./import.service";
import {CommonModule} from "../common/common.module";
import {GwApiModule} from "../gw-api/gw-api.module";

@Module({
  imports: [CommonModule, GwApiModule],
  providers: [ImportService],
  exports : [ImportService]
})
export class ImportModule {}
