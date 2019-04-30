import { CoordinatorRegistryContract } from '@0x/abi-gen-wrappers';
import { CoordinatorRegistry } from '@0x/contract-artifacts';
import { constants } from '@0x/contracts-test-utils';
import { defaultOrmConfig, getAppAsync } from '@0x/coordinator-server';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, fetchAsync, logUtils } from '@0x/utils';
import * as chai from 'chai';
import * as http from 'http';
import 'mocha';

import { ContractWrappers, OrderStatus } from '../src';
import { CoordinatorError, CoordinatorServerCancellationResponse } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const coordinatorPort = '3000';
const anotherCoordinatorPort = '4000';
const coordinatorEndpoint = 'http://localhost:';

// tslint:disable:custom-no-magic-numbers
describe.only('CoordinatorWrapper', () => {
    const fillableAmount = new BigNumber(5);
    const takerTokenFillAmount = new BigNumber(5);
    let coordinatorServerApp: http.Server;
    let anotherCoordinatorServerApp: http.Server;
    let contractWrappers: ContractWrappers;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    let zrxTokenAddress: string;
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipientAddressOne: string;
    let feeRecipientAddressTwo: string;
    let feeRecipientAddressThree: string;
    let feeRecipientAddressFour: string;

    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let txHash: string | CoordinatorError;
    let signedOrder: SignedOrder;
    let anotherSignedOrder: SignedOrder;
    let signedOrderWithDifferentFeeRecipient: SignedOrder;
    let signedOrderWithDifferentCoordinatorOperator: SignedOrder;
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
        [
            ,
            makerAddress,
            takerAddress,
            feeRecipientAddressOne,
            feeRecipientAddressTwo,
            feeRecipientAddressThree,
            feeRecipientAddressFour,
        ] = userAddresses.slice(0, 7);
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];

        // set up mock coordinator server
        const feeRecipientConfigs = [
            {
                ADDRESS: feeRecipientAddressOne,
                PRIVATE_KEY: constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(feeRecipientAddressOne)].toString(
                    'hex',
                ),
            },
            {
                ADDRESS: feeRecipientAddressTwo,
                PRIVATE_KEY: constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(feeRecipientAddressTwo)].toString(
                    'hex',
                ),
            },
            {
                ADDRESS: feeRecipientAddressThree,
                PRIVATE_KEY: constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(feeRecipientAddressThree)].toString(
                    'hex',
                ),
            },
        ];
        const coordinatorServerConfigs = {
            HTTP_PORT: 3000, // Only used in default instantiation in 0x-coordinator-server/server.js; not used here
            NETWORK_ID_TO_SETTINGS: {
                50: {
                    FEE_RECIPIENTS: [feeRecipientConfigs[0], feeRecipientConfigs[1]],
                    // Ethereum RPC url, only used in the default instantiation in 0x-coordinator-server/server.js
                    // Not used here when instantiating with the imported app
                    RPC_URL: 'http://ignore',
                },
            },
            // Optional selective delay on fill requests
            SELECTIVE_DELAY_MS: 0,
            EXPIRATION_DURATION_SECONDS: 60, // 1 minute
        };
        coordinatorServerApp = await getAppAsync(
            {
                [config.networkId]: provider,
            },
            coordinatorServerConfigs,
            {
                ...defaultOrmConfig,
                logging: false,
            },
        );

        coordinatorServerApp.listen(coordinatorPort, () => {
            logUtils.log(`Coordinator SERVER API (HTTP) listening on port ${coordinatorPort}!`);
        });

        anotherCoordinatorServerApp = await getAppAsync(
            {
                [config.networkId]: provider,
            },
            {
                ...coordinatorServerConfigs,
                NETWORK_ID_TO_SETTINGS: {
                    50: {
                        FEE_RECIPIENTS: [feeRecipientConfigs[2]],
                        RPC_URL: 'http://ignore',
                    },
                },
            },
            {
                type: 'sqlite',
                database: 'database.sqlite_2',
                entities: defaultOrmConfig.entities,
                cli: defaultOrmConfig.cli,
                logging: defaultOrmConfig.logging,
                synchronize: defaultOrmConfig.synchronize,
            },
        );

        anotherCoordinatorServerApp.listen(anotherCoordinatorPort, () => {
            logUtils.log(`Coordinator SERVER API (HTTP) listening on port ${anotherCoordinatorPort}!`);
        });

        // setup coordinator registry
        coordinatorRegistryInstance = new CoordinatorRegistryContract(
            CoordinatorRegistry.compilerOutput.abi,
            contractAddresses.coordinatorRegistry,
            provider,
        );

        // register coordinator server
        await web3Wrapper.awaitTransactionSuccessAsync(
            await coordinatorRegistryInstance.setCoordinatorEndpoint.sendTransactionAsync(
                `${coordinatorEndpoint}${coordinatorPort}`,
                {
                    from: feeRecipientAddressOne,
                },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await coordinatorRegistryInstance.setCoordinatorEndpoint.sendTransactionAsync(
                `${coordinatorEndpoint}${coordinatorPort}`,
                {
                    from: feeRecipientAddressTwo,
                },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // register another coordinator server
        await web3Wrapper.awaitTransactionSuccessAsync(
            await coordinatorRegistryInstance.setCoordinatorEndpoint.sendTransactionAsync(
                `${coordinatorEndpoint}${anotherCoordinatorPort}`,
                {
                    from: feeRecipientAddressThree,
                },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            new BigNumber(1),
            new BigNumber(1),
            makerAddress,
            takerAddress,
            fillableAmount,
            feeRecipientAddressOne,
        );
        anotherSignedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            new BigNumber(1),
            new BigNumber(1),
            makerAddress,
            takerAddress,
            fillableAmount,
            feeRecipientAddressOne,
        );
        signedOrderWithDifferentFeeRecipient = await fillScenarios.createFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            new BigNumber(1),
            new BigNumber(1),
            makerAddress,
            takerAddress,
            fillableAmount,
            feeRecipientAddressTwo,
        );
        signedOrderWithDifferentCoordinatorOperator = await fillScenarios.createFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            new BigNumber(1),
            new BigNumber(1),
            makerAddress,
            takerAddress,
            fillableAmount,
            feeRecipientAddressThree,
        );
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('test setup', () => {
        it('should have coordinator registry which returns an endpoint', async () => {
            const setCoordinatorEndpoint = await coordinatorRegistryInstance.getCoordinatorEndpoint.callAsync(
                feeRecipientAddressOne,
            );
            const anotherSetCoordinatorEndpoint = await coordinatorRegistryInstance.getCoordinatorEndpoint.callAsync(
                feeRecipientAddressThree,
            );
            expect(setCoordinatorEndpoint).to.be.equal(`${coordinatorEndpoint}${coordinatorPort}`);
            expect(anotherSetCoordinatorEndpoint).to.be.equal(`${coordinatorEndpoint}${anotherCoordinatorPort}`);
        });
        it('should have coordinator server endpoints which respond to pings', async () => {
            let result = await fetchAsync(`${coordinatorEndpoint}${coordinatorPort}/v1/ping`);
            expect(result.status).to.be.equal(200);
            expect(await result.text()).to.be.equal('pong');

            result = await fetchAsync(`${coordinatorEndpoint}${anotherCoordinatorPort}/v1/ping`);
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
            it('should fill a batch of orders with different feeRecipientAddresses with the same coordinator server', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder, signedOrderWithDifferentFeeRecipient];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount, takerTokenFillAmount];
                txHash = await contractWrappers.coordinator.batchFillOrdersAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );

                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
            // coordinator-server, as currently implemented, shares a singleton database connection across
            // all instantiations. Making the request to two different mocked server endpoints still hits the
            // same database and fails because of the uniqueness constraint on transactions in the database.
            it.skip('should fill a batch of orders with different feeRecipientAddresses with different coordinator servers', async () => {
                const signedOrders = [
                    signedOrder,
                    anotherSignedOrder,
                    signedOrderWithDifferentFeeRecipient,
                    signedOrderWithDifferentCoordinatorOperator,
                ];
                const takerAssetFillAmounts = [
                    takerTokenFillAmount,
                    takerTokenFillAmount,
                    takerTokenFillAmount,
                    takerTokenFillAmount,
                ];
                txHash = await contractWrappers.coordinator.batchFillOrdersAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );

                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
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
        describe('#marketBuyOrdersAsync', () => {
            it('should market buy', async () => {
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
            it('should no throw market buy', async () => {
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
            it('should market sell', async () => {
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
            it('should no throw market sell', async () => {
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
    });
    describe('soft cancel order(s)', () => {
        describe('#softCancelOrderAsync', () => {
            it('should soft cancel a valid order', async () => {
                const response = await contractWrappers.coordinator.softCancelOrderAsync(signedOrder);
                expect(response.hasOwnProperty('errors')).to.be.false();
                expect(response.outstandingFillSignatures).to.have.lengthOf(0);
                expect(response.cancellationSignatures).to.have.lengthOf(1);
            });
        });
        describe('#batchSoftCancelOrdersAsync', () => {
            it('should soft cancel a batch of valid orders', async () => {
                const orders = [signedOrder, anotherSignedOrder];
                const response = await contractWrappers.coordinator.batchSoftCancelOrdersAsync(orders);

                expect(response.hasOwnProperty('errors')).to.be.false();
                const success = response;
                expect(success).to.have.lengthOf(1);
                expect(success[0].outstandingFillSignatures).to.have.lengthOf(0);
                expect(success[0].cancellationSignatures).to.have.lengthOf(1);
            });
            it('should soft cancel a batch of orders with different feeRecipientAddresses', async () => {
                const orders = [signedOrder, anotherSignedOrder, signedOrderWithDifferentFeeRecipient];
                const response = await contractWrappers.coordinator.batchSoftCancelOrdersAsync(orders);

                expect(response.hasOwnProperty('errors')).to.be.false();
                const success = response;
                expect(success).to.have.lengthOf(1);
                expect(success[0].outstandingFillSignatures).to.have.lengthOf(0);
                expect(success[0].cancellationSignatures).to.have.lengthOf(2);
            });
            it('should soft cancel a batch of orders with different coordinatorOperator and concatenate responses', async () => {
                const orders = [
                    signedOrder,
                    anotherSignedOrder,
                    signedOrderWithDifferentFeeRecipient,
                    signedOrderWithDifferentCoordinatorOperator,
                ];
                const response = await contractWrappers.coordinator.batchSoftCancelOrdersAsync(orders);

                expect(response.hasOwnProperty('errors')).to.be.false();
                const success = response;
                expect(success).to.have.lengthOf(2);
                expect(success[0].outstandingFillSignatures).to.have.lengthOf(0);
                expect(success[0].cancellationSignatures).to.have.lengthOf(2);
                expect(success[1].cancellationSignatures).to.have.lengthOf(1);
            });
        });
    });
    describe('hard cancel order(s)', () => {
        describe('#hardCancelOrderAsync', () => {
            it('should hard cancel a valid order', async () => {
                txHash = await contractWrappers.coordinator.hardCancelOrderAsync(signedOrder);

                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#batchHardCancelOrdersAsync', () => {
            it('should hard cancel a batch of valid orders', async () => {
                const orders = [signedOrder, anotherSignedOrder];
                txHash = await contractWrappers.coordinator.batchHardCancelOrdersAsync(orders);

                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#cancelOrdersUpTo/getOrderEpochAsync', () => {
            it('should hard cancel orders up to target order epoch', async () => {
                const targetOrderEpoch = new BigNumber(42);
                txHash = await contractWrappers.coordinator.hardCancelOrdersUpToAsync(targetOrderEpoch, makerAddress);

                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                const orderEpoch = await contractWrappers.exchange.getOrderEpochAsync(
                    makerAddress,
                    contractWrappers.coordinator.address,
                );
                expect(orderEpoch).to.be.bignumber.equal(targetOrderEpoch.plus(1));
            });
        });
    });
    describe('coordinator edge cases', () => {
        it('should throw error when feeRecipientAddress is not in registry', async () => {
            const badOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerAssetData,
                takerAssetData,
                new BigNumber(1),
                new BigNumber(1),
                makerAddress,
                takerAddress,
                fillableAmount,
                feeRecipientAddressFour,
            );

            expect(
                contractWrappers.coordinator.fillOrderAsync(badOrder, takerTokenFillAmount, takerAddress),
            ).to.be.rejected();
        });
        it('should throw error when coordinator endpoint is malformed', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await coordinatorRegistryInstance.setCoordinatorEndpoint.sendTransactionAsync('localhost', {
                    from: feeRecipientAddressFour,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            expect(
                contractWrappers.coordinator.fillOrderAsync(signedOrder, takerTokenFillAmount, takerAddress),
            ).to.be.rejected();
        });
    });
});
// tslint:disable:max-file-line-count
