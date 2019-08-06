import { blockchainTests, constants, expect, hexRandom } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { IsolatedExchangeWrapper, Order } from './utils/isolated_exchange_wrapper';

blockchainTests.resets.only('Isolated fillOrder() tests', env => {
    const TOMORROW = Math.floor(_.now() / 1000) + 60 * 60 * 24;
    const DEFAULT_ORDER: Order = {
        senderAddress: constants.NULL_ADDRESS,
        makerAddress: randomAddress(),
        takerAddress: constants.NULL_ADDRESS,
        makerFee: constants.ZERO_AMOUNT,
        takerFee: constants.ZERO_AMOUNT,
        makerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: constants.ZERO_AMOUNT,
        makerAssetData: constants.NULL_BYTES,
        takerAssetData: constants.NULL_BYTES,
        makerFeeAssetData: constants.NULL_BYTES,
        takerFeeAssetData: constants.NULL_BYTES,
        salt: constants.ZERO_AMOUNT,
        feeRecipientAddress: constants.NULL_ADDRESS,
        expirationTimeSeconds: toBN(TOMORROW),
    };
    let takerAddress: string;
    let testExchange: IsolatedExchangeWrapper;
    let nextSaltValue = 1;

    before(async () => {
        [takerAddress] = await env.getAccountAddressesAsync();
        testExchange = await IsolatedExchangeWrapper.deployAsync(
            env.web3Wrapper,
            _.assign(env.txDefaults, { from: takerAddress }),
        );
    });

    function createOrder(details: Partial<Order> = {}): Order {
        return _.assign({}, DEFAULT_ORDER, { salt: toBN(nextSaltValue++) }, details);
    }

    it('works', async () => {
        const order = createOrder({
            makerAssetAmount: toBN(1),
            takerAssetAmount: toBN(2),
        });
        const results = await testExchange.fillOrderAsync(order, 2);
        console.log(results, testExchange.getOrderHash(order));
    });
});

function toBN(num: BigNumber | string | number): BigNumber {
    return new BigNumber(num);
}

function randomAddress(): string {
    return hexRandom(constants.ADDRESS_LENGTH);
}
