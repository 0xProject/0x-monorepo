import {
    addressUtils,
    chaiSetup,
    constants,
    OrderFactory,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import * as chai from 'chai';

import { OrderHelperContract } from '../generated-wrappers/order_helper';
import { artifacts } from '../src/artifacts';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('OrderHelper extension', () => {
    let signedOrder: SignedOrder;
    let orderFactory: OrderFactory;
    let contract: OrderHelperContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const makerAddress = accounts[0];
        contract = await OrderHelperContract.deployFrom0xArtifactAsync(artifacts.OrderHelper, provider, txDefaults);

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: contract.address,
            makerAddress,
            feeRecipientAddress: addressUtils.generatePseudoRandomAddress(),
            makerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
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
    describe('OrderHelper', () => {
        describe('getOrderHash', () => {
            it('should output the correct orderHash', async () => {
                signedOrder = await orderFactory.newSignedOrderAsync();
                const orderHashHex = await contract.publicGetOrderHash.callAsync(signedOrder);
                expect(orderHashUtils.getOrderHashHex(signedOrder)).to.be.equal(orderHashHex);
            });
        });
    });
});
