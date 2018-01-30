import { RPC } from '@0xproject/dev-utils';
import { BigNumber, promisify } from '@0xproject/utils';
import * as chai from 'chai';
import Web3 = require('web3');

import * as multiSigWalletJSON from '../../build/contracts/MultiSigWalletWithTimeLock.json';
import * as truffleConf from '../../truffle.js';
import { Artifacts } from '../../util/artifacts';
import { constants } from '../../util/constants';
import { MultiSigWrapper } from '../../util/multi_sig_wrapper';
import { ContractInstance } from '../../util/types';

import { chaiSetup } from './utils/chai_setup';

const { MultiSigWalletWithTimeLock } = new Artifacts(artifacts);

const MULTI_SIG_ABI = (multiSigWalletJSON as any).abi;
chaiSetup.configure();
const expect = chai.expect;

// In order to benefit from type-safety, we re-assign the global web3 instance injected by Truffle
// with type `any` to a variable of type `Web3`.
const web3: Web3 = (global as any).web3;

contract('MultiSigWalletWithTimeLock', (accounts: string[]) => {
	const owners = [accounts[0], accounts[1]];
	const SECONDS_TIME_LOCKED = 10000;

	let multiSig: ContractInstance;
	let multiSigWrapper: MultiSigWrapper;
	let txId: number;
	let initialSecondsTimeLocked: number;
	let rpc: RPC;

	before(async () => {
		multiSig = await MultiSigWalletWithTimeLock.deployed();
		multiSigWrapper = new MultiSigWrapper(multiSig);

		const secondsTimeLocked = await multiSig.secondsTimeLocked.call();
		initialSecondsTimeLocked = secondsTimeLocked.toNumber();
		const rpcUrl = `http://${truffleConf.networks.development.host}:${truffleConf.networks.development.port}`;
		rpc = new RPC(rpcUrl);
	});

	describe('changeTimeLock', () => {
		it('should throw when not called by wallet', async () => {
			return expect(multiSig.changeTimeLock(SECONDS_TIME_LOCKED, { from: owners[0] })).to.be.rejectedWith(
				constants.REVERT,
			);
		});

		it('should throw without enough confirmations', async () => {
			const destination = multiSig.address;
			const from = owners[0];
			const dataParams = {
				name: 'changeTimeLock',
				abi: MULTI_SIG_ABI,
				args: [SECONDS_TIME_LOCKED],
			};
			const subRes = await multiSigWrapper.submitTransactionAsync(destination, from, dataParams);

			txId = subRes.logs[0].args.transactionId.toNumber();
			return expect(multiSig.executeTransaction(txId)).to.be.rejectedWith(constants.REVERT);
		});

		it('should set confirmation time with enough confirmations', async () => {
			const res = await multiSig.confirmTransaction(txId, { from: owners[1] });
			expect(res.logs).to.have.length(2);
			const blockNum = await promisify<number>(web3.eth.getBlockNumber)();
			const blockInfo = await promisify<Web3.BlockWithoutTransactionData>(web3.eth.getBlock)(blockNum);
			const timestamp = new BigNumber(blockInfo.timestamp);
			const confirmationTimeBigNum = new BigNumber(await multiSig.confirmationTimes.call(txId));

			expect(timestamp).to.be.bignumber.equal(confirmationTimeBigNum);
		});

		it('should be executable with enough confirmations and secondsTimeLocked of 0', async () => {
			expect(initialSecondsTimeLocked).to.be.equal(0);

			const res = await multiSig.executeTransaction(txId);
			expect(res.logs).to.have.length(2);

			const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked.call());
			expect(secondsTimeLocked).to.be.bignumber.equal(SECONDS_TIME_LOCKED);
		});

		const newSecondsTimeLocked = 0;
		it('should throw if it has enough confirmations but is not past the time lock', async () => {
			const destination = multiSig.address;
			const from = owners[0];
			const dataParams = {
				name: 'changeTimeLock',
				abi: MULTI_SIG_ABI,
				args: [newSecondsTimeLocked],
			};
			const subRes = await multiSigWrapper.submitTransactionAsync(destination, from, dataParams);

			txId = subRes.logs[0].args.transactionId.toNumber();
			const confRes = await multiSig.confirmTransaction(txId, {
				from: owners[1],
			});
			expect(confRes.logs).to.have.length(2);

			return expect(multiSig.executeTransaction(txId)).to.be.rejectedWith(constants.REVERT);
		});

		it('should execute if it has enough confirmations and is past the time lock', async () => {
			await rpc.increaseTimeAsync(SECONDS_TIME_LOCKED);
			await multiSig.executeTransaction(txId);

			const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked.call());
			expect(secondsTimeLocked).to.be.bignumber.equal(newSecondsTimeLocked);
		});
	});
});
