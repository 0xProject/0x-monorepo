import * as dotenv from 'dotenv';
import * as Redshift from 'node-redshift';
dotenv.config();

const client = {
    user: process.env.REDSHIFT_USER,
    database: process.env.REDSHIFT_DB,
    password: process.env.REDSHIFT_PASSWORD,
    port: process.env.REDSHIFT_PORT,
    host: process.env.REDSHIFT_HOST,
};

const options = {};

const redshiftClient = new Redshift(client, options);

export default redshiftClient;
