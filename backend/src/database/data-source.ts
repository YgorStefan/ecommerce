// data-source.ts
// DataSource do TypeORM usado pelos scripts de migração (CLI)
// Referenciado pelos scripts migration:generate, migration:run e migration:revert

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Carrega as variáveis de ambiente antes de criar o DataSource
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'ecommerce',
  password: process.env.DB_PASSWORD || 'ecommerce123',
  database: process.env.DB_NAME || 'ecommerce_db',
  // Aponta para as entidades compiladas (após npm run build)
  entities: [join(__dirname, '../../dist/**/*.entity.js')],
  // Aponta para as migrations compiladas
  migrations: [join(__dirname, '../../dist/migrations/*.js')],
  // Pasta onde as migrations geradas serão salvas
  migrationsTableName: 'migrations',
});
