import { Logger } from '@nestjs/common';

export interface ThirdParty {
  isHealthy(): Promise<boolean>;
  readonly logger: Logger;
}
