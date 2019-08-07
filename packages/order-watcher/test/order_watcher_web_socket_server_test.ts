import { ContractAddresses } from '@0x/contract-addresses';
import { ContractWrappers } from '@0x/contract-wrappers';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { ExchangeContractErrs, OrderStateInvalid, SignedOrder } from '@0x/types';
import { BigNumber, logUtils, tokenUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import 'mocha';
import * as WebSocket from 'websocket';

import { OrderWatcherWebSocketServer } from '../src/order_watcher/order_watcher_web_socket_server';
import { AddOrderRequest, OrderWatcherMethod, RemoveOrderRequest } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { migrateOnceAsync } from './utils/migrate';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

interface WsMessage {
    data: string;
}

describe('OrderWatcherWebSocketServer', async () => {
    let contractWrappers: ContractWrappers;
    let wsServer: OrderWatcherWebSocketServer;
    let wsClient: WebSocket.w3cwebsocket;
    let wsClientTwo: WebSocket.w3cwebsocket;
    let fillScenarios: FillScenarios;
    let userAddresses: string[];
    let makerAssetData: string;
    let takerAssetData: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAddress: string;
    let takerAddress: string;
    let zrxTokenAddress: string;
    let signedOrder: SignedOrder;
    let orderHash: string;
    let addOrderPayload: AddOrderRequest;
    let removeOrderPayload: RemoveOrderRequest;
    let networkId: number;
    let contractAddresses: ContractAddresses;
    const decimals = constants.ZRX_DECIMALS;
    const fillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals);

    before(async () => {
        // Set up constants
        contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        networkId = constants.TESTRPC_NETWORK_ID;
        const config = {
            networkId,
            contractAddresses,
        };
        contractWrappers = new ContractWrappers(provider, config);
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        zrxTokenAddress = contractAddresses.zrxToken;
        [makerAddress, takerAddress] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            contractAddresses.exchange,
            contractAddresses.erc20Proxy,
            contractAddresses.erc721Proxy,
        );
        signedOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            takerAddress,
            fillableAmount,
        );
        orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        addOrderPayload = {
            id: 1,
            jsonrpc: '2.0',
            method: OrderWatcherMethod.AddOrder,
            params: { signedOrder },
        };
        removeOrderPayload = {
            id: 1,
            jsonrpc: '2.0',
            method: OrderWatcherMethod.RemoveOrder,
            params: { orderHash },
        };
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        // Prepare OrderWatcher WebSocket server
        const orderWatcherConfig = {
            isVerbose: true,
        };
        wsServer = new OrderWatcherWebSocketServer(provider, networkId, contractAddresses, orderWatcherConfig);
        wsServer.start();
        await blockchainLifecycle.startAsync();
        wsClient = new WebSocket.w3cwebsocket('ws://127.0.0.1:8080/');
        logUtils.log(`${new Date()} [Client] Connected.`);
    });
    afterEach(async () => {
        wsClient.close();
        await blockchainLifecycle.revertAsync();
        wsServer.stop();
        logUtils.log(`${new Date()} [Client] Closed.`);
    });

    it('responds to getStats requests correctly', (done: any) => {
        const payload = {
            id: 1,
            jsonrpc: '2.0',
            method: 'GET_STATS',
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(payload));
        wsClient.onmessage = (msg: any) => {
            const responseData = JSON.parse(msg.data);
            expect(responseData.id).to.be.eq(1);
            expect(responseData.jsonrpc).to.be.eq('2.0');
            expect(responseData.method).to.be.eq('GET_STATS');
            expect(responseData.result.orderCount).to.be.eq(0);
            done();
        };
    });

    it('throws an error when an invalid method is attempted', async () => {
        const invalidMethodPayload = {
            id: 1,
            jsonrpc: '2.0',
            method: 'BAD_METHOD',
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(invalidMethodPayload));
        const errorMsg = await onMessageAsync(wsClient, null);
        const errorData = JSON.parse(errorMsg.data);
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.id).to.be.null;
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.method).to.be.null;
        expect(errorData.jsonrpc).to.be.eq('2.0');
        expect(errorData.error).to.match(/^Error: Expected request to conform to schema/);
    });

    it('throws an error when jsonrpc field missing from request', async () => {
        const noJsonRpcPayload = {
            id: 1,
            method: 'GET_STATS',
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(noJsonRpcPayload));
        const errorMsg = await onMessageAsync(wsClient, null);
        const errorData = JSON.parse(errorMsg.data);
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.method).to.be.null;
        expect(errorData.jsonrpc).to.be.eq('2.0');
        expect(errorData.error).to.match(/^Error: Expected request to conform to schema/);
    });

    it('throws an error when we try to add an order without a signedOrder', async () => {
        const noSignedOrderAddOrderPayload = {
            id: 1,
            jsonrpc: '2.0',
            method: 'ADD_ORDER',
            orderHash: '0x7337e2f2a9aa2ed6afe26edc2df7ad79c3ffa9cf9b81a964f707ea63f5272355',
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(noSignedOrderAddOrderPayload));
        const errorMsg = await onMessageAsync(wsClient, null);
        const errorData = JSON.parse(errorMsg.data);
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.id).to.be.null;
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.method).to.be.null;
        expect(errorData.jsonrpc).to.be.eq('2.0');
        expect(errorData.error).to.match(/^Error: Expected request to conform to schema/);
    });

    it('throws an error when we try to add a bad signedOrder', async () => {
        const invalidAddOrderPayload = {
            id: 1,
            jsonrpc: '2.0',
            method: 'ADD_ORDER',
            signedOrder: {
                makerAddress: '0x0',
            },
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(invalidAddOrderPayload));
        const errorMsg = await onMessageAsync(wsClient, null);
        const errorData = JSON.parse(errorMsg.data);
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.id).to.be.null;
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.method).to.be.null;
        expect(errorData.error).to.match(/^Error: Expected request to conform to schema/);
    });

    it('executes addOrder and removeOrder requests correctly', async () => {
        wsClient.onopen = () => wsClient.send(JSON.stringify(addOrderPayload));
        const addOrderMsg = await onMessageAsync(wsClient, OrderWatcherMethod.AddOrder);
        const addOrderData = JSON.parse(addOrderMsg.data);
        expect(addOrderData.method).to.be.eq('ADD_ORDER');
        expect((wsServer as any)._orderWatcher._orderByOrderHash).to.deep.include({
            [orderHash]: signedOrder,
        });

        const clientOnMessagePromise = onMessageAsync(wsClient, OrderWatcherMethod.RemoveOrder);
        wsClient.send(JSON.stringify(removeOrderPayload));
        const removeOrderMsg = await clientOnMessagePromise;
        const removeOrderData = JSON.parse(removeOrderMsg.data);
        expect(removeOrderData.method).to.be.eq('REMOVE_ORDER');
        expect((wsServer as any)._orderWatcher._orderByOrderHash).to.not.deep.include({
            [orderHash]: signedOrder,
        });
    });

    it('broadcasts orderStateInvalid message when makerAddress allowance set to 0 for watched order', async () => {
        // Add the regular order
        wsClient.onopen = () => wsClient.send(JSON.stringify(addOrderPayload));

        // We register the onMessage callback before calling `setProxyAllowanceAsync` which we
        // expect will cause a message to be emitted. We do now "await" here, since we want to
        // check for messages _after_ calling `setProxyAllowanceAsync`
        const clientOnMessagePromise = onMessageAsync(wsClient, OrderWatcherMethod.Update);

        // Set the allowance to 0
        await contractWrappers.erc20Token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, new BigNumber(0));

        // We now await the `onMessage` promise to check for the message
        const orderWatcherUpdateMsg = await clientOnMessagePromise;
        const orderWatcherUpdateData = JSON.parse(orderWatcherUpdateMsg.data);
        expect(orderWatcherUpdateData.method).to.be.eq('UPDATE');
        const invalidOrderState = orderWatcherUpdateData.result as OrderStateInvalid;
        expect(invalidOrderState.isValid).to.be.false();
        expect(invalidOrderState.orderHash).to.be.eq(orderHash);
        expect(invalidOrderState.error).to.be.eq(ExchangeContractErrs.InsufficientMakerAllowance);
    });

    it('broadcasts to multiple clients when an order backing ZRX allowance changes', async () => {
        // Prepare order
        const makerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
        const takerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0), decimals);
        const nonZeroMakerFeeSignedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            makerFee,
            takerFee,
            makerAddress,
            takerAddress,
            fillableAmount,
            takerAddress,
        );
        const nonZeroMakerFeeOrderPayload = {
            id: 1,
            jsonrpc: '2.0',
            method: 'ADD_ORDER',
            params: {
                signedOrder: nonZeroMakerFeeSignedOrder,
            },
        };

        // Set up a second client and have it add the order
        wsClientTwo = new WebSocket.w3cwebsocket('ws://127.0.0.1:8080/');
        logUtils.log(`${new Date()} [Client] Connected.`);
        wsClientTwo.onopen = () => wsClientTwo.send(JSON.stringify(nonZeroMakerFeeOrderPayload));

        // Setup the onMessage callbacks, but don't await them yet
        const clientOneOnMessagePromise = onMessageAsync(wsClient, OrderWatcherMethod.Update);
        const clientTwoOnMessagePromise = onMessageAsync(wsClientTwo, OrderWatcherMethod.Update);

        // Change the allowance
        await contractWrappers.erc20Token.setProxyAllowanceAsync(zrxTokenAddress, makerAddress, new BigNumber(0));

        // Check that both clients receive the emitted event by awaiting the onMessageAsync promises
        let updateMsg = await clientOneOnMessagePromise;
        let updateData = JSON.parse(updateMsg.data);
        let orderState = updateData.result as OrderStateInvalid;
        expect(orderState.isValid).to.be.false();
        expect(orderState.error).to.be.eq('INSUFFICIENT_MAKER_FEE_ALLOWANCE');

        updateMsg = await clientTwoOnMessagePromise;
        updateData = JSON.parse(updateMsg.data);
        orderState = updateData.result as OrderStateInvalid;
        expect(orderState.isValid).to.be.false();
        expect(orderState.error).to.be.eq('INSUFFICIENT_MAKER_FEE_ALLOWANCE');

        wsClientTwo.close();
        logUtils.log(`${new Date()} [Client] Closed.`);
    });
});

// HACK: createFillableSignedOrderAsync is Promise-based, which forces us
// to use Promises instead of the done() callbacks for tests.
// onmessage callback must thus be wrapped as a Promise.
async function onMessageAsync(client: WebSocket.w3cwebsocket, method: string | null): Promise<WsMessage> {
    return new Promise<WsMessage>(resolve => {
        client.onmessage = (msg: WsMessage) => {
            const data = JSON.parse(msg.data);
            if (data.method === method) {
                resolve(msg);
            }
        };
    });
}
