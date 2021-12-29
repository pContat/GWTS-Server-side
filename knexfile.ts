import * as dotenv from 'dotenv';
// need to be outside nest to be use from typeorm cli
function getDatabase() {
  if (!Boolean(process.env.NODE_ENV === 'production')) {
    dotenv.config({ path: '.env.dev' });
  }

  return {
    test: {
      client: 'postgresql',
      connection: {
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_ACCESS_KEY,
        port: process.env.DATABASE_PORT
      },
      migrations: {
        directory: './src/core/database/migrations'
      },
      seeds: {
        directory: './src/core/database/seeds'
      },
      pool: { min: 0, max: 7 }
    },

    development: {
      // debug: true,
      client: 'postgresql',
      connection: {
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_ACCESS_KEY,
        port: process.env.DATABASE_PORT
      },
      migrations: {
        directory: './src/core/database/migrations'
      },
      seeds: {
        directory: './src/core/database/seeds'
      },
      pool: { min: 0, max: 7 }
    },

    production: {
      client: 'postgresql',
      connection: {
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_ACCESS_KEY
      },
      pool: {
        min: 1,
        max: 10
      },
      migrations: {
        directory: './src/core/database/migrations'
      },
      seeds: {
        directory: './src/core/database/seeds'
      }
    }
  };
}

const database = getDatabase();
export = database;
