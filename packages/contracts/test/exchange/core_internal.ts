import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetProxyUtils, orderHashUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as combinatorics from 'js-combinatorics';
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../generated_contract_wrappers/dummy_e_r_c20_token';
import { ERC20ProxyContract } from '../../generated_contract_wrappers/e_r_c20_proxy';
import { TestMixinExchangeCoreContract } from '../../generated_contract_wrappers/test_mixin_exchange_core';
import { artifacts } from '../utils/artifacts';
import { chaiSetup } from '../utils/chai_setup';
import { positiveNaturalBigNumbers } from '../utils/combinatorial_sets';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { OrderFactory } from '../utils/order_factory';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe.only('Exchange core internal', () => {
    let testExchange: TestMixinExchangeCoreContract;

    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc20Proxy: ERC20ProxyContract;

    let signedOrder: SignedOrder;
    let erc20Wrapper: ERC20Wrapper;
    let orderFactory: OrderFactory;

    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        testExchange = await TestMixinExchangeCoreContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinExchangeCore,
            provider,
            txDefaults,
        );

        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = _.slice(accounts, 0, 4));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(testExchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = erc20TokenB.address;

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: testExchange.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetProxyUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetProxyUtils.encodeERC20AssetData(defaultTakerAssetAddress),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe.only('updateFilledState', async () => {
        const testCases = combinatorics.cartesianProduct(
            positiveNaturalBigNumbers,
            positiveNaturalBigNumbers,
            positiveNaturalBigNumbers,
            positiveNaturalBigNumbers,
        );
        console.log(`Generated ${testCases.length} combinatoric test cases.`);
        let counter = -1;
        testCases.forEach(async testCase => {
            counter += 1;
            const testCaseString = JSON.stringify(testCase);
            it('generated test case ' + counter, async () => {
                const fillResults = {
                    makerAssetFilledAmount: testCase[0],
                    takerAssetFilledAmount: testCase[1],
                    makerFeePaid: testCase[2],
                    takerFeePaid: testCase[3],
                };
                signedOrder = orderFactory.newSignedOrder();
                try {
                    web3Wrapper.awaitTransactionSuccessAsync(
                        await testExchange.publicUpdateFilledState.sendTransactionAsync(
                            signedOrder,
                            defaultTakerAssetAddress,
                            orderHashUtils.getOrderHashHex(signedOrder),
                            new BigNumber(10),
                            fillResults,
                        ),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );
                } catch (e) {
                    throw new Error(e.message + '\n\tTest case: ' + testCaseString);
                }
            });
        });
    });
});
