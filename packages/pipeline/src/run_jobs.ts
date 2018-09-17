import { exec } from 'child_process';

import { postgresClient } from './postgres.js';
import { dataFetchingQueries } from './scripts/query_data.js';
import { web3, zrx } from './zrx.js';
const CUR_BLOCK_OFFSET = 20;
postgresClient.query(dataFetchingQueries.get_max_block, []).then((data: any) => {
    const maxBlockNumber = data.rows[0].max;
    const safeCurBlockNumber = web3.eth.blockNumber - CUR_BLOCK_OFFSET;
    console.log('Scraping ' + maxBlockNumber + ' to ' + safeCurBlockNumber);
    exec(
        'node ./lib/scripts/scrape_data --type events --from ' + maxBlockNumber + ' --to ' + safeCurBlockNumber,
        (error, stdout, stderr) => {
            if (error) {
                console.log(error);
                return;
            }
            console.log('Scraped events');
            console.log('Scraping blocks');
            exec(
                'node ./lib/scripts/scrape_data --type blocks --from ' + maxBlockNumber + ' --to ' + safeCurBlockNumber,
                (error, stdout, stderr) => {
                    if (error) {
                        console.log(error);
                        return;
                    }
                    console.log('Scraped blocks');
                    console.log('Scraping transactions');
                    exec(
                        'node ./lib/scripts/scrape_data --type transactions --from ' +
                            maxBlockNumber +
                            ' --to ' +
                            safeCurBlockNumber,
                        (error, stdout, stderr) => {
                            if (error) {
                                console.log(error);
                                return;
                            }
                            console.log('Scraped transactions');
                            console.log('Joining events_staging');
                            exec(
                                'node ./lib/scripts/join_tables --name events_staging --from ' +
                                    maxBlockNumber +
                                    ' --to ' +
                                    safeCurBlockNumber,
                                (error, stdout, stderr) => {
                                    if (error) {
                                        console.log(error);
                                        return;
                                    }
                                    console.log('Joined events_staging');
                                    console.log('Joining events');
                                    exec(
                                        'node ./lib/scripts/join_tables --name events --from ' +
                                            maxBlockNumber +
                                            ' --to ' +
                                            safeCurBlockNumber,
                                        (error, stdout, stderr) => {
                                            if (error) {
                                                console.log(error);
                                                return;
                                            }
                                            console.log('Joined events');
                                            console.log('Joining events_full');
                                            exec(
                                                'node ./lib/scripts/join_tables --name events_full --from ' +
                                                    maxBlockNumber +
                                                    ' --to ' +
                                                    safeCurBlockNumber,
                                                (error, stdout, stderr) => {
                                                    if (error) {
                                                        console.log(error);
                                                        return;
                                                    }
                                                },
                                            );
                                        },
                                    );
                                },
                            );
                        },
                    );
                },
            );
        },
    );
});
