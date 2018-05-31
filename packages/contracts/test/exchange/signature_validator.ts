import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');

import { TestSignatureValidatorContract } from '../../src/contract_wrappers/generated/test_signature_validator';
import { addressUtils } from '../../src/utils/address_utils';
import { artifacts } from '../../src/utils/artifacts';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { OrderFactory } from '../../src/utils/order_factory';
import { orderUtils } from '../../src/utils/order_utils';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('MixinSignatureValidator', () => {
    let signedOrder: SignedOrder;
    let orderFactory: OrderFactory;
    let signatureValidator: TestSignatureValidatorContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const makerAddress = accounts[0];
        signatureValidator = await TestSignatureValidatorContract.deployFrom0xArtifactAsync(
            artifacts.TestSignatureValidator,
            provider,
            txDefaults,
        );

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: signatureValidator.address,
            makerAddress,
            feeRecipientAddress: addressUtils.generatePseudoRandomAddress(),
            makerAssetData: assetProxyUtils.encodeERC20ProxyData(addressUtils.generatePseudoRandomAddress()),
            takerAssetData: assetProxyUtils.encodeERC20ProxyData(addressUtils.generatePseudoRandomAddress()),
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

    describe('isValidSignature', () => {
        beforeEach(async () => {
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should return true with a valid signature', async () => {
            const orderHashHex = orderUtils.getOrderHashHex(signedOrder);
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signedOrder.makerAddress,
                signedOrder.signature,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false with an invalid signature', async () => {
            const v = ethUtil.toBuffer(signedOrder.signature.slice(0, 4));
            const invalidR = ethUtil.sha3('invalidR');
            const invalidS = ethUtil.sha3('invalidS');
            const signatureType = ethUtil.toBuffer(`0x${signedOrder.signature.slice(-2)}`);
            const invalidSigBuff = Buffer.concat([v, invalidR, invalidS, signatureType]);
            const invalidSigHex = `0x${invalidSigBuff.toString('hex')}`;
            signedOrder.signature = invalidSigHex;
            const orderHashHex = orderUtils.getOrderHashHex(signedOrder);
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signedOrder.makerAddress,
                signedOrder.signature,
            );
            expect(isValidSignature).to.be.false();
        });
    });
});
