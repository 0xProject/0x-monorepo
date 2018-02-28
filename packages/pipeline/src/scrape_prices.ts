import { dataFetchingQueries } from './scripts/query_data.js';
import { postgresClient } from './postgres.js';
import { exec } from 'child_process';
import { web3, zrx } from './zrx.js';

const CUR_BLOCK_OFFSET = 20;

 postgresClient
    .query(dataFetchingQueries.get_most_recent_pricing_date, [])
    .then((data: any) => {
        var curMaxScrapedDate = new Date(data.rows[0].max);
        var curDate = new Date();
        exec('node ./lib/scripts/scrape_data --type prices --from ' + curMaxScrapedDate.getTime()+ ' --to ' + curDate.getTime(), (error, stdout, stderr) => {
            if(error) {
                console.log(error);
                return
            }
        });
    });

