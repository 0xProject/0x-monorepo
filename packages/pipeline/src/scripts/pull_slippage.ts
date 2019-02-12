import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { logUtils } from '@0x/utils';

import { EdpsSource} from '../data_sources/slippage';
import { Slippage } from '../entities';
import * as ormConfig from '../ormconfig';
import { calculateSlippage } from '../parsers/slippage';
import { handleError } from '../utils';

// Number of orders to save at once.
const BATCH_SAVE_SIZE = 1000;

// USD amounts for slippage depths
// tslint:disable-next-line:custom-no-magic-numbers
const USD_AMOUNTS = [10, 100, 1000, 10000];

// TODO: fetch from database
const TOKENS = ['BAT', 'DAI', 'FUN', 'MANA', 'OMG', 'REP', 'TUSD', 'ZRX', 'MKR', 'BNB', 'USDC'];

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const edpsSource = new EdpsSource();

    logUtils.log('Fetching slippage records');
    const nestedSlippages: Slippage[][][] = await Promise.all(TOKENS.map(async symbol => {
        const usdPrice = await edpsSource.getUsdPriceAsync(symbol);
        return Promise.all(USD_AMOUNTS.map(async usdAmount => {
            const amount = usdAmount / usdPrice;
            const buyEdps = await edpsSource.getEdpsAsync('buy', symbol, amount);
            const sellEdps = await edpsSource.getEdpsAsync('sell', symbol, amount);
            return Array.from(buyEdps.keys()).map(exchange => {
                const slippage: Slippage = calculateSlippage(usdAmount, exchange, buyEdps, sellEdps);
                return slippage;
            });
        }));
    }));
    const slippagesWithEmptyRecords = nestedSlippages
                    .reduce((acc, val) => acc.concat(val))
                    .reduce((acc, val) => acc.concat(val));
    const slippages = slippagesWithEmptyRecords.filter(slippage => slippage.observedTimestamp);
    const SlippageRepository = connection.getRepository(Slippage);
    logUtils.log(`Saving ${slippages.length} records to database`);
    await SlippageRepository.save(slippages, { chunk: Math.ceil(slippages.length / BATCH_SAVE_SIZE) });
    logUtils.log('Done');
    process.exit(0);
})().catch(handleError);
