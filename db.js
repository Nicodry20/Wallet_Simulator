const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  postgres://wallet_db_sph8_user:W4SXpic8u8zKpi0r1KOW3p8UBX58w3Hm@dpg-d150tm95pdvs73epbk80-a.oregon-postgres.render.com:5432/wallet_db_sph8?sslmode=require

});

module.exports = pool;
