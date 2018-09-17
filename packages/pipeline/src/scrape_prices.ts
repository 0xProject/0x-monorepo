import { postgresClient } from './postgres.js';
import { dataFetchingQueries } from './scripts/query_data.js';
import { scrapeDataScripts } from './scripts/scrape_data.js';
import { web3, zrx } from './zrx.js';
const CUR_BLOCK_OFFSET = 20;
postgresClient.query(dataFetchingQueries.get_most_recent_pricing_date, []).then((data: any) => {
    const curMaxScrapedDate = new Date(data.rows[0].max);
    const curDate = new Date();
    scrapeDataScripts.scrapeAllPricesToDB(curMaxScrapedDate.getTime(), curDate.getTime());
});
