import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetProxyUtils, EIP712Utils, orderHashUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import * as chai from 'chai';

import { TestLibsContract } from '../../generated_contract_wrappers/test_libs';
import { addressUtils } from '../utils/address_utils';
import { artifacts } from '../utils/artifacts';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { OrderFactory } from '../utils/order_factory';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('LibOrder', () => {
    let signedOrder: SignedOrder;
    let orderFactory: OrderFactory;
    let libs: TestLibsContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const makerAddress = accounts[0];
        libs = await TestLibsContract.deployFrom0xArtifactAsync(artifacts.TestLibs, provider, txDefaults);

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: libs.address,
            makerAddress,
            feeRecipientAddress: addressUtils.generatePseudoRandomAddress(),
            makerAssetData: assetProxyUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerAssetData: assetProxyUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
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

    describe('getOrderSchema', () => {
        it('should output the correct order schema hash', async () => {
            const orderSchema = await libs.getOrderSchemaHash.callAsync();
            const schemaHashBuffer = orderHashUtils._getOrderSchemaBuffer();
            const schemaHashHex = `0x${schemaHashBuffer.toString('hex')}`;
            expect(schemaHashHex).to.be.equal(orderSchema);
        });
    });
    describe('getDomainSeparatorSchema', () => {
        it('should output the correct domain separator schema hash', async () => {
            const domainSeparatorSchema = await libs.getDomainSeparatorSchemaHash.callAsync();
            const domainSchemaBuffer = EIP712Utils._getDomainSeparatorSchemaBuffer();
            const schemaHashHex = `0x${domainSchemaBuffer.toString('hex')}`;
            expect(schemaHashHex).to.be.equal(domainSeparatorSchema);
        });
    });
    describe('getOrderHash', () => {
        it('should output the correct orderHash', async () => {
            signedOrder = orderFactory.newSignedOrder();
            const orderHashHex = await libs.publicGetOrderHash.callAsync(signedOrder);
            expect(orderHashUtils.getOrderHashHex(signedOrder)).to.be.equal(orderHashHex);
        });
    });
});
