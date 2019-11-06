import { constants, OrderFactory } from '@0x/contracts-test-utils';
import { defaultOrmConfig, getAppAsync } from '@0x/coordinator-server';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, fetchAsync, logUtils, providerUtils } from '@0x/utils';
import * as chai from 'chai';
import * as http from 'http';
import 'mocha';
import * as nock from 'nock';

import { ContractWrappers } from '../src';
import { CoordinatorRegistryContract } from '../src/index';
import { CoordinatorServerErrorMsg } from '../src/utils/coordinator_server_types';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const coordinatorPort = '3000';
const anotherCoordinatorPort = '4000';
const coordinatorEndpoint = 'http://localhost:';

// tslint:disable:custom-no-magic-numbers
// TODO (xianny): coordinator server must be updated to take new SignedOrder format. it returns all errors at the moment
describe.skip('CoordinatorWrapper', () => {
    const takerTokenFillAmount = new BigNumber(5);

    let chainId: number;
    let coordinatorServerApp: http.Server;
    let anotherCoordinatorServerApp: http.Server;
    let contractWrappers: ContractWrappers;
    let orderFactory: OrderFactory;
    let exchangeContractAddress: string;
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipientAddressOne: string;
    let feeRecipientAddressTwo: string;
    let feeRecipientAddressThree: string;
    let feeRecipientAddressFour: string;

    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let feeTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let feeAssetData: string;
    let txHash: string;
    let signedOrder: SignedOrder;
    let anotherSignedOrder: SignedOrder;
    let signedOrderWithDifferentFeeRecipient: SignedOrder;
    let signedOrderWithDifferentCoordinatorOperator: SignedOrder;
    let coordinatorRegistryInstance: CoordinatorRegistryContract;

    // for testing server error responses
    let serverValidationError: any;
    let serverCancellationSuccess: any;
    let serverApprovalSuccess: any;

    before(async () => {
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        const config = {
            chainId: constants.TESTRPC_CHAIN_ID,
            contractAddresses,
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        chainId = await providerUtils.getChainIdAsync(provider);
        exchangeContractAddress = contractWrappers.exchange.address;
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
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
        feeTokenAddress = contractAddresses.zrxToken;
        [makerAssetData, takerAssetData, feeAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
            assetDataUtils.encodeERC20AssetData(feeTokenAddress),
        ];

        // Configure order defaults
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress: feeRecipientAddressOne,
            makerAssetData,
            takerAssetData,
            makerFeeAssetData: feeAssetData,
            takerFeeAssetData: feeAssetData,
            senderAddress: contractAddresses.coordinator,
            exchangeAddress: exchangeContractAddress,
            chainId,
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        // set up mock coordinator server
        const coordinatorServerConfigs = {
            HTTP_PORT: 3000, // Only used in default instantiation in 0x-coordinator-server/server.js; not used here
            NETWORK_ID_TO_SETTINGS: {
                // TODO: change to CHAIN_ID_TO_SETTINGS when @0x/coordinator-server is ready
                [config.chainId]: {
                    FEE_RECIPIENTS: [
                        {
                            ADDRESS: feeRecipientAddressOne,
                            PRIVATE_KEY: constants.TESTRPC_PRIVATE_KEYS[
                                userAddresses.indexOf(feeRecipientAddressOne)
                            ].toString('hex'),
                        },
                        {
                            ADDRESS: feeRecipientAddressTwo,
                            PRIVATE_KEY: constants.TESTRPC_PRIVATE_KEYS[
                                userAddresses.indexOf(feeRecipientAddressTwo)
                            ].toString('hex'),
                        },
                        {
                            ADDRESS: feeRecipientAddressThree,
                            PRIVATE_KEY: constants.TESTRPC_PRIVATE_KEYS[
                                userAddresses.indexOf(feeRecipientAddressThree)
                            ].toString('hex'),
                        },
                    ],
                    // Ethereum RPC url, only used in the default instantiation in 0x-coordinator-server/server.js
                    // Not used here when instantiating with the imported app
                    RPC_URL: 'http://ignore',
                },
            },
            NETWORK_ID_TO_CONTRACT_ADDRESSES: {
                // TODO: change to CHAIN_ID_TO_CONTRACT_ADDRESSES when @0x/coordinator-server is ready
                [config.chainId]: contractAddresses,
            },
            // Optional selective delay on fill requests
            SELECTIVE_DELAY_MS: 0,
            EXPIRATION_DURATION_SECONDS: 60, // 1 minute
        };
        coordinatorServerApp = await getAppAsync(
            {
                [config.chainId]: provider,
            },
            coordinatorServerConfigs,
            {
                name: 'coord_server_1',
                type: 'sqlite',
                database: ':memory:',
                entities: defaultOrmConfig.entities,
                cli: defaultOrmConfig.cli,
                logging: defaultOrmConfig.logging,
                synchronize: defaultOrmConfig.synchronize,
            },
        );

        coordinatorServerApp.listen(coordinatorPort, () => {
            logUtils.log(`Coordinator SERVER API (HTTP) listening on port ${coordinatorPort}!`);
        });

        anotherCoordinatorServerApp = await getAppAsync(
            {
                [config.chainId]: provider,
            },
            coordinatorServerConfigs,
            {
                type: 'sqlite',
                name: 'coord_server_2',
                database: ':memory:',
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
        coordinatorRegistryInstance = new CoordinatorRegistryContract(contractAddresses.coordinatorRegistry, provider);

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
        signedOrder = await orderFactory.newSignedOrderAsync();
        anotherSignedOrder = await orderFactory.newSignedOrderAsync();
        signedOrderWithDifferentFeeRecipient = await orderFactory.newSignedOrderAsync({
            feeRecipientAddress: feeRecipientAddressTwo,
        });
        signedOrderWithDifferentCoordinatorOperator = await orderFactory.newSignedOrderAsync({
            feeRecipientAddress: feeRecipientAddressThree,
        });
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
    // fill handling is the same for all fill methods so we can test them all through the fillOrder and batchFillOrders interfaces
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
        describe('#batchFillOrdersAsync', () => {
            it('should fill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = Array(2).fill(takerTokenFillAmount);
                txHash = await contractWrappers.coordinator.batchFillOrdersAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );

                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
            it('should fill a batch of orders with different feeRecipientAddresses with the same coordinator server', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder, signedOrderWithDifferentFeeRecipient];
                const takerAssetFillAmounts = Array(3).fill(takerTokenFillAmount);
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
                const takerAssetFillAmounts = Array(4).fill(takerTokenFillAmount);
                txHash = await contractWrappers.coordinator.batchFillOrdersAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );

                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });

            it('should fill a batch of mixed coordinator and non-coordinator orders', async () => {
                const nonCoordinatorOrder = await orderFactory.newSignedOrderAsync({
                    senderAddress: constants.NULL_ADDRESS,
                });
                const signedOrders = [signedOrder, nonCoordinatorOrder];
                const takerAssetFillAmounts = Array(2).fill(takerTokenFillAmount);
                txHash = await contractWrappers.coordinator.batchFillOrdersAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
    });
    describe('soft cancel order(s)', () => {
        describe('#softCancelOrderAsync', () => {
            it('should soft cancel a valid order', async () => {
                const response = await contractWrappers.coordinator.softCancelOrderAsync(signedOrder);
                expect(response.outstandingFillSignatures).to.have.lengthOf(0);
                expect(response.cancellationSignatures).to.have.lengthOf(1);
            });
        });
        describe('#batchSoftCancelOrdersAsync', () => {
            it('should soft cancel a batch of valid orders', async () => {
                const orders = [signedOrder, anotherSignedOrder];
                const response = await contractWrappers.coordinator.batchSoftCancelOrdersAsync(orders);
                expect(response).to.have.lengthOf(1);
                expect(response[0].outstandingFillSignatures).to.have.lengthOf(0);
                expect(response[0].cancellationSignatures).to.have.lengthOf(1);
            });
            it('should soft cancel a batch of orders with different feeRecipientAddresses', async () => {
                const orders = [signedOrder, anotherSignedOrder, signedOrderWithDifferentFeeRecipient];
                const response = await contractWrappers.coordinator.batchSoftCancelOrdersAsync(orders);
                expect(response).to.have.lengthOf(1);
                expect(response[0].outstandingFillSignatures).to.have.lengthOf(0);
                expect(response[0].cancellationSignatures).to.have.lengthOf(2);
            });
            it('should soft cancel a batch of orders with different coordinatorOperator and concatenate responses', async () => {
                const orders = [
                    signedOrder,
                    anotherSignedOrder,
                    signedOrderWithDifferentFeeRecipient,
                    signedOrderWithDifferentCoordinatorOperator,
                ];
                const response = await contractWrappers.coordinator.batchSoftCancelOrdersAsync(orders);
                expect(response).to.have.lengthOf(2);
                expect(response[0].outstandingFillSignatures).to.have.lengthOf(0);
                expect(response[0].cancellationSignatures).to.have.lengthOf(3);
                expect(response[1].cancellationSignatures).to.have.lengthOf(3); // both coordinator servers support the same feeRecipients
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
                const orderEpoch = await contractWrappers.exchange.orderEpoch.callAsync(
                    makerAddress,
                    contractWrappers.coordinator.address,
                );
                expect(orderEpoch).to.be.bignumber.equal(targetOrderEpoch.plus(1));
            });
        });
    });
    describe('coordinator edge cases', () => {
        it('should throw error when feeRecipientAddress is not in registry', async () => {
            const badOrder = await orderFactory.newSignedOrderAsync({
                feeRecipientAddress: feeRecipientAddressFour,
            });

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
    describe('coordinator server errors', () => {
        beforeEach('setup', () => {
            serverValidationError = {
                code: 100,
                reason: 'Validation Failed',
                validationErrors: [
                    {
                        field: 'signedTransaction',
                        code: 1011,
                        reason:
                            'A transaction can only be approved once. To request approval to perform the same actions, generate and sign an identical transaction with a different salt value.',
                    },
                ],
            };
            serverCancellationSuccess = {
                outstandingFillSignatures: [
                    {
                        orderHash: '0xd1dc61f3e7e5f41d72beae7863487beea108971de678ca00d903756f842ef3ce',
                        approvalSignatures: [
                            '0x1c7383ca8ebd6de8b5b20b1c2d49bea166df7dfe4af1932c9c52ec07334e859cf2176901da35f4480ceb3ab63d8d0339d851c31929c40d88752689b9a8a535671303',
                        ],
                        expirationTimeSeconds: 1552390380,
                        takerAssetFillAmount: 100000000000000000000,
                    },
                ],
                cancellationSignatures: [
                    '0x2ea3117a8ebd6de8b5b20b1c2d49bea166df7dfe4af1932c9c52ec07334e859cf2176901da35f4480ceb3ab63d8d0339d851c31929c40d88752689b9a855b5a7b401',
                ],
            };
            serverApprovalSuccess = {
                signatures: [
                    '0x1cc07d7ae39679690a91418d46491520f058e4fb14debdf2e98f2376b3970de8512ace44af0be6d1c65617f7aae8c2364ff63f241515ee1559c3eeecb0f671d9e903',
                ],
                expirationTimeSeconds: 1552390014,
            };

            nock(`${coordinatorEndpoint}${coordinatorPort}`)
                .post('/v1/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(400, serverValidationError);
        });
        it('should throw error when softCancel fails', done => {
            contractWrappers.coordinator
                .softCancelOrderAsync(signedOrder)
                .then(res => {
                    expect(res).to.be.undefined();
                })
                .catch(err => {
                    expect(err.message).equal(CoordinatorServerErrorMsg.CancellationFailed);
                    expect(err.approvedOrders).to.be.empty('array');
                    expect(err.cancellations).to.be.empty('array');

                    const errorBody = err.errors[0];
                    expect(errorBody.isError).to.be.true();
                    expect(errorBody.status).to.equal(400);
                    expect(errorBody.error).to.deep.equal(serverValidationError);
                    expect(errorBody.orders).to.deep.equal([signedOrder]);
                    expect(errorBody.coordinatorOperator).to.equal(`${coordinatorEndpoint}${coordinatorPort}`);
                    done();
                });
        });
        it('should throw error when batch soft cancel fails with single coordinator operator', done => {
            const orders = [signedOrder, signedOrderWithDifferentFeeRecipient];
            contractWrappers.coordinator
                .batchSoftCancelOrdersAsync(orders)
                .then(res => {
                    expect(res).to.be.undefined();
                })
                .catch(err => {
                    expect(err.message).equal(CoordinatorServerErrorMsg.CancellationFailed);
                    expect(err.approvedOrders).to.be.empty('array');
                    expect(err.cancellations).to.be.empty('array');

                    const errorBody = err.errors[0];
                    expect(errorBody.isError).to.be.true();
                    expect(errorBody.status).to.equal(400);
                    expect(errorBody.error).to.deep.equal(serverValidationError);
                    expect(errorBody.orders).to.deep.equal(orders);
                    expect(errorBody.coordinatorOperator).to.equal(`${coordinatorEndpoint}${coordinatorPort}`);
                    done();
                });
        });
        it('should throw consolidated error when batch soft cancel partially fails with different coordinator operators', done => {
            nock(`${coordinatorEndpoint}${anotherCoordinatorPort}`)
                .post('/v1/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(200, serverCancellationSuccess);

            const signedOrders = [signedOrder, signedOrderWithDifferentCoordinatorOperator];
            contractWrappers.coordinator
                .batchSoftCancelOrdersAsync(signedOrders)
                .then(res => {
                    expect(res).to.be.undefined();
                })
                .catch(err => {
                    expect(err.message).equal(CoordinatorServerErrorMsg.CancellationFailed);
                    expect(err.approvedOrders).to.be.empty('array');
                    expect(err.cancellations).to.deep.equal([serverCancellationSuccess]);

                    const errorBody = err.errors[0];
                    expect(errorBody.isError).to.be.true();
                    expect(errorBody.status).to.equal(400);
                    expect(errorBody.error).to.deep.equal(serverValidationError);
                    expect(errorBody.orders).to.deep.equal([signedOrder]);
                    expect(errorBody.coordinatorOperator).to.equal(`${coordinatorEndpoint}${coordinatorPort}`);
                    done();
                });
        });
        it('should throw consolidated error when batch soft cancel totally fails with different coordinator operators', done => {
            nock(`${coordinatorEndpoint}${anotherCoordinatorPort}`)
                .post('/v1/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(400, serverValidationError);

            const signedOrders = [signedOrder, signedOrderWithDifferentCoordinatorOperator];
            contractWrappers.coordinator
                .batchSoftCancelOrdersAsync(signedOrders)
                .then(res => {
                    expect(res).to.be.undefined();
                })
                .catch(err => {
                    expect(err.message).equal(CoordinatorServerErrorMsg.CancellationFailed);
                    expect(err.approvedOrders).to.be.empty('array');
                    expect(err.cancellations).to.be.empty('array');

                    const errorBody = err.errors[0];
                    expect(errorBody.isError).to.be.true();
                    expect(errorBody.status).to.equal(400);
                    expect(errorBody.error).to.deep.equal(serverValidationError);
                    expect(errorBody.orders).to.deep.equal([signedOrder]);
                    expect(errorBody.coordinatorOperator).to.equal(`${coordinatorEndpoint}${coordinatorPort}`);

                    const anotherErrorBody = err.errors[1];
                    expect(anotherErrorBody.isError).to.be.true();
                    expect(anotherErrorBody.status).to.equal(400);
                    expect(anotherErrorBody.error).to.deep.equal(serverValidationError);
                    expect(anotherErrorBody.orders).to.deep.equal([signedOrderWithDifferentCoordinatorOperator]);
                    expect(anotherErrorBody.coordinatorOperator).to.equal(
                        `${coordinatorEndpoint}${anotherCoordinatorPort}`,
                    );
                    done();
                });
        });
        it('should throw error when a fill fails', done => {
            contractWrappers.coordinator
                .fillOrderAsync(signedOrder, takerTokenFillAmount, takerAddress)
                .then(res => {
                    expect(res).to.be.undefined();
                })
                .catch(err => {
                    expect(err.message).equal(CoordinatorServerErrorMsg.FillFailed);
                    expect(err.approvedOrders).to.be.empty('array');
                    expect(err.cancellations).to.be.empty('array');

                    const errorBody = err.errors[0];
                    expect(errorBody.isError).to.be.true();
                    expect(errorBody.status).to.equal(400);
                    expect(errorBody.error).to.deep.equal(serverValidationError);
                    expect(errorBody.orders).to.deep.equal([signedOrder]);
                    expect(errorBody.coordinatorOperator).to.equal(`${coordinatorEndpoint}${coordinatorPort}`);
                    done();
                });
        });
        it('should throw error when batch fill fails with single coordinator operator', done => {
            const signedOrders = [signedOrder, signedOrderWithDifferentFeeRecipient];
            const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount, takerTokenFillAmount];
            contractWrappers.coordinator
                .batchFillOrdersAsync(signedOrders, takerAssetFillAmounts, takerAddress)
                .then(res => {
                    expect(res).to.be.undefined();
                })
                .catch(err => {
                    expect(err.message).equal(CoordinatorServerErrorMsg.FillFailed);
                    expect(err.approvedOrders).to.be.empty('array');
                    expect(err.cancellations).to.be.empty('array');

                    const errorBody = err.errors[0];
                    expect(errorBody.isError).to.be.true();
                    expect(errorBody.status).to.equal(400);
                    expect(errorBody.error).to.deep.equal(serverValidationError);
                    expect(errorBody.orders).to.deep.equal(signedOrders);
                    expect(errorBody.coordinatorOperator).to.equal(`${coordinatorEndpoint}${coordinatorPort}`);
                    done();
                });
        });
        it('should throw consolidated error when batch fill partially fails with different coordinator operators', done => {
            nock(`${coordinatorEndpoint}${anotherCoordinatorPort}`)
                .post('/v1/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(200, serverApprovalSuccess);

            const signedOrders = [signedOrder, signedOrderWithDifferentCoordinatorOperator];
            const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount, takerTokenFillAmount];
            contractWrappers.coordinator
                .batchFillOrdersAsync(signedOrders, takerAssetFillAmounts, takerAddress)
                .then(res => {
                    expect(res).to.be.undefined();
                })
                .catch(err => {
                    expect(err.message).equal(CoordinatorServerErrorMsg.FillFailed);
                    expect(err.approvedOrders).to.deep.equal([signedOrderWithDifferentCoordinatorOperator]);
                    expect(err.cancellations).to.be.empty('array');

                    const errorBody = err.errors[0];
                    expect(errorBody.isError).to.be.true();
                    expect(errorBody.status).to.equal(400);
                    expect(errorBody.error).to.deep.equal(serverValidationError);
                    expect(errorBody.orders).to.deep.equal([signedOrder]);
                    expect(errorBody.coordinatorOperator).to.equal(`${coordinatorEndpoint}${coordinatorPort}`);
                    done();
                });
        });
        it('should throw consolidated error when batch fill totally fails with different coordinator operators', done => {
            nock(`${coordinatorEndpoint}${anotherCoordinatorPort}`)
                .post('/v1/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(400, serverValidationError);

            const signedOrders = [signedOrder, signedOrderWithDifferentCoordinatorOperator];
            const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount, takerTokenFillAmount];
            contractWrappers.coordinator
                .batchFillOrdersAsync(signedOrders, takerAssetFillAmounts, takerAddress)
                .then(res => {
                    expect(res).to.be.undefined();
                })
                .catch(err => {
                    expect(err.message).equal(CoordinatorServerErrorMsg.FillFailed);
                    expect(err.approvedOrders).to.be.empty('array');
                    expect(err.cancellations).to.be.empty('array');

                    const errorBody = err.errors[0];
                    expect(errorBody.isError).to.be.true();
                    expect(errorBody.status).to.equal(400);
                    expect(errorBody.error).to.deep.equal(serverValidationError);
                    expect(errorBody.orders).to.deep.equal([signedOrder]);
                    expect(errorBody.coordinatorOperator).to.equal(`${coordinatorEndpoint}${coordinatorPort}`);

                    const anotherErrorBody = err.errors[1];
                    expect(anotherErrorBody.isError).to.be.true();
                    expect(anotherErrorBody.status).to.equal(400);
                    expect(anotherErrorBody.error).to.deep.equal(serverValidationError);
                    expect(anotherErrorBody.orders).to.deep.equal([signedOrderWithDifferentCoordinatorOperator]);
                    expect(anotherErrorBody.coordinatorOperator).to.equal(
                        `${coordinatorEndpoint}${anotherCoordinatorPort}`,
                    );
                    done();
                });
        });
    });
});
// tslint:disable:max-file-line-count
