import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { EtherscanResponse, EtherscanTransactionResponse } from '../../../src/data_sources/etherscan';
import { EtherscanTransaction } from '../../../src/entities';
import { parseEtherscanTransactions } from '../../../src/parsers/etherscan';
import { chaiSetup } from '../../utils/chai_setup';

import * as etherscanResponse from '../../fixtures/etherscan/api_v1_accounts_transactions.json';
import { ParsedEtherscanTransactions } from '../../fixtures/etherscan/api_v1_accounts_transactions';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('etherscan_transactions', () => {
    describe('parseEtherscanTransactions', () => {
        it('converts etherscanTransactions to EtherscanTransaction entities', () => {
            const response: EtherscanResponse = etherscanResponse;
            const expected = ParsedEtherscanTransactions;
            const actual = parseEtherscanTransactions(response.result);
            expect(actual).deep.equal(expected);
        });
    });
});
