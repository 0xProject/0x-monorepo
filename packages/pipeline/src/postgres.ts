import * as dotenv from 'dotenv';
import { Pool, PoolConfig } from 'pg';
dotenv.config();
const client: PoolConfig = {
    user: process.env.AURORA_USER,
    database: process.env.AURORA_DB,
    password: process.env.AURORA_PASSWORD,
    port: parseInt(process.env.AURORA_PORT || '5432', 10),
    host: process.env.AURORA_HOST,
};
const postgresClient = new Pool(client);
export { postgresClient };
