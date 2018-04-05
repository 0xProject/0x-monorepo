import { BlockchainLifecycle, devConstants } from '@0xproject/dev-utils';
import { LogWithDecodedArgs } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';

import { MetacoinContract, TransferContractEventArgs } from '../src/contract_wrappers/metacoin';

import { chaiSetup } from './utils/chai_setup';
import { deployer } from './utils/deployer';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const { expect } = chai;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Metacoin', () => {
    let metacoin: MetacoinContract;
    const ownerAddress = devConstants.TESTRPC_FIRST_ADDRESS;
    const INITIAL_BALANCE = new BigNumber(10000);
    before(async () => {
        const metacoinInstance = await deployer.deployAsync('Metacoin');
        web3Wrapper.abiDecoder.addABI(metacoinInstance.abi);
        metacoin = new MetacoinContract(metacoinInstance.abi, metacoinInstance.address, provider);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#constructor', () => {
        it(`should initialy give ${INITIAL_BALANCE} tokens to the creator`, async () => {
            const balance = await metacoin.balances.callAsync(ownerAddress);
            expect(balance).to.be.bignumber.equal(INITIAL_BALANCE);
        });
    });
    describe('#transfer', () => {
        it(`should successfully transfer tokens`, async () => {
            const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
            const amount = INITIAL_BALANCE.div(2);
            const oldBalance = await metacoin.balances.callAsync(ZERO_ADDRESS);
            expect(oldBalance).to.be.bignumber.equal(0);
            const txHash = await metacoin.transfer.sendTransactionAsync(
                {
                    to: ZERO_ADDRESS,
                    amount,
                },
                { from: devConstants.TESTRPC_FIRST_ADDRESS },
            );
            const txReceipt = await web3Wrapper.awaitTransactionMinedAsync(txHash);
            const transferLogs = txReceipt.logs[0] as LogWithDecodedArgs<TransferContractEventArgs>;
            expect(transferLogs.args).to.be.deep.equal({
                _to: ZERO_ADDRESS,
                _from: devConstants.TESTRPC_FIRST_ADDRESS,
                _value: amount,
            });
            const newBalance = await metacoin.balances.callAsync(ZERO_ADDRESS);
            expect(newBalance).to.be.bignumber.equal(amount);
        });
    });
});
