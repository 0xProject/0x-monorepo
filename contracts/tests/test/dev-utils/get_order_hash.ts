import { DevUtilsContract } from '@0x/contracts-dev-utils/lib/generated-wrappers/dev_utils';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { chaiSetup } from '@0x/contracts-test-utils';
import { SupportedProvider } from 'ethereum-types';

import * as chai from 'chai';
chaiSetup.configure();
const expect = chai.expect;

const NULL_ADDRESS = '0x' + '00'.repeat(20);

describe('DevUtils.getOrderHash', () => {
    it('should return the order hash', async () => {
        const expectedOrderHash = '0x331cb7e07a757bae130702da6646c26531798c92bcfaf671817268fd2c188531';
        const exchangeAddress = '0x1dc4c1cefef38a777b15aa20260a54e584b16c48';
        const chainId = 50;
        const order: Order = {
            makerAddress: NULL_ADDRESS,
            takerAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            feeRecipientAddress: NULL_ADDRESS,
            makerAssetData: NULL_ADDRESS,
            takerAssetData: NULL_ADDRESS,
            makerFeeAssetData: NULL_ADDRESS,
            takerFeeAssetData: NULL_ADDRESS,
            salt: new BigNumber(0),
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerAssetAmount: new BigNumber(0),
            takerAssetAmount: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
            exchangeAddress,
            chainId,
        };
        const devUtilsContract = new DevUtilsContract(NULL_ADDRESS, { isEIP1193: true } as SupportedProvider);
        expect(
            await devUtilsContract.getOrderHash(order, new BigNumber(chainId), exchangeAddress).callAsync(),
        ).to.be.equal(expectedOrderHash);
    });
});
