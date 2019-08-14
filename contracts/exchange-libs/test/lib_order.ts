import { addressUtils, blockchainTests, constants, describe, expect } from '@0x/contracts-test-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { artifacts, TestLibOrderContract } from '../src';

blockchainTests('LibOrder', env => {
    let libOrderContract: TestLibOrderContract;
    let order: Order;
    before(async () => {
        libOrderContract = await TestLibOrderContract.deployFrom0xArtifactAsync(
            artifacts.TestLibOrder,
            env.provider,
            env.txDefaults,
        );
        const domain = {
            verifyingContractAddress: libOrderContract.address,
            chainId: 1,
        };
        order = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: addressUtils.generatePseudoRandomAddress(),
            takerAddress: addressUtils.generatePseudoRandomAddress(),
            senderAddress: addressUtils.generatePseudoRandomAddress(),
            feeRecipientAddress: addressUtils.generatePseudoRandomAddress(),
            makerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            salt: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
            domain,
        };
    });

    describe('LibOrder', () => {
        describe('getOrderHash', () => {
            it('should return the correct orderHash', async () => {
                const domainHash = ethUtil.bufferToHex(
                    signTypedDataUtils.generateDomainHash({
                        ...order.domain,
                        name: constants.EIP712_DOMAIN_NAME,
                        version: constants.EIP712_DOMAIN_VERSION,
                    }),
                );
                const orderHashHex = await libOrderContract.getTypedDataHash.callAsync(order, domainHash);
                expect(orderHashUtils.getOrderHashHex(order)).to.be.equal(orderHashHex);
            });
            it('orderHash should differ if the domain hash is different', async () => {
                const domainHash1 = ethUtil.bufferToHex(
                    signTypedDataUtils.generateDomainHash({
                        ...order.domain,
                        name: constants.EIP712_DOMAIN_NAME,
                        version: constants.EIP712_DOMAIN_VERSION,
                    }),
                );
                const domainHash2 = ethUtil.bufferToHex(
                    signTypedDataUtils.generateDomainHash({
                        ...order.domain,
                        name: constants.EIP712_DOMAIN_NAME,
                        version: constants.EIP712_DOMAIN_VERSION,
                        chainId: 1337,
                    }),
                );
                const orderHashHex1 = await libOrderContract.getTypedDataHash.callAsync(order, domainHash1);
                const orderHashHex2 = await libOrderContract.getTypedDataHash.callAsync(order, domainHash2);
                expect(orderHashHex1).to.be.not.equal(orderHashHex2);
            });
        });
    });
});
