const { Pool } = require('pg');
require('dotenv').config();

// SSL active uniquement en cloud (RDS force le SSL). En local : desactive.
const useSSL = process.env.PGSSL === 'true';
const sslConfig = useSSL ? { rejectUnauthorized: false } : false;

// Deux modes de connexion :
// - DATABASE_URL (dev local / docker-compose) : inchange.
// - Variables PG* separees (ECS Fargate) : host/user/password injectes
//   via la task definition + Secrets Manager.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
    })
  : new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: sslConfig,
    });

module.exports = pool;