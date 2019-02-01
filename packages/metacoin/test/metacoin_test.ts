import { BlockchainLifecycle, devConstants } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { ContractArtifact, LogWithDecodedArgs } from 'ethereum-types';

import * as MetacoinArtifact from '../artifacts/Metacoin.json';
import { MetacoinContract, MetacoinTransferEventArgs } from '../src/contract_wrappers/metacoin';

import { chaiSetup } from './utils/chai_setup';
import { config } from './utils/config';
// Comment out the next line enable profiling
// import { profiler } from './utils/profiler';
import { provider, web3Wrapper } from './utils/web3_wrapper';

const artifact: ContractArtifact = MetacoinArtifact as any;

chaiSetup.configure();
const { expect } = chai;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('Metacoin', () => {
    let metacoin: MetacoinContract;
    const ownerAddress = devConstants.TESTRPC_FIRST_ADDRESS;
    const INITIAL_BALANCE = new BigNumber(10000);
    before(async () => {
        metacoin = await MetacoinContract.deployFrom0xArtifactAsync(artifact, provider, config.txDefaults);
        web3Wrapper.abiDecoder.addABI(metacoin.abi);
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
        it(`should successfully transfer tokens (via transfer1)`, async () => {
            const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
            const amount = INITIAL_BALANCE.div(2);
            const oldBalance = await metacoin.balances.callAsync(ZERO_ADDRESS);
            expect(oldBalance).to.be.bignumber.equal(0);
            // profiler.start();
            const txHash = await metacoin.transfer1.sendTransactionAsync(
                {
                    to: ZERO_ADDRESS,
                    amount,
                },
                { from: devConstants.TESTRPC_FIRST_ADDRESS },
            );
            // profiler.stop();
            const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
            const transferLogs = txReceipt.logs[0] as LogWithDecodedArgs<MetacoinTransferEventArgs>;
            expect(transferLogs.args).to.be.deep.equal({
                _to: ZERO_ADDRESS,
                _from: devConstants.TESTRPC_FIRST_ADDRESS,
                _value: amount,
            });
            const newBalance = await metacoin.balances.callAsync(ZERO_ADDRESS);
            expect(newBalance).to.be.bignumber.equal(amount);
        });

        it(`should successfully transfer tokens (via transfer2)`, async () => {
            const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
            const amount = INITIAL_BALANCE.div(2);
            const oldBalance = await metacoin.balances.callAsync(ZERO_ADDRESS);
            expect(oldBalance).to.be.bignumber.equal(0);
            const callback = 59;
            const txHash = await metacoin.transfer2.sendTransactionAsync(
                {
                    to: ZERO_ADDRESS,
                    amount,
                },
                callback,
                { from: devConstants.TESTRPC_FIRST_ADDRESS },
            );
            const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
            const transferLogs = txReceipt.logs[0] as LogWithDecodedArgs<MetacoinTransferEventArgs>;
            expect(transferLogs.args).to.be.deep.equal({
                _to: ZERO_ADDRESS,
                _from: devConstants.TESTRPC_FIRST_ADDRESS,
                _value: amount,
            });
            const newBalance = await metacoin.balances.callAsync(ZERO_ADDRESS);
            expect(newBalance).to.be.bignumber.equal(amount);
        });

        it(`should successfully transfer tokens (via transfer3)`, async () => {
            const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
            const amount = INITIAL_BALANCE.div(2);
            const oldBalance = await metacoin.balances.callAsync(ZERO_ADDRESS);
            expect(oldBalance).to.be.bignumber.equal(0);
            const callback = 59;
            const txHash = await metacoin.transfer3.sendTransactionAsync(
                {
                    transferData: {
                        to: ZERO_ADDRESS,
                        amount,
                    },
                    callback,
                },
                { from: devConstants.TESTRPC_FIRST_ADDRESS },
            );
            const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
            const transferLogs = txReceipt.logs[0] as LogWithDecodedArgs<MetacoinTransferEventArgs>;
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
// tslint:enable:no-unnecessary-type-assertion
