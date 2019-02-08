import * as R from 'ramda';
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';
import { logUtils } from '@0x/utils';
import { EdpsExchange, EdpsSource, PriceResponse, PriceSource } from '../data_sources/slippage';
import { handleError } from '../utils';
import { string, number } from 'prop-types';
import { calculateSlippage } from '../parsers/slippage';
import { SlippageRecord } from '../entities';
import * as ormConfig from '../ormconfig';

// Number of orders to save at once.
const BATCH_SAVE_SIZE = 1000;

// USD amounts for slippage depths
const USD_AMOUNTS = [10, 100, 1000];
const TOKENS = ['ZRX', 'MKR', 'DAI', 'KNC', 'BNB']; // TODO: fetch from database

(async () => {
    const priceSource = new PriceSource();
    const edpsSource = new EdpsSource();
    const resultsPerAmount = await TOKENS.map(async (symbol) => {
        const usdPrice = await priceSource.getUsdPriceAsync(symbol);
        USD_AMOUNTS.map(async (usdAmount) => {
            const amount = usdAmount / usdPrice;
            console.log(amount);
            const buyEdps = await edpsSource.getEdpsAsync('buy', symbol, amount);
            const sellEdps = await edpsSource.getEdpsAsync('sell', symbol, amount);

            for(let exchange of buyEdps.keys()) {
                const slippageRecord = await calculateSlippage(usdAmount, exchange, buyEdps, sellEdps)
                if (slippageRecord)
                    console.log(slippageRecord);
            }

        }
    )});
    //process.exit(0);
})().catch(handleError);