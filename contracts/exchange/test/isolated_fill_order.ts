import {
    blockchainTests,
    constants,
    expect,
    FillResults,
    hexRandom,
} from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { AssetBalances, IsolatedExchangeWrapper, Orderish } from './utils/isolated_exchange_wrapper';
import { calculateFillResults } from './utils/reference_functions';

blockchainTests.resets.only('Isolated fillOrder() tests', env => {
    const { ZERO_AMOUNT } = constants;
    const TOMORROW = Math.floor(_.now() / 1000) + 60 * 60 * 24;
    const ERC20_ASSET_DATA_LENGTH = 24;
    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const DEFAULT_ORDER: Orderish = {
        senderAddress: constants.NULL_ADDRESS,
        makerAddress: randomAddress(),
        takerAddress: constants.NULL_ADDRESS,
        makerFee: ZERO_AMOUNT,
        takerFee: ZERO_AMOUNT,
        makerAssetAmount: ZERO_AMOUNT,
        takerAssetAmount: ZERO_AMOUNT,
        salt: ZERO_AMOUNT,
        feeRecipientAddress: constants.NULL_ADDRESS,
        expirationTimeSeconds: new BigNumber(TOMORROW),
        makerAssetData: hexRandom(ERC20_ASSET_DATA_LENGTH),
        takerAssetData: hexRandom(ERC20_ASSET_DATA_LENGTH),
        makerFeeAssetData: hexRandom(ERC20_ASSET_DATA_LENGTH),
        takerFeeAssetData: hexRandom(ERC20_ASSET_DATA_LENGTH),
    };
    let takerAddress: string;
    let exchange: IsolatedExchangeWrapper;
    let nextSaltValue = 1;

    before(async () => {
        [ takerAddress ] = await env.getAccountAddressesAsync();
        exchange = await IsolatedExchangeWrapper.deployAsync(
            env.web3Wrapper,
            _.assign(env.txDefaults, { from: takerAddress }),
        );
    });

    function createOrder(details: Partial<Orderish> = {}): Orderish {
        return _.assign({}, DEFAULT_ORDER, { salt: new BigNumber(nextSaltValue++) }, details);
    }

    async function fillOrderAndAssertResultsAsync(
        order: Orderish,
        takerAssetFillAmount: BigNumber,
    ): Promise<FillResults> {
        const efr = await calculateExpectedFillResultsAsync(order, takerAssetFillAmount);
        const efb = calculateExpectedFillBalances(order, efr);
        const fillResults = await exchange.fillOrderAsync(order, takerAssetFillAmount);
        // Check returned fillResults.
        expect(fillResults.makerAssetFilledAmount)
            .to.bignumber.eq(efr.makerAssetFilledAmount);
        expect(fillResults.takerAssetFilledAmount)
            .to.bignumber.eq(efr.takerAssetFilledAmount);
        expect(fillResults.makerFeePaid)
            .to.bignumber.eq(efr.makerFeePaid);
        expect(fillResults.takerFeePaid)
            .to.bignumber.eq(efr.takerFeePaid);
        // Check balances.
        for (const assetData of Object.keys(efb)) {
            for (const address of Object.keys(efb[assetData])) {
                expect(exchange.getBalanceChange(assetData, address))
                    .to.bignumber.eq(efb[assetData][address], `assetData: ${assetData}, address: ${address}`);
            }
        }
        return fillResults;
    }

    async function calculateExpectedFillResultsAsync(
        order: Orderish,
        takerAssetFillAmount: BigNumber,
    ): Promise<FillResults> {
        const takerAssetFilledAmount = await exchange.getTakerAssetFilledAmountAsync(order);
        const remainingTakerAssetAmount = order.takerAssetAmount.minus(takerAssetFilledAmount);
        return calculateFillResults(
            order,
            BigNumber.min(takerAssetFillAmount, remainingTakerAssetAmount),
        );
    }

    function calculateExpectedFillBalances(
        order: Orderish,
        fillResults: FillResults,
    ): AssetBalances {
        const balances: AssetBalances = {};
        const addBalance = (assetData: string, address: string, amount: BigNumber) => {
            balances[assetData] = balances[assetData] || {};
            const balance = balances[assetData][address] || ZERO_AMOUNT;
            balances[assetData][address] = balance.plus(amount);
        };
        addBalance(order.makerAssetData, order.makerAddress, fillResults.makerAssetFilledAmount.negated());
        addBalance(order.makerAssetData, takerAddress, fillResults.makerAssetFilledAmount);
        addBalance(order.takerAssetData, order.makerAddress, fillResults.takerAssetFilledAmount);
        addBalance(order.takerAssetData, takerAddress, fillResults.takerAssetFilledAmount.negated());
        addBalance(order.makerFeeAssetData, order.makerAddress, fillResults.makerFeePaid.negated());
        addBalance(order.makerFeeAssetData, order.feeRecipientAddress, fillResults.makerFeePaid);
        addBalance(order.takerFeeAssetData, takerAddress, fillResults.takerFeePaid.negated());
        addBalance(order.takerFeeAssetData, order.feeRecipientAddress, fillResults.takerFeePaid);
        return balances;
    }

    it('can fully fill an order', async () => {
        const order = createOrder({
            makerAssetAmount: new BigNumber(1),
            takerAssetAmount: new BigNumber(2),
        });
        return fillOrderAndAssertResultsAsync(order, order.takerAssetAmount);
    });
});
