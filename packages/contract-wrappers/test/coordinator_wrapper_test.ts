import { CoordinatorRegistryContract } from '@0x/abi-gen-wrappers';
import { CoordinatorRegistry } from '@0x/contract-artifacts';
import { constants } from '@0x/contracts-test-utils';
import { getAppAsync } from '@0x/coordinator-server';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, fetchAsync } from '@0x/utils';
import * as chai from 'chai';
import * as http from 'http';
import 'mocha';

import { ContractWrappers, OrderStatus } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const coordinatorEndpoint = 'http://localhost:3000';

// tslint:disable:custom-no-magic-numbers
describe.only('CoordinatorWrapper', () => {
    const fillableAmount = new BigNumber(5);
    const takerTokenFillAmount = new BigNumber(5);
    let app: http.Server;
    let contractWrappers: ContractWrappers;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    let zrxTokenAddress: string;
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    let anotherFeeRecipientAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let txHash: string;
    let signedOrder: SignedOrder;
    let anotherSignedOrder: SignedOrder;
    let signedOrderWithoutFeeRecipient: SignedOrder;
    let coordinatorRegistryInstance: CoordinatorRegistryContract;
    before(async () => {
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses,
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.address;
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        zrxTokenAddress = contractWrappers.exchange.zrxTokenAddress;
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            exchangeContractAddress,
            contractWrappers.erc20Proxy.address,
            contractWrappers.erc721Proxy.address,
        );
        [, makerAddress, takerAddress, feeRecipientAddress, anotherFeeRecipientAddress] = userAddresses.slice(0, 5);
        [makerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        takerTokenAddress = contractWrappers.forwarder.etherTokenAddress;
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            new BigNumber(1),
            new BigNumber(1),
            makerAddress,
            constants.NULL_ADDRESS,
            fillableAmount,
            feeRecipientAddress,
        );
        anotherSignedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            new BigNumber(1),
            new BigNumber(1),
            makerAddress,
            constants.NULL_ADDRESS,
            fillableAmount,
            feeRecipientAddress,
        );
        signedOrderWithoutFeeRecipient = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            constants.NULL_ADDRESS,
            fillableAmount,
        );

        // set up mock coordinator server
        const coordinatorServerConfigs = {
            HTTP_PORT: 3000,
            NETWORK_ID_TO_SETTINGS: {
                50: {
                    FEE_RECIPIENTS: [
                        {
                            ADDRESS: feeRecipientAddress,
                            PRIVATE_KEY: constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(feeRecipientAddress)].toString('hex'),
                        },
                        {
                            ADDRESS: anotherFeeRecipientAddress,
                            PRIVATE_KEY: constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(anotherFeeRecipientAddress)].toString('hex'),
                        },
                    ],
                    // Ethereum RPC url, only used in the default instantiation in server.js of 0x-coordinator-server
                    // Not used here when instantiating with the imported app
                    RPC_URL: 'http://ignore',
                },
            },
            // Optional selective delay on fill requests
            SELECTIVE_DELAY_MS: 0,
            EXPIRATION_DURATION_SECONDS: 60, // 1 minute
        };
        app = await getAppAsync(
            {
                [config.networkId]: provider,
            },
            coordinatorServerConfigs,
        );

        await app.listen(coordinatorServerConfigs.HTTP_PORT, () => { // tslint:disable-line:await-promise
            console.log(`Coordinator SERVER API (HTTP) listening on port ${coordinatorServerConfigs.HTTP_PORT}!`); // tslint:disable-line:no-console
        });

        // setup coordinator registry
        coordinatorRegistryInstance = new CoordinatorRegistryContract(
            CoordinatorRegistry.compilerOutput.abi,
            contractAddresses.coordinatorRegistry,
            provider,
            {gas: 6000000});

        await web3Wrapper.awaitTransactionSuccessAsync(
            await coordinatorRegistryInstance.setCoordinatorEndpoint.sendTransactionAsync(
                coordinatorEndpoint,
                { from: feeRecipientAddress },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('test setup', () => {
        it('should have coordinator registry which returns an endpoint', async () => {
            const recordedCoordinatorEndpoint = await coordinatorRegistryInstance.getCoordinatorEndpoint.callAsync(
                feeRecipientAddress,
            );
            expect(recordedCoordinatorEndpoint).to.be.equal(coordinatorEndpoint);
        });
        it('should have coordinator server endpoint which responds to pings', async () => {
            const result = await fetchAsync(`${coordinatorEndpoint}/v1/ping`);
            expect(result.status).to.be.equal(200);
            expect(await result.text()).to.be.equal('pong');
        });
    });
    describe('fill order(s)', () => {
        describe('#fillOrderAsync', () => {
            it('should fill a valid order', async () => {
                txHash = await contractWrappers.coordinator.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#fillOrderNoThrowAsync', () => {
            it('should fill a valid order', async () => {
                txHash = await contractWrappers.coordinator.fillOrderNoThrowAsync(
                    signedOrder,
                    takerTokenFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                const orderInfo = await contractWrappers.exchange.getOrderInfoAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#fillOrKillOrderAsync', () => {
            it('should fill or kill a valid order', async () => {
                txHash = await contractWrappers.coordinator.fillOrKillOrderAsync(
                    signedOrder,
                    takerTokenFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#batchFillOrdersAsync', () => {
            it('should fill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount];
                txHash = await contractWrappers.coordinator.batchFillOrdersAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#marketBuyOrdersAsync', () => {
            it('should maker buy', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const makerAssetFillAmount = takerTokenFillAmount;
                txHash = await contractWrappers.coordinator.marketBuyOrdersAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#marketBuyOrdersNoThrowAsync', () => {
            it('should no throw maker buy', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const makerAssetFillAmount = takerTokenFillAmount;
                txHash = await contractWrappers.coordinator.marketBuyOrdersNoThrowAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                const orderInfo = await contractWrappers.exchange.getOrderInfoAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#marketSellOrdersAsync', () => {
            it('should maker sell', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmount = takerTokenFillAmount;
                txHash = await contractWrappers.coordinator.marketSellOrdersAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#marketSellOrdersNoThrowAsync', () => {
            it('should no throw maker sell', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmount = takerTokenFillAmount;
                txHash = await contractWrappers.coordinator.marketSellOrdersNoThrowAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                const orderInfo = await contractWrappers.exchange.getOrderInfoAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#batchFillOrdersNoThrowAsync', () => {
            it('should fill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount];
                txHash = await contractWrappers.coordinator.batchFillOrdersNoThrowAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                let orderInfo = await contractWrappers.exchange.getOrderInfoAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
                orderInfo = await contractWrappers.exchange.getOrderInfoAsync(anotherSignedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#batchFillOrKillOrdersAsync', () => {
            it('should fill or kill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount];
                txHash = await contractWrappers.coordinator.batchFillOrKillOrdersAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#matchOrdersAsync', () => {
            it('should match two valid ordersr', async () => {
                const matchingSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    takerAssetData,
                    makerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                txHash = await contractWrappers.coordinator.matchOrdersAsync(
                    signedOrder,
                    matchingSignedOrder,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
    });
    // describe('cancel order(s)', () => {
    //     describe('#cancelOrderAsync', () => {
    //         it('should cancel a valid order', async () => {
    //             txHash = await contractWrappers.coordinator.cancelOrderAsync(signedOrder);
    //             await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
    //         });
    //     });
    //     describe('#batchCancelOrdersAsync', () => {
    //         it('should cancel a batch of valid orders', async () => {
    //             const orders = [signedOrder, anotherSignedOrder];
    //             txHash = await contractWrappers.coordinator.batchCancelOrdersAsync(orders);
    //             await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
    //         });
    //     });
        // describe('#cancelOrdersUpTo/getOrderEpochAsync', () => {
        //     it('should cancel orders up to target order epoch', async () => {
        //         const targetOrderEpoch = new BigNumber(42);
        //         txHash = await contractWrappers.coordinator.cancelOrdersUpToAsync(targetOrderEpoch, makerAddress);
        //         await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        //         const orderEpoch = await contractWrappers.coordinator.getOrderEpochAsync(
        //             makerAddress,
        //             constants.NULL_ADDRESS,
        //         );
        //         expect(orderEpoch).to.be.bignumber.equal(targetOrderEpoch.plus(1));
        //     });
        // });
    // });
});
