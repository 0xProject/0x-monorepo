import { ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { encodeERC20AssetData } from '@0x/contracts-asset-proxy';
import { ExchangeContract } from '@0x/contracts-exchange';
import { blockchainTests, constants, expect, OrderFactory } from '@0x/contracts-test-utils';
import { defaultOrmConfig, getAppAsync } from '@0x/coordinator-server';
import { devConstants, tokenUtils } from '@0x/dev-utils';
import { runMigrationsOnceAsync } from '@0x/migrations';
import { SignedOrder } from '@0x/types';
import { BigNumber, fetchAsync, logUtils } from '@0x/utils';
import * as nock from 'nock';

import { CoordinatorClient, CoordinatorRegistryContract, CoordinatorServerErrorMsg } from '@0x/contracts-coordinator';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';

const coordinatorPort = '3000';
const anotherCoordinatorPort = '4000';
const coordinatorEndpoint = 'http://localhost:';

const DEFAULT_PROTOCOL_FEE_MULTIPLIER = new BigNumber(150000);

// tslint:disable:custom-no-magic-numbers
blockchainTests.skip('Coordinator Client', env => {
    const takerTokenFillAmount = new BigNumber(0);
    const chainId = 1337;

    let contractAddresses: ContractAddresses;
    let coordinatorRegistry: CoordinatorRegistryContract;
    let coordinatorClient: CoordinatorClient;
    let orderFactory: OrderFactory;
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipientAddressOne: string;
    let feeRecipientAddressTwo: string;
    let feeRecipientAddressThree: string;
    let feeRecipientAddressFour: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let feeAssetData: string;

    let makerToken: DummyERC20TokenContract;
    let takerToken: DummyERC20TokenContract;
    let txHash: string;
    let signedOrder: SignedOrder;
    let anotherSignedOrder: SignedOrder;
    let signedOrderWithDifferentFeeRecipient: SignedOrder;
    let signedOrderWithDifferentCoordinatorOperator: SignedOrder;

    // for testing server error responses
    let serverValidationError: any;

    before(async () => {
        contractAddresses = await runMigrationsOnceAsync(env.provider, {
            gas: devConstants.GAS_LIMIT,
            from: devConstants.TESTRPC_FIRST_ADDRESS,
        });

        coordinatorClient = new CoordinatorClient(
            contractAddresses.coordinator,
            env.provider,
            chainId,
            {}, // txDefaults
            contractAddresses.exchange,
            contractAddresses.coordinatorRegistry,
        );
        coordinatorRegistry = new CoordinatorRegistryContract(contractAddresses.coordinatorRegistry, env.provider);
        userAddresses = await env.web3Wrapper.getAvailableAddressesAsync();
        [
            ,
            makerAddress,
            takerAddress,
            feeRecipientAddressOne,
            feeRecipientAddressTwo,
            feeRecipientAddressThree,
            feeRecipientAddressFour,
        ] = userAddresses.slice(0, 7);

        // declare encoded asset data
        const [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        const feeTokenAddress = contractAddresses.zrxToken;
        [makerAssetData, takerAssetData, feeAssetData] = [
            encodeERC20AssetData(makerTokenAddress),
            encodeERC20AssetData(takerTokenAddress),
            encodeERC20AssetData(feeTokenAddress),
        ];

        // set initial balances
        makerToken = new DummyERC20TokenContract(makerTokenAddress, env.provider);
        takerToken = new DummyERC20TokenContract(takerTokenAddress, env.provider);

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
            exchangeAddress: contractAddresses.exchange,
            chainId,
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        // configure mock coordinator servers
        const coordinatorServerConfigs = {
            HTTP_PORT: 3000, // Only used in default instantiation in 0x-coordinator-server/server.js; not used here
            CHAIN_ID_TO_SETTINGS: {
                // TODO: change to CHAIN_ID_TO_SETTINGS when @0x/coordinator-server is ready
                [chainId]: {
                    FEE_RECIPIENTS: [feeRecipientAddressOne, feeRecipientAddressTwo, feeRecipientAddressThree].map(
                        address => {
                            return {
                                ADDRESS: address,
                                PRIVATE_KEY: constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(address)].toString(
                                    'hex',
                                ),
                            };
                        },
                    ),
                    // Ethereum RPC url, only used in the default instantiation in 0x-coordinator-server/server.js
                    // Not used here when instantiating with the imported app
                    RPC_URL: 'http://ignore',
                },
            },
            NETWORK_ID_TO_CONTRACT_ADDRESSES: {
                // TODO: change to CHAIN_ID_TO_CONTRACT_ADDRESSES when @0x/coordinator-server is ready
                [chainId]: getContractAddressesForChainOrThrow(chainId),
            },
            // Optional selective delay on fill requests
            SELECTIVE_DELAY_MS: 0,
            EXPIRATION_DURATION_SECONDS: 60, // 1 minute
        };

        // start coordinator servers
        const serverScenarios: Array<[string, string]> = [
            ['coord_server_1', coordinatorPort],
            ['coord_server_2', anotherCoordinatorPort],
        ];
        await Promise.all(
            serverScenarios.map(async ([name, port]) => {
                const app = await getAppAsync(
                    {
                        [chainId]: env.provider,
                    },
                    coordinatorServerConfigs,
                    {
                        name,
                        type: 'sqlite',
                        database: ':memory:',
                        entities: defaultOrmConfig.entities,
                        cli: defaultOrmConfig.cli,
                        logging: defaultOrmConfig.logging,
                        synchronize: defaultOrmConfig.synchronize,
                    },
                );
                app.listen(port, () => {
                    logUtils.log(`Coordinator SERVER API (HTTP) listening on port ${port}!`);
                });
                return app;
            }),
        );

        // register coordinator servers
        [
            [feeRecipientAddressOne, coordinatorPort],
            [feeRecipientAddressTwo, coordinatorPort],
            [feeRecipientAddressThree, anotherCoordinatorPort],
        ].forEach(async ([address, port]) => {
            await coordinatorRegistry
                .setCoordinatorEndpoint(`${coordinatorEndpoint}${port}`)
                .awaitTransactionSuccessAsync(
                    { from: address },
                    { pollingIntervalMs: constants.AWAIT_TRANSACTION_MINED_MS },
                );
        });
    });
    beforeEach(async () => {
        signedOrder = await orderFactory.newSignedOrderAsync();
        anotherSignedOrder = await orderFactory.newSignedOrderAsync();
        signedOrderWithDifferentFeeRecipient = await orderFactory.newSignedOrderAsync({
            feeRecipientAddress: feeRecipientAddressTwo,
        });
        signedOrderWithDifferentCoordinatorOperator = await orderFactory.newSignedOrderAsync({
            feeRecipientAddress: feeRecipientAddressThree,
        });
        makerToken.setBalance(makerAddress, constants.INITIAL_ERC20_BALANCE);
        takerToken.setBalance(takerAddress, constants.INITIAL_ERC20_BALANCE);
    });
    describe('test setup', () => {
        it('should have coordinator registry which returns an endpoint', async () => {
            const setCoordinatorEndpoint = await coordinatorRegistry
                .getCoordinatorEndpoint(feeRecipientAddressOne)
                .callAsync();
            const anotherSetCoordinatorEndpoint = await coordinatorRegistry
                .getCoordinatorEndpoint(feeRecipientAddressThree)
                .callAsync();
            expect(setCoordinatorEndpoint).to.equal(`${coordinatorEndpoint}${coordinatorPort}`);
            expect(anotherSetCoordinatorEndpoint).to.equal(`${coordinatorEndpoint}${anotherCoordinatorPort}`);
        });
        it('should have coordinator server endpoints which respond to pings', async () => {
            let result = await fetchAsync(`${coordinatorEndpoint}${coordinatorPort}/v2/ping`);
            expect(result.status).to.equal(200);
            expect(await result.text()).to.equal('pong');

            result = await fetchAsync(`${coordinatorEndpoint}${anotherCoordinatorPort}/v2/ping`);
            expect(result.status).to.equal(200);
            expect(await result.text()).to.equal('pong');
        });
    });
    // fill handling is the same for all fill methods so we can test them all through the fillOrder and batchFillOrders interfaces
    describe('#fillOrderAsync', () => {
        it('should fill a valid order', async () => {
            txHash = await coordinatorClient.fillOrderAsync(
                signedOrder,
                takerTokenFillAmount,
                signedOrder.signature,
                { from: takerAddress },
                { shouldValidate: true },
            );
            await env.web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        });
    });
    describe('#batchFillOrdersAsync', () => {
        it('should fill a batch of valid orders', async () => {
            const signedOrders = [signedOrder, anotherSignedOrder];
            const takerAssetFillAmounts = Array(2).fill(takerTokenFillAmount);
            txHash = await coordinatorClient.batchFillOrdersAsync(
                signedOrders,
                takerAssetFillAmounts,
                signedOrders.map(o => o.signature),
                { from: takerAddress, value: DEFAULT_PROTOCOL_FEE_MULTIPLIER.times(signedOrders.length) },
            );

            await env.web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        });
        it('should fill a batch of orders with different feeRecipientAddresses with the same coordinator server', async () => {
            const signedOrders = [signedOrder, anotherSignedOrder, signedOrderWithDifferentFeeRecipient];
            const takerAssetFillAmounts = Array(3).fill(takerTokenFillAmount);
            txHash = await coordinatorClient.batchFillOrdersAsync(
                signedOrders,
                takerAssetFillAmounts,
                signedOrders.map(o => o.signature),
                { from: takerAddress, value: DEFAULT_PROTOCOL_FEE_MULTIPLIER.times(signedOrders.length) },
            );

            await env.web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
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
            txHash = await coordinatorClient.batchFillOrdersAsync(
                signedOrders,
                takerAssetFillAmounts,
                signedOrders.map(o => o.signature),
                { from: takerAddress },
            );

            await env.web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        });

        it('should fill a batch of mixed coordinator and non-coordinator orders', async () => {
            const nonCoordinatorOrder = await orderFactory.newSignedOrderAsync({
                senderAddress: constants.NULL_ADDRESS,
            });
            const signedOrders = [signedOrder, nonCoordinatorOrder];
            const takerAssetFillAmounts = Array(2).fill(takerTokenFillAmount);
            txHash = await coordinatorClient.batchFillOrdersAsync(
                signedOrders,
                takerAssetFillAmounts,
                signedOrders.map(o => o.signature),
                { from: takerAddress, value: DEFAULT_PROTOCOL_FEE_MULTIPLIER.multipliedBy(signedOrders.length) },
            );
            await env.web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        });
    });
    describe('#softCancelAsync, #batchSoftCancelAsync', () => {
        it('should soft cancel a valid order', async () => {
            const response = await coordinatorClient.softCancelAsync(signedOrder);
            expect(response.outstandingFillSignatures).to.have.lengthOf(0);
            expect(response.cancellationSignatures).to.have.lengthOf(1);
        });

        it('should soft cancel a batch of valid orders', async () => {
            const orders = [signedOrder, anotherSignedOrder];
            const response = await coordinatorClient.batchSoftCancelAsync(orders);
            expect(response).to.have.lengthOf(1);
            expect(response[0].outstandingFillSignatures).to.have.lengthOf(0);
            expect(response[0].cancellationSignatures).to.have.lengthOf(1);
        });
        it('should soft cancel a batch of orders with different feeRecipientAddresses', async () => {
            const orders = [signedOrder, anotherSignedOrder, signedOrderWithDifferentFeeRecipient];
            const response = await coordinatorClient.batchSoftCancelAsync(orders);
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
            const response = await coordinatorClient.batchSoftCancelAsync(orders);
            expect(response).to.have.lengthOf(2);
            expect(response[0].outstandingFillSignatures).to.have.lengthOf(0);
            expect(response[0].cancellationSignatures).to.have.lengthOf(3);
            expect(response[1].cancellationSignatures).to.have.lengthOf(3); // both coordinator servers support the same feeRecipients
        });
    });
    describe('#hardCancelOrderAsync, #batchHardCancelOrdersAsync, #cancelOrdersUpToAsync', () => {
        it('should hard cancel a valid order', async () => {
            txHash = await coordinatorClient.hardCancelOrderAsync(signedOrder, { from: makerAddress });
            await env.web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        });

        it('should hard cancel a batch of valid orders', async () => {
            const orders = [signedOrder, anotherSignedOrder];
            txHash = await coordinatorClient.batchHardCancelOrdersAsync(orders, { from: makerAddress });
            await env.web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        });
        it('should hard cancel orders up to target order epoch', async () => {
            const targetOrderEpoch = new BigNumber(42);
            txHash = await coordinatorClient.hardCancelOrdersUpToAsync(targetOrderEpoch, { from: makerAddress });

            await env.web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);

            const exchange = new ExchangeContract(contractAddresses.exchange, env.provider);
            const orderEpoch = await exchange.orderEpoch(makerAddress, contractAddresses.coordinator).callAsync();
            expect(orderEpoch).to.be.bignumber.equal(targetOrderEpoch.plus(1));
        });
    });
    describe('coordinator edge cases', () => {
        let badOrder: SignedOrder;
        beforeEach('setup order with non-registered feeRecipient', async () => {
            badOrder = await orderFactory.newSignedOrderAsync({
                feeRecipientAddress: feeRecipientAddressFour,
            });
        });
        it('should throw error when feeRecipientAddress is not in registry', async () => {
            await expect(
                coordinatorClient.fillOrderAsync(badOrder, takerTokenFillAmount, badOrder.signature, {
                    from: takerAddress,
                }),
            ).to.eventually.be.rejected();
        });
        it('should throw informative error when coordinator endpoint does not work', async () => {
            await env.web3Wrapper.awaitTransactionSuccessAsync(
                await coordinatorRegistry.setCoordinatorEndpoint('http://badUri.com').sendTransactionAsync({
                    from: feeRecipientAddressFour,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await expect(
                coordinatorClient.fillOrderAsync(badOrder, takerTokenFillAmount, badOrder.signature, {
                    from: takerAddress,
                }),
            ).to.eventually.be.rejectedWith(CoordinatorServerErrorMsg.FillFailed);
        });
    });
    describe('coordinator server errors', () => {
        serverValidationError = {
            code: 1004,
            reason: '',
            validationErrors: [
                {
                    field: 'signedTransaction',
                    code: 1004,
                    reason:
                        'A transaction can only be approved once. To request approval to perform the same actions, generate and sign an identical transaction with a different salt value.',
                },
            ],
        };
        beforeEach(async () => {
            nock(`${coordinatorEndpoint}${coordinatorPort}`)
                .post('/v2/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(400, serverValidationError);
        });
        afterEach(async () => {
            nock.cleanAll();
        });
        it('should throw error when softCancel fails', async () => {
            await coordinatorClient
                .softCancelAsync(signedOrder)
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
                });
        });

        it('should throw error when batch soft cancel totally fails with single coordinator operator', async () => {
            const orders = [signedOrder, signedOrderWithDifferentFeeRecipient];
            await coordinatorClient
                .batchSoftCancelAsync(orders)
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
                });
        });
        it('should throw consolidated error when batch soft cancel partially fails with different coordinator operators', async () => {
            const serverCancellationSuccess = {
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
            nock(`${coordinatorEndpoint}${anotherCoordinatorPort}`)
                .post('/v2/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(200, serverCancellationSuccess);

            const signedOrders = [signedOrder, signedOrderWithDifferentCoordinatorOperator];
            await coordinatorClient
                .batchSoftCancelAsync(signedOrders)
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
                });
        });
        it('should throw consolidated error when batch soft cancel totally fails with different coordinator operators', async () => {
            nock(`${coordinatorEndpoint}${anotherCoordinatorPort}`)
                .post('/v2/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(400, serverValidationError);

            const signedOrders = [signedOrder, signedOrderWithDifferentCoordinatorOperator];
            await coordinatorClient
                .batchSoftCancelAsync(signedOrders)
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
                });
        });
        it('should throw error when a fill fails', async () => {
            await coordinatorClient
                .fillOrderAsync(signedOrder, takerTokenFillAmount, signedOrder.signature, { from: takerAddress })
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
                });
        });
        it('should throw error when batch fill fails with single coordinator operator', async () => {
            const signedOrders = [signedOrder, signedOrderWithDifferentFeeRecipient];
            const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount, takerTokenFillAmount];
            await coordinatorClient
                .batchFillOrdersAsync(signedOrders, takerAssetFillAmounts, signedOrders.map(o => o.signature), {
                    from: takerAddress,
                })
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
                });
        });
        it('should throw consolidated error when batch fill partially fails with different coordinator operators', async () => {
            const serverApprovalSuccess = {
                signatures: [
                    '0x1cc07d7ae39679690a91418d46491520f058e4fb14debdf2e98f2376b3970de8512ace44af0be6d1c65617f7aae8c2364ff63f241515ee1559c3eeecb0f671d9e903',
                ],
                expirationTimeSeconds: 1552390014,
            };
            nock(`${coordinatorEndpoint}${anotherCoordinatorPort}`)
                .post('/v2/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(200, serverApprovalSuccess);

            const signedOrders = [signedOrder, signedOrderWithDifferentCoordinatorOperator];
            const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount, takerTokenFillAmount];
            await coordinatorClient
                .batchFillOrdersAsync(signedOrders, takerAssetFillAmounts, signedOrders.map(o => o.signature), {
                    from: takerAddress,
                })
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
                });
        });
        it('should throw consolidated error when batch fill totally fails with different coordinator operators', async () => {
            nock(`${coordinatorEndpoint}${anotherCoordinatorPort}`)
                .post('/v2/request_transaction', () => true)
                .query({
                    chainId: 1337,
                })
                .reply(400, serverValidationError);

            const signedOrders = [signedOrder, signedOrderWithDifferentCoordinatorOperator];
            const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount, takerTokenFillAmount];
            await coordinatorClient
                .batchFillOrdersAsync(signedOrders, takerAssetFillAmounts, signedOrders.map(o => o.signature), {
                    from: takerAddress,
                })
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
                });
        });
    });
});
// tslint:disable:max-file-line-count
