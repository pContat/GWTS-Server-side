import { Inject, Injectable, Logger } from '@nestjs/common';
import { Connection, KNEX_CONNECTION } from '@willsoto/nestjs-objection';

@Injectable()
export class MigrationsService {
  private readonly logger = new Logger(MigrationsService.name);

  constructor(@Inject(KNEX_CONNECTION) public connection: Connection) {}

  async migrate() {
    this.logger.log('database migration start');
    await this.connection.migrate.latest();
    this.logger.log('database migration success');
  }

  async rollback() {
    this.logger.log('database rollback start');
    await this.connection.migrate.rollback();
    this.logger.log('database rollback success');
  }

  /*async ping(key: string = 'db-primary'): Promise<HealthIndicatorResult> {
    try {
      await this.connection.raw('SELECT 1');
      return super.getStatus(key, true);
    } catch (error) {
      const status = super.getStatus(key, false, { message: error.message });
      throw new HealthCheckError('Unable to connect to database', status);
    }
  }*/
}
