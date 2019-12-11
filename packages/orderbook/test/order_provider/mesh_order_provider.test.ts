import { BigNumber, WSClient } from '@0x/mesh-rpc-client';
import * as sinon from 'sinon';

import { MeshOrderProvider } from '../../src';
import { BaseOrderProvider } from '../../src/order_provider/base_order_provider';
import { OrderStore } from '../../src/order_store';
import { utils } from '../../src/utils';
import { createOrder } from '../utils';

import { SERVER_PORT, setupServerAsync, stopServer } from './mock_ws_server';

describe('MeshOrderProvider', () => {
    let orderStore: OrderStore;
    let provider: BaseOrderProvider;
    const stubs: sinon.SinonStub[] = [];

    const websocketEndpoint = `ws://localhost:${SERVER_PORT}`;
    const makerAssetData = '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359';
    const takerAssetData = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const subscriptionId = 'subscriptionId';
    const addedResponse = {
        jsonrpc: '2.0',
        method: 'mesh_subscription',
        params: {
            subscription: subscriptionId,
            result: [
                {
                    orderHash: '0xa452cc6e2c7756376f0f2379e7dd81aa9285b26515774d0ad8801a4c243a30a3',
                    signedOrder: {
                        chainId: 1337,
                        exchangeAddress: '0x4eacd0af335451709e1e7b570b8ea68edec8bc97',
                        makerAddress: '0x8c5c2671b71bad73d8b6fb7e8ef6fe5ec95ff661',
                        makerAssetData,
                        makerFeeAssetData: '0x',
                        makerAssetAmount: '19501674723',
                        makerFee: '0',
                        takerAddress: '0x0000000000000000000000000000000000000000',
                        takerAssetData,
                        takerFeeAssetData: '0x',
                        takerAssetAmount: '132880707765170593819',
                        takerFee: '0',
                        senderAddress: '0x0000000000000000000000000000000000000000',
                        feeRecipientAddress: '0x0000000000000000000000000000000000000000',
                        expirationTimeSeconds: '1574687060',
                        salt: '1574686820004',
                        signature:
                            '0x1b64e67271f10832485356d9ef203b7e2c855067c1253b4e66ee06e85cd46427b157fc4c60f86bd637291f971d1443f65f631b76b887b7f82ebb36499f2f9cf10d03',
                    },
                    endState: 'ADDED',
                    fillableTakerAssetAmount: '132880707765170593819',
                    contractEvents: [],
                },
            ],
        },
    };
    const removedResponse = {
        ...addedResponse,
        ...{
            params: {
                ...addedResponse.params,
                result: [{ ...addedResponse.params.result[0], endState: 'CANCELLED', fillableTakerAssetAmount: '0' }],
            },
        },
    };

    let wsServer: any;
    let connection: any;
    afterEach(() => {
        void provider.destroyAsync();
        stubs.forEach(s => s.restore());
        stopServer();
    });
    beforeEach(async () => {
        orderStore = new OrderStore();
        stubs.push(
            sinon
                .stub(WSClient.prototype as any, '_startInternalLivenessCheckAsync')
                .callsFake(async () => Promise.resolve()),
        );
    });
    describe('#createSubscriptionForAssetPairAsync', () => {
        beforeEach(async () => {
            wsServer = await setupServerAsync();
            wsServer.on('connect', (conn: any) => {
                connection = conn;
                conn.on('message', (message: any) => {
                    const jsonRpcRequest = JSON.parse(message.utf8Data);
                    if (jsonRpcRequest.method === 'mesh_subscribe') {
                        connection.sendUTF(
                            JSON.stringify({
                                id: jsonRpcRequest.id,
                                jsonrpc: '2.0',
                                result: subscriptionId,
                            }),
                        );
                    }
                });
            });
        });
        test('fetches order on  first subscription', async () => {
            const getOrdersStub = sinon
                .stub(WSClient.prototype, 'getOrdersAsync')
                .callsFake(async () => Promise.resolve([]));
            stubs.push(getOrdersStub);
            const subscriptionStub = sinon
                .stub(WSClient.prototype, 'subscribeToOrdersAsync')
                .callsFake(async () => Promise.resolve('suscriptionId'));
            stubs.push(subscriptionStub);
            provider = new MeshOrderProvider({ websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            expect(getOrdersStub.callCount).toBe(1);
            expect(subscriptionStub.callCount).toBe(1);
        });
        test('fetches once when the same subscription is called', async () => {
            const stub = sinon.stub(WSClient.prototype, 'getOrdersAsync').callsFake(async () => Promise.resolve([]));
            stubs.push(stub);
            stubs.push(
                sinon
                    .stub(WSClient.prototype, 'subscribeToOrdersAsync')
                    .callsFake(async () => Promise.resolve(subscriptionId)),
            );
            provider = new MeshOrderProvider({ websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            expect(stub.callCount).toBe(1);
        });
        test('stores the orders', async () => {
            const order = createOrder(makerAssetData, takerAssetData);
            const orderInfo = {
                orderHash: '0x00',
                signedOrder: order.order,
                fillableTakerAssetAmount: new BigNumber(1),
            };
            stubs.push(
                sinon.stub(WSClient.prototype, 'getOrdersAsync').callsFake(async () => Promise.resolve([orderInfo])),
            );
            stubs.push(
                sinon
                    .stub(WSClient.prototype, 'subscribeToOrdersAsync')
                    .callsFake(async () => Promise.resolve(subscriptionId)),
            );
            provider = new MeshOrderProvider({ websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            const orders = await orderStore.getOrderSetForAssetsAsync(makerAssetData, takerAssetData);
            expect(orders.size()).toBe(1);
        });
        test('stores the orders from a subscription update', async () => {
            const eventResponse = JSON.stringify(addedResponse);
            stubs.push(sinon.stub(WSClient.prototype, 'getOrdersAsync').callsFake(async () => Promise.resolve([])));
            provider = new MeshOrderProvider({ websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            connection.sendUTF(eventResponse);
            await utils.delayAsync(100);
            const orders = await orderStore.getOrderSetForAssetsAsync(makerAssetData, takerAssetData);
            expect(orders.size()).toBe(1);
        });
        test('removes orders on a subscription update', async () => {
            const added = JSON.stringify(addedResponse);
            const removed = JSON.stringify(removedResponse);
            stubs.push(sinon.stub(WSClient.prototype, 'getOrdersAsync').callsFake(async () => Promise.resolve([])));
            provider = new MeshOrderProvider({ websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            connection.sendUTF(added);
            await utils.delayAsync(100);
            const orders = await orderStore.getOrderSetForAssetsAsync(makerAssetData, takerAssetData);
            expect(orders.size()).toBe(1);
            connection.sendUTF(removed);
            await utils.delayAsync(100);
            expect(orders.size()).toBe(0);
        });
    });
    describe('reconnnect', () => {
        test.skip('revalidates all stored orders', async () => {
            wsServer = await setupServerAsync();
            const orderInfoResponse = {
                jsonrpc: '2.0',
                result: {
                    accepted: [],
                    rejected: [{ ...addedResponse.params.result[0], kind: 'CANCELLED', fillableTakerAssetAmount: 0 }],
                },
            };
            wsServer.on('connect', (conn: any) => {
                connection = conn;
                conn.on('message', (message: any) => {
                    const jsonRpcRequest = JSON.parse(message.utf8Data);
                    if (jsonRpcRequest.method === 'mesh_subscribe') {
                        connection.sendUTF(
                            JSON.stringify({
                                id: jsonRpcRequest.id,
                                jsonrpc: '2.0',
                                result: subscriptionId,
                            }),
                        );
                    } else if (jsonRpcRequest.method === 'mesh_addOrders') {
                        connection.sendUTF(
                            JSON.stringify({
                                id: jsonRpcRequest.id,
                                ...orderInfoResponse,
                            }),
                        );
                    }
                });
            });

            const getOrdersStub = sinon
                .stub(WSClient.prototype, 'getOrdersAsync')
                .callsFake(async () => Promise.resolve([]));
            const addOrdersStub = sinon
                .stub(WSClient.prototype, 'addOrdersAsync')
                .callsFake(async () => Promise.resolve({ accepted: [], rejected: [] }));
            stubs.push(getOrdersStub);
            stubs.push(addOrdersStub);
            provider = new MeshOrderProvider(
                {
                    websocketEndpoint,
                    wsOpts: {
                        reconnectAfter: 1,
                        clientConfig: {
                            fragmentOutgoingMessages: false,
                        },
                    },
                },
                orderStore,
            );
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            const orders = await orderStore.getOrderSetForAssetsAsync(makerAssetData, takerAssetData);
            expect(getOrdersStub.callCount).toBe(1);
            // Orders are not added on a subscription, only during reconnnect
            expect(addOrdersStub.callCount).toBe(0);
            const added = JSON.stringify(addedResponse);
            connection.sendUTF(added);
            await utils.delayAsync(100);
            expect(orders.size()).toBe(1);
            // Drop the connection and check orders are re-validated
            connection.drop();
            await utils.delayAsync(100);
            expect(addOrdersStub.callCount).toBe(1);
        });
    });
    describe('#getAvailableAssetDatasAsync', () => {
        test('stores the orders', async () => {
            const order = createOrder(makerAssetData, takerAssetData);
            const orderInfo = {
                orderHash: '0x00',
                signedOrder: order.order,
                fillableTakerAssetAmount: new BigNumber(1),
            };
            stubs.push(
                sinon.stub(WSClient.prototype, 'getOrdersAsync').callsFake(async () => Promise.resolve([orderInfo])),
            );
            stubs.push(
                sinon
                    .stub(WSClient.prototype, 'subscribeToOrdersAsync')
                    .callsFake(async () => Promise.resolve(subscriptionId)),
            );
            provider = new MeshOrderProvider({ websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            const assetPairs = await provider.getAvailableAssetDatasAsync();
            expect(assetPairs.length).toBe(2);
            const assetDataA = {
                assetData: makerAssetData,
                maxAmount: new BigNumber(
                    '115792089237316195423570985008687907853269984665640564039457584007913129639935',
                ),
                minAmount: new BigNumber('0'),
                precision: 18,
            };
            const assetDataB = {
                ...assetDataA,
                assetData: takerAssetData,
            };
            expect(assetPairs).toMatchObject([
                { assetDataA, assetDataB },
                { assetDataA: assetDataB, assetDataB: assetDataA },
            ]);
        });
    });
});
