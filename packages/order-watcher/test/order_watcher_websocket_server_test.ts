import { ContractWrappers } from '@0x/contract-wrappers';
import { tokenUtils } from '@0x/contract-wrappers/lib/test/utils/token_utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { ExchangeContractErrs, OrderStateInvalid, OrderStateValid, SignedOrder } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import 'mocha';
import * as WebSocket from 'websocket';

import { OrderWatcherWebSocketServer } from '../src/order_watcher/order_watcher_websocket_server';

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

describe.only('OrderWatcherWebSocketServer', async () => {
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
    // Manually encode types rather than use /src/types to mimick real data that user
    // would input. Otherwise we would be forced to use enums, which hide problems.
    let addOrderPayload: { id: string; jsonrpc: string; method: string; params: { signedOrder: SignedOrder } };
    let removeOrderPayload: { id: string; jsonrpc: string; method: string; params: { orderHash: string } };
    const decimals = constants.ZRX_DECIMALS;
    const fillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals);
    // HACK: createFillableSignedOrderAsync is Promise-based, which forces us
    // to use Promises instead of the done() callbacks for tests.
    // onmessage callback must thus be wrapped as a Promise.
    const _onMessageAsync = async (client: WebSocket.w3cwebsocket) =>
        new Promise<WsMessage>(resolve => {
            client.onmessage = (msg: WsMessage) => resolve(msg);
        });

    before(async () => {
        // Set up constants
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        const networkId = constants.TESTRPC_NETWORK_ID;
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
            id: 'addOrderPayload',
            jsonrpc: '2.0',
            method: 'ADD_ORDER',
            params: { signedOrder },
        };
        removeOrderPayload = {
            id: 'removeOrderPayload',
            jsonrpc: '2.0',
            method: 'REMOVE_ORDER',
            params: { orderHash },
        };

        // Prepare OrderWatcher WebSocket server
        const orderWatcherConfig = {};
        wsServer = new OrderWatcherWebSocketServer(provider, networkId, contractAddresses, orderWatcherConfig);
        wsServer.start();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
        wsServer.stop();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        wsClient = new WebSocket.w3cwebsocket('ws://127.0.0.1:8080/');
        logUtils.log(`${new Date()} [Client] Connected.`);
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
        wsClient.close();
        logUtils.log(`${new Date()} [Client] Closed.`);
    });

    it('responds to getStats requests correctly', (done: any) => {
        const payload = {
            id: 'getStats',
            jsonrpc: '2.0',
            method: 'GET_STATS',
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(payload));
        wsClient.onmessage = (msg: any) => {
            const responseData = JSON.parse(msg.data);
            expect(responseData.id).to.be.eq('getStats');
            expect(responseData.jsonrpc).to.be.eq('2.0');
            expect(responseData.method).to.be.eq('GET_STATS');
            expect(responseData.result.orderCount).to.be.eq(0);
            done();
        };
    });

    it('throws an error when an invalid method is attempted', async () => {
        const invalidMethodPayload = {
            id: 'invalidMethodPayload',
            jsonrpc: '2.0',
            method: 'BAD_METHOD',
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(invalidMethodPayload));
        const errorMsg = await _onMessageAsync(wsClient);
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
            id: 'noJsonRpcPayload',
            method: 'GET_STATS',
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(noJsonRpcPayload));
        const errorMsg = await _onMessageAsync(wsClient);
        const errorData = JSON.parse(errorMsg.data);
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.method).to.be.null;
        expect(errorData.jsonrpc).to.be.eq('2.0');
        expect(errorData.error).to.match(/^Error: Expected request to conform to schema/);
    });

    it('throws an error when we try to add an order without a signedOrder', async () => {
        const noSignedOrderAddOrderPayload = {
            id: 'noSignedOrderAddOrderPayload',
            jsonrpc: '2.0',
            method: 'ADD_ORDER',
            orderHash: '0x7337e2f2a9aa2ed6afe26edc2df7ad79c3ffa9cf9b81a964f707ea63f5272355',
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(noSignedOrderAddOrderPayload));
        const errorMsg = await _onMessageAsync(wsClient);
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
            id: 'invalidAddOrderPayload',
            jsonrpc: '2.0',
            method: 'ADD_ORDER',
            signedOrder: {
                makerAddress: '0x0',
            },
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(invalidAddOrderPayload));
        const errorMsg = await _onMessageAsync(wsClient);
        const errorData = JSON.parse(errorMsg.data);
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.id).to.be.null;
        // tslint:disable-next-line:no-unused-expression
        expect(errorData.method).to.be.null;
        expect(errorData.error).to.match(/^Error: Expected request to conform to schema/);
    });

    it('executes addOrder and removeOrder requests correctly', async () => {
        wsClient.onopen = () => wsClient.send(JSON.stringify(addOrderPayload));
        const addOrderMsg = await _onMessageAsync(wsClient);
        const addOrderData = JSON.parse(addOrderMsg.data);
        expect(addOrderData.method).to.be.eq('ADD_ORDER');
        expect((wsServer as any)._orderWatcher._orderByOrderHash).to.deep.include({
            [orderHash]: signedOrder,
        });

        wsClient.send(JSON.stringify(removeOrderPayload));
        const removeOrderMsg = await _onMessageAsync(wsClient);
        const removeOrderData = JSON.parse(removeOrderMsg.data);
        expect(removeOrderData.method).to.be.eq('REMOVE_ORDER');
        expect((wsServer as any)._orderWatcher._orderByOrderHash).to.not.deep.include({
            [orderHash]: signedOrder,
        });
    });

    it('broadcasts orderStateInvalid message when makerAddress allowance set to 0 for watched order', async () => {
        // Add the regular order
        wsClient.onopen = () => wsClient.send(JSON.stringify(addOrderPayload));
        await _onMessageAsync(wsClient);

        // Set the allowance to 0
        await contractWrappers.erc20Token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, new BigNumber(0));

        // Ensure that orderStateInvalid message is received.
        const orderWatcherUpdateMsg = await _onMessageAsync(wsClient);
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
            id: 'nonZeroMakerFeeOrderPayload',
            jsonrpc: '2.0',
            method: 'ADD_ORDER',
            signedOrder: nonZeroMakerFeeSignedOrder,
        };

        // Set up a second client and have it add the order
        wsClientTwo = new WebSocket.w3cwebsocket('ws://127.0.0.1:8080/');
        logUtils.log(`${new Date()} [Client] Connected.`);
        wsClientTwo.onopen = () => wsClientTwo.send(JSON.stringify(nonZeroMakerFeeOrderPayload));
        await _onMessageAsync(wsClientTwo);

        // Change the allowance
        await contractWrappers.erc20Token.setProxyAllowanceAsync(zrxTokenAddress, makerAddress, new BigNumber(0));

        // Check that both clients receive the emitted event
        for (const client of [wsClient, wsClientTwo]) {
            const updateMsg = await _onMessageAsync(client);
            const updateData = JSON.parse(updateMsg.data);
            const orderState = updateData.result as OrderStateValid;
            expect(orderState.isValid).to.be.true();
            expect(orderState.orderRelevantState.makerFeeProxyAllowance).to.be.eq('0');
        }

        wsClientTwo.close();
        logUtils.log(`${new Date()} [Client] Closed.`);
    });
});
