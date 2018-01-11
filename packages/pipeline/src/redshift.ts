import * as Redshift from 'node-redshift';
import * as dotenv from 'dotenv';
dotenv.config();

let client = {
    user: process.env.REDSHIFT_USER,
    database: process.env.REDSHIFT_DB,
    password: process.env.REDSHIFT_PASSWORD,
    port: process.env.REDSHIFT_PORT,
    host: process.env.REDSHIFT_HOST,
};

let options = {};

let redshiftClient = new Redshift(client, options);

export default redshiftClient;
