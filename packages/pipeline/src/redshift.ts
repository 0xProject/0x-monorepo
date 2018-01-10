//redshift.js 
import * as Redshift from 'node-redshift';
import * as dotenv from 'dotenv';
dotenv.config()
 
var client = {
  user: process.env.REDSHIFT_USER,
  database: process.env.REDSHIFT_DB,
  password: process.env.REDSHIFT_PASSWORD,
  port: process.env.REDSHIFT_PORT,
  host: process.env.REDSHIFT_HOST,
};

var options = {

}
 
// The values passed in to the options object will be the difference between a connection pool and raw connection 
var redshiftClient = new Redshift(client, [options]);
 
export default redshiftClient