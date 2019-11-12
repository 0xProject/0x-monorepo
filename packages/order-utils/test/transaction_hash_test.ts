import { ZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { transactionHashUtils } from '../src';

import { constants } from '../src/constants';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('0x transaction hashing', () => {
    describe('#getTransactionHashHex', () => {
        const expectedTransactionHash = '0x7845d260300acfbebaff52f0462f984016473290b9eb865fb6ffac0503cab364';
        const fakeVerifyingContractAddress = '0x5e72914535f202659083db3a02c984188fa26e9f';
        const fakeChainId = 1337;
        const transaction: ZeroExTransaction = {
            signerAddress: constants.NULL_ADDRESS,
            salt: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
            gasPrice: new BigNumber(0),
            data: constants.NULL_BYTES,
            domain: {
                verifyingContract: fakeVerifyingContractAddress,
                chainId: fakeChainId,
            },
        };
        it('calculates the transaction hash', async () => {
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            expect(transactionHash).to.be.equal(expectedTransactionHash);
        });
        it('calculates the transaction hash if amounts are strings', async () => {
            // It's common for developers using javascript to provide the amounts
            // as strings. Since we eventually toString() the BigNumber
            // before encoding we should result in the same orderHash in this scenario
            // tslint:disable-next-line:no-unnecessary-type-assertion
            const transactionHash = transactionHashUtils.getTransactionHashHex({
                ...transaction,
                salt: '0',
                expirationTimeSeconds: '0',
                gasPrice: '0',
            } as any);
            expect(transactionHash).to.be.equal(expectedTransactionHash);
        });
    });
});
