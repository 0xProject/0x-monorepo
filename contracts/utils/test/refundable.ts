import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, TestRefundableContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Refundable', () => {
    let owner: string;
    let notOwner: string;
    let address: string;
    let refundable: TestRefundableContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [owner, address, notOwner] = _.slice(accounts, 0, 3);
        refundable = await TestRefundableContract.deployFrom0xArtifactAsync(
            artifacts.TestRefundable,
            provider,
            txDefaults,
            {},
        );
    });

    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });

    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('refund', async () => {
        it('should refund all of the ether sent to the simpleRefundFunction', async () => {
            await expect(
                refundable.simpleRefundFunction.sendTransactionAsync({
                    from: owner,
                    value: Web3Wrapper.toBaseUnitAmount(1, 18),
                }),
            ).to.be.fulfilled(''); // tslint:disable-line:await-promise
            expect(await web3Wrapper.getBalanceInWeiAsync(refundable.address)).bignumber.to.be.eq(
                constants.ZERO_AMOUNT,
            );
        });

        it('should refund all of the ether sent to the simpleReentrantRefundFunction with a counter of 2', async () => {
            await expect(
                refundable.simpleReentrantRefundFunction.sendTransactionAsync({
                    from: owner,
                    value: Web3Wrapper.toBaseUnitAmount(1, 18),
                }),
            ).to.be.fulfilled(''); // tslint:disable-line:await-promise
            expect(await web3Wrapper.getBalanceInWeiAsync(refundable.address)).bignumber.to.be.eq(
                constants.ZERO_AMOUNT,
            );
        });

        it('should refund all of the ether sent to the complexReentrantRefundFunction with a counter of 2', async () => {
            await expect(
                refundable.complexReentrantRefundFunction.sendTransactionAsync({
                    from: owner,
                    value: Web3Wrapper.toBaseUnitAmount(1, 18),
                }),
            ).to.be.fulfilled(''); // tslint:disable-line:await-promise
            expect(await web3Wrapper.getBalanceInWeiAsync(refundable.address)).bignumber.to.be.eq(
                constants.ZERO_AMOUNT,
            );
        });

        // FIXME - Receiver tests
    });
});
