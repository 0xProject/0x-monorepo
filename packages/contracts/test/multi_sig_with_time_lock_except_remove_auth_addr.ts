import { LogWithDecodedArgs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { AbiDecoder } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { artifacts } from '../util/artifacts';
import { constants } from '../util/constants';
import { crypto } from '../util/crypto';
import { MultiSigWrapper } from '../util/multi_sig_wrapper';
import { ContractName, SubmissionContractEventArgs, TransactionDataParams } from '../util/types';

import { chaiSetup } from './utils/chai_setup';
import { deployer } from './utils/deployer';
const PROXY_ABI = artifacts.TokenTransferProxyArtifact.networks[constants.TESTRPC_NETWORK_ID].abi;
const MUTISIG_WALLET_WITH_TIME_LOCK_EXCEPT_REMOVE_AUTHORIZED_ADDRESS_ABI =
    artifacts.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact.networks[constants.TESTRPC_NETWORK_ID]
        .abi;

chaiSetup.configure();
const expect = chai.expect;
const web3 = web3Factory.create();
const web3Wrapper = new Web3Wrapper(web3.currentProvider);
const blockchainLifecycle = new BlockchainLifecycle(devConstants.RPC_URL);
const abiDecoder = new AbiDecoder([MUTISIG_WALLET_WITH_TIME_LOCK_EXCEPT_REMOVE_AUTHORIZED_ADDRESS_ABI]);

describe('MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress', () => {
    const zeroEx = new ZeroEx(web3.currentProvider, { networkId: constants.TESTRPC_NETWORK_ID });
    let owners: string[];
    const requiredApprovals = 2;
    const SECONDS_TIME_LOCKED = 1000000;

    // initialize fake addresses
    let authorizedAddress: string;
    let unauthorizedAddress: string;

    let tokenTransferProxy: Web3.ContractInstance;
    let multiSig: Web3.ContractInstance;
    let multiSigWrapper: MultiSigWrapper;

    let validDestination: string;
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owners = [accounts[0], accounts[1]];
        authorizedAddress = `0x${crypto
            .solSHA3([accounts[0]])
            .slice(0, 20)
            .toString('hex')}`;
        unauthorizedAddress = `0x${crypto
            .solSHA3([accounts[1]])
            .slice(0, 20)
            .toString('hex')}`;
        const initialOwner = accounts[0];
        tokenTransferProxy = await deployer.deployAsync(ContractName.TokenTransferProxy);
        await tokenTransferProxy.addAuthorizedAddress(authorizedAddress, {
            from: initialOwner,
        });
        multiSig = await deployer.deployAsync(ContractName.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress, [
            owners,
            requiredApprovals,
            SECONDS_TIME_LOCKED,
            tokenTransferProxy.address,
        ]);
        await tokenTransferProxy.transferOwnership(multiSig.address, {
            from: initialOwner,
        });
        multiSigWrapper = new MultiSigWrapper(multiSig);
        validDestination = tokenTransferProxy.address;
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('isFunctionRemoveAuthorizedAddress', () => {
        it('should throw if data is not for removeAuthorizedAddress', async () => {
            const data = MultiSigWrapper.encodeFnArgs('addAuthorizedAddress', PROXY_ABI, [owners[0]]);
            return expect(multiSig.isFunctionRemoveAuthorizedAddress.call(data)).to.be.rejectedWith(constants.REVERT);
        });

        it('should return true if data is for removeAuthorizedAddress', async () => {
            const data = MultiSigWrapper.encodeFnArgs('removeAuthorizedAddress', PROXY_ABI, [owners[0]]);
            const isFunctionRemoveAuthorizedAddress = await multiSig.isFunctionRemoveAuthorizedAddress.call(data);
            expect(isFunctionRemoveAuthorizedAddress).to.be.true();
        });
    });

    describe('executeRemoveAuthorizedAddress', () => {
        it('should throw without the required confirmations', async () => {
            const dataParams: TransactionDataParams = {
                name: 'removeAuthorizedAddress',
                abi: PROXY_ABI,
                args: [authorizedAddress],
            };
            const txHash = await multiSigWrapper.submitTransactionAsync(validDestination, owners[0], dataParams);
            const res = await zeroEx.awaitTransactionMinedAsync(txHash);
            const log = abiDecoder.tryToDecodeLogOrNoop(res.logs[0]) as LogWithDecodedArgs<SubmissionContractEventArgs>;
            const txId = log.args.transactionId.toString();

            return expect(multiSig.executeRemoveAuthorizedAddress(txId, { from: owners[1] })).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if tx destination is not the tokenTransferProxy', async () => {
            const invalidTokenTransferProxy = await deployer.deployAsync(ContractName.TokenTransferProxy);
            const invalidDestination = invalidTokenTransferProxy.address;
            const dataParams: TransactionDataParams = {
                name: 'removeAuthorizedAddress',
                abi: PROXY_ABI,
                args: [authorizedAddress],
            };
            const txHash = await multiSigWrapper.submitTransactionAsync(invalidDestination, owners[0], dataParams);
            const res = await zeroEx.awaitTransactionMinedAsync(txHash);
            const log = abiDecoder.tryToDecodeLogOrNoop(res.logs[0]) as LogWithDecodedArgs<SubmissionContractEventArgs>;
            const txId = log.args.transactionId.toString();
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            const isConfirmed = await multiSig.isConfirmed.call(txId);
            expect(isConfirmed).to.be.true();

            return expect(multiSig.executeRemoveAuthorizedAddress(txId, { from: owners[1] })).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if tx data is not for removeAuthorizedAddress', async () => {
            const dataParams: TransactionDataParams = {
                name: 'addAuthorizedAddress',
                abi: PROXY_ABI,
                args: [unauthorizedAddress],
            };
            const txHash = await multiSigWrapper.submitTransactionAsync(validDestination, owners[0], dataParams);
            const res = await zeroEx.awaitTransactionMinedAsync(txHash);
            const log = abiDecoder.tryToDecodeLogOrNoop(res.logs[0]) as LogWithDecodedArgs<SubmissionContractEventArgs>;
            const txId = log.args.transactionId.toString();
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            const isConfirmed = await multiSig.isConfirmed.call(txId);
            expect(isConfirmed).to.be.true();

            return expect(multiSig.executeRemoveAuthorizedAddress(txId, { from: owners[1] })).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should execute removeAuthorizedAddress for valid tokenTransferProxy if fully confirmed', async () => {
            const dataParams: TransactionDataParams = {
                name: 'removeAuthorizedAddress',
                abi: PROXY_ABI,
                args: [authorizedAddress],
            };
            const txHash = await multiSigWrapper.submitTransactionAsync(validDestination, owners[0], dataParams);
            const res = await zeroEx.awaitTransactionMinedAsync(txHash);
            const log = abiDecoder.tryToDecodeLogOrNoop(res.logs[0]) as LogWithDecodedArgs<SubmissionContractEventArgs>;
            const txId = log.args.transactionId.toString();
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            const isConfirmed = await multiSig.isConfirmed.call(txId);
            expect(isConfirmed).to.be.true();
            await multiSig.executeRemoveAuthorizedAddress(txId, { from: owners[1] });
            const isAuthorized = await tokenTransferProxy.authorized.call(authorizedAddress);
            expect(isAuthorized).to.be.false();
        });

        it('should throw if already executed', async () => {
            const dataParams: TransactionDataParams = {
                name: 'removeAuthorizedAddress',
                abi: PROXY_ABI,
                args: [authorizedAddress],
            };
            const txHash = await multiSigWrapper.submitTransactionAsync(validDestination, owners[0], dataParams);
            const res = await zeroEx.awaitTransactionMinedAsync(txHash);
            const log = abiDecoder.tryToDecodeLogOrNoop(res.logs[0]) as LogWithDecodedArgs<SubmissionContractEventArgs>;
            const txId = log.args.transactionId.toString();
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            const isConfirmed = await multiSig.isConfirmed(txId);
            expect(isConfirmed).to.be.true();
            await multiSig.executeRemoveAuthorizedAddress(txId, { from: owners[1] });
            const tx = await multiSig.transactions(txId);
            const isExecuted = tx[3];
            expect(isExecuted).to.be.true();
            return expect(multiSig.executeRemoveAuthorizedAddress(txId, { from: owners[1] })).to.be.rejectedWith(
                constants.REVERT,
            );
        });
    });
});
