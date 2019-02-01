import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { ETH_DECIMALS } from '../../src/constants';
import { format } from '../../src/util/format';

const BIG_NUMBER_ONE = new BigNumber(1);
const BIG_NUMBER_DECIMAL = new BigNumber(0.432414);
const BIG_NUMBER_IRRATIONAL = new BigNumber(5.3014059295032);
const ONE_ETH_IN_BASE_UNITS = Web3Wrapper.toBaseUnitAmount(BIG_NUMBER_ONE, ETH_DECIMALS);
const DECIMAL_ETH_IN_BASE_UNITS = Web3Wrapper.toBaseUnitAmount(BIG_NUMBER_DECIMAL, ETH_DECIMALS);
const IRRATIONAL_ETH_IN_BASE_UNITS = Web3Wrapper.toBaseUnitAmount(BIG_NUMBER_IRRATIONAL, ETH_DECIMALS);
const BIG_NUMBER_FAKE_ETH_USD_PRICE = new BigNumber(2.534);

describe('format', () => {
    describe('ethBaseAmount', () => {
        it('converts 1 ETH in base units to the string `1 ETH`', () => {
            expect(format.ethBaseAmount(ONE_ETH_IN_BASE_UNITS)).toBe('1 ETH');
        });
        it('converts .432414 ETH in base units to the string `.4324 ETH`', () => {
            expect(format.ethBaseAmount(DECIMAL_ETH_IN_BASE_UNITS)).toBe('0.4324 ETH');
        });
        it('converts 5.3014059295032 ETH in base units to the string `5.301 ETH`', () => {
            expect(format.ethBaseAmount(IRRATIONAL_ETH_IN_BASE_UNITS)).toBe('5.301 ETH');
        });
        it('returns defaultText param when ethBaseAmount is not defined', () => {
            const defaultText = 'defaultText';
            expect(format.ethBaseAmount(undefined, 4, defaultText)).toBe(defaultText);
        });
        it('it allows for configurable decimal places', () => {
            expect(format.ethBaseAmount(DECIMAL_ETH_IN_BASE_UNITS, 2)).toBe('0.43 ETH');
        });
    });
    describe('ethUnitAmount', () => {
        it('converts BigNumber(1) to the string `1 ETH`', () => {
            expect(format.ethUnitAmount(BIG_NUMBER_ONE)).toBe('1 ETH');
        });
        it('converts BigNumer(.432414) to the string `.4324 ETH`', () => {
            expect(format.ethUnitAmount(BIG_NUMBER_DECIMAL)).toBe('0.4324 ETH');
        });
        it('converts BigNumber(5.3014059295032) to the string `5.301 ETH`', () => {
            expect(format.ethUnitAmount(BIG_NUMBER_IRRATIONAL)).toBe('5.301 ETH');
        });
        it('returns defaultText param when ethUnitAmount is not defined', () => {
            const defaultText = 'defaultText';
            expect(format.ethUnitAmount(undefined, 4, defaultText)).toBe(defaultText);
            expect(format.ethUnitAmount(BIG_NUMBER_ONE, 4, defaultText)).toBe('1 ETH');
        });
        it('it allows for configurable decimal places', () => {
            expect(format.ethUnitAmount(BIG_NUMBER_DECIMAL, 2)).toBe('0.43 ETH');
        });
    });
    describe('ethBaseAmountInUsd', () => {
        it('correctly formats 1 ETH to usd according to some price', () => {
            expect(format.ethBaseAmountInUsd(ONE_ETH_IN_BASE_UNITS, BIG_NUMBER_FAKE_ETH_USD_PRICE)).toBe('$2.53');
        });
        it('correctly formats .432414 ETH to usd according to some price', () => {
            expect(format.ethBaseAmountInUsd(DECIMAL_ETH_IN_BASE_UNITS, BIG_NUMBER_FAKE_ETH_USD_PRICE)).toBe('$1.10');
        });
        it('correctly formats 5.3014059295032 ETH to usd according to some price', () => {
            expect(format.ethBaseAmountInUsd(IRRATIONAL_ETH_IN_BASE_UNITS, BIG_NUMBER_FAKE_ETH_USD_PRICE)).toBe(
                '$13.43',
            );
        });
        it('returns defaultText param when ethBaseAmountInUsd or ethUsdPrice is not defined', () => {
            const defaultText = 'defaultText';
            expect(format.ethBaseAmountInUsd(undefined, undefined, 2, defaultText)).toBe(defaultText);
            expect(format.ethBaseAmountInUsd(BIG_NUMBER_ONE, undefined, 2, defaultText)).toBe(defaultText);
            expect(format.ethBaseAmountInUsd(undefined, BIG_NUMBER_ONE, 2, defaultText)).toBe(defaultText);
        });
        it('it allows for configurable decimal places', () => {
            expect(format.ethBaseAmountInUsd(DECIMAL_ETH_IN_BASE_UNITS, BIG_NUMBER_FAKE_ETH_USD_PRICE, 4)).toBe(
                '$1.0957',
            );
        });
    });
    describe('ethUnitAmountInUsd', () => {
        it('correctly formats 1 ETH to usd according to some price', () => {
            expect(format.ethUnitAmountInUsd(BIG_NUMBER_ONE, BIG_NUMBER_FAKE_ETH_USD_PRICE)).toBe('$2.53');
        });
        it('correctly formats .432414 ETH to usd according to some price', () => {
            expect(format.ethUnitAmountInUsd(BIG_NUMBER_DECIMAL, BIG_NUMBER_FAKE_ETH_USD_PRICE)).toBe('$1.10');
        });
        it('correctly formats 5.3014059295032 ETH to usd according to some price', () => {
            expect(format.ethUnitAmountInUsd(BIG_NUMBER_IRRATIONAL, BIG_NUMBER_FAKE_ETH_USD_PRICE)).toBe('$13.43');
        });
        it('returns defaultText param when ethUnitAmountInUsd or ethUsdPrice is not defined', () => {
            const defaultText = 'defaultText';
            expect(format.ethUnitAmountInUsd(undefined, undefined, 2, defaultText)).toBe(defaultText);
            expect(format.ethUnitAmountInUsd(BIG_NUMBER_ONE, undefined, 2, defaultText)).toBe(defaultText);
            expect(format.ethUnitAmountInUsd(undefined, BIG_NUMBER_ONE, 2, defaultText)).toBe(defaultText);
        });
        it('it allows for configurable decimal places', () => {
            expect(format.ethUnitAmountInUsd(BIG_NUMBER_DECIMAL, BIG_NUMBER_FAKE_ETH_USD_PRICE, 4)).toBe('$1.0957');
        });
    });
});
