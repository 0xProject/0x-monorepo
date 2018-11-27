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

import { OrderWatcherWebSocketServer } from '../src/order_watcher/order_watcher_websocket';

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

describe.only('OrderWatcherWebSocket', async () => {
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
    let addOrderPayload: { action: string; params: { signedOrder: SignedOrder } };
    let removeOrderPayload: { action: string; params: { orderHash: string } };
    const decimals = constants.ZRX_DECIMALS;
    const fillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals);
    // createFillableSignedOrderAsync is Promise-based, which forces us
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
            action: 'addOrderAsync',
            params: { signedOrder },
        };
        removeOrderPayload = {
            action: 'removeOrder',
            params: { orderHash },
        };

        // Prepare OrderWatcher WebSocket server
        const orderWatcherConfig = {};
        wsServer = new OrderWatcherWebSocketServer(provider, networkId, contractAddresses, orderWatcherConfig);
        wsServer.listen();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
        wsServer.close();
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
            action: 'getStats',
            params: {},
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(payload));
        wsClient.onmessage = (msg: any) => {
            const responseData = JSON.parse(msg.data);
            expect(responseData.action).to.be.eq('getStats');
            expect(responseData.success).to.be.eq(1);
            expect(responseData.result.orderCount).to.be.eq(0);
            done();
        };
    });

    it('throws an error when an invalid action is attempted', async () => {
        const invalidActionPayload = {
            action: 'badAction',
            params: {},
        };
        wsClient.onopen = () => wsClient.send(JSON.stringify(invalidActionPayload));
        const errorMsg = await _onMessageAsync(wsClient);
        const errorData = JSON.parse(errorMsg.data);
        expect(errorData.action).to.be.eq('badAction');
        expect(errorData.success).to.be.eq(0);
        expect(errorData.result.error).to.be.eq('Error: [Server] Invalid request action: badAction');
    });

    it('executes addOrderAsync and removeOrder requests correctly', async () => {
        wsClient.onopen = () => wsClient.send(JSON.stringify(addOrderPayload));
        const addOrderMsg = await _onMessageAsync(wsClient);
        const addOrderData = JSON.parse(addOrderMsg.data);
        expect(addOrderData.action).to.be.eq('addOrderAsync');
        expect(addOrderData.success).to.be.eq(1);
        expect((wsServer._orderWatcher as any)._orderByOrderHash).to.deep.include({
            [orderHash]: signedOrder,
        });

        wsClient.send(JSON.stringify(removeOrderPayload));
        const removeOrderMsg = await _onMessageAsync(wsClient);
        const removeOrderData = JSON.parse(removeOrderMsg.data);
        expect(removeOrderData.action).to.be.eq('removeOrder');
        expect(removeOrderData.success).to.be.eq(1);
        expect((wsServer._orderWatcher as any)._orderByOrderHash).to.not.deep.include({
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
        expect(orderWatcherUpdateData.action).to.be.eq('orderWatcherUpdate');
        expect(orderWatcherUpdateData.success).to.be.eq(1);
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
            action: 'addOrderAsync',
            params: { nonZeroMakerFeeSignedOrder },
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
