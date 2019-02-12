import { BigNumber } from '@0x/utils';
import * as R from 'ramda';

import { BLOXY_DEX_TRADES_URL, BloxyTrade } from '../../data_sources/bloxy';
import { DexTrade } from '../../entities';

/**
 * Parses a raw trades response from the Bloxy Dex API and returns an array of
 * DexTrade entities.
 * @param rawTrades A raw order response from an SRA endpoint.
 */
export function parseBloxyTrades(rawTrades: BloxyTrade[]): DexTrade[] {
    return R.map(_parseBloxyTrade, rawTrades);
}

/**
 * Converts a single Bloxy trade into a DexTrade entity.
 * @param rawTrade A single trade from the response from the Bloxy API.
 */
export function _parseBloxyTrade(rawTrade: BloxyTrade): DexTrade {
    const dexTrade = new DexTrade();
    dexTrade.sourceUrl = BLOXY_DEX_TRADES_URL;
    dexTrade.txHash = rawTrade.tx_hash;
    dexTrade.tradeIndex = rawTrade.tradeIndex;
    dexTrade.txTimestamp = new Date(rawTrade.tx_time).getTime();
    dexTrade.txDate = rawTrade.tx_date;
    dexTrade.txSender = rawTrade.tx_sender;
    dexTrade.smartContractId = rawTrade.smart_contract_id;
    dexTrade.smartContractAddress = rawTrade.smart_contract_address;
    dexTrade.contractType = rawTrade.contract_type;
    dexTrade.maker = rawTrade.maker;
    dexTrade.taker = rawTrade.taker;
    // TODO(albrow): The Bloxy API returns amounts and fees as a `number` type
    // but some of their values have too many significant digits to be
    // represented that way. Ideally they will switch to using strings and then
    // we can update this code.
    dexTrade.amountBuy = new BigNumber(rawTrade.amountBuy.toString());
    dexTrade.makerFeeAmount = new BigNumber(rawTrade.makerFee.toString());
    dexTrade.buyCurrencyId = rawTrade.buyCurrencyId;
    dexTrade.buySymbol = filterNullCharacters(rawTrade.buySymbol);
    dexTrade.amountSell = new BigNumber(rawTrade.amountSell.toString());
    dexTrade.takerFeeAmount = new BigNumber(rawTrade.takerFee.toString());
    dexTrade.sellCurrencyId = rawTrade.sellCurrencyId;
    dexTrade.sellSymbol = filterNullCharacters(rawTrade.sellSymbol);
    dexTrade.makerAnnotation = rawTrade.maker_annotation;
    dexTrade.takerAnnotation = rawTrade.taker_annotation;
    dexTrade.protocol = rawTrade.protocol;
    dexTrade.buyAddress = rawTrade.buyAddress;
    dexTrade.sellAddress = rawTrade.sellAddress;
    return dexTrade;
}

// Works with any form of escaped null character (e.g., '\0' and '\u0000').
const filterNullCharacters = R.replace(/\0/g, '');
