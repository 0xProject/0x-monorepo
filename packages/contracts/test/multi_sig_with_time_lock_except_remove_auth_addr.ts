import { LogWithDecodedArgs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'make-promises-safe';
import * as Web3 from 'web3';

import { MultiSigWalletContract } from '../src/contract_wrappers/generated/multi_sig_wallet';
import { MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract } from '../src/contract_wrappers/generated/multi_sig_wallet_with_time_lock_except_remove_authorized_address';
import { TokenTransferProxyContract } from '../src/contract_wrappers/generated/token_transfer_proxy';
import { artifacts } from '../util/artifacts';
import { constants } from '../util/constants';
import { crypto } from '../util/crypto';
import { MultiSigWrapper } from '../util/multi_sig_wrapper';
import { ContractName, SubmissionContractEventArgs, TransactionDataParams } from '../util/types';

import { chaiSetup } from './utils/chai_setup';

import { provider, txDefaults, web3Wrapper } from './utils/web3_wrapper';

const PROXY_ABI = artifacts.TokenTransferProxy.compilerOutput.abi;
const MUTISIG_WALLET_WITH_TIME_LOCK_EXCEPT_REMOVE_AUTHORIZED_ADDRESS_ABI =
    artifacts.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress.compilerOutput.abi;

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const abiDecoder = new AbiDecoder([MUTISIG_WALLET_WITH_TIME_LOCK_EXCEPT_REMOVE_AUTHORIZED_ADDRESS_ABI]);

describe('MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress', () => {
    const zeroEx = new ZeroEx(provider, { networkId: constants.TESTRPC_NETWORK_ID });
    let owners: string[];
    const requiredApprovals = new BigNumber(2);
    const SECONDS_TIME_LOCKED = new BigNumber(1000000);

    // initialize fake addresses
    let authorizedAddress: string;
    let unauthorizedAddress: string;

    let tokenTransferProxy: TokenTransferProxyContract;
    let multiSig: MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
    let multiSigWrapper: MultiSigWrapper;

    let validDestination: string;
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owners = [accounts[0], accounts[1]];
        [authorizedAddress, unauthorizedAddress] = accounts;
        const initialOwner = accounts[0];
        tokenTransferProxy = await TokenTransferProxyContract.deployFrom0xArtifactAsync(
            artifacts.TokenTransferProxy,
            provider,
            txDefaults,
        );
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(authorizedAddress, {
            from: initialOwner,
        });
        multiSig = await MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract.deployFrom0xArtifactAsync(
            artifacts.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress,
            provider,
            txDefaults,
            owners,
            requiredApprovals,
            SECONDS_TIME_LOCKED,
            tokenTransferProxy.address,
        );
        await tokenTransferProxy.transferOwnership.sendTransactionAsync(multiSig.address, {
            from: initialOwner,
        });
        multiSigWrapper = new MultiSigWrapper((multiSig as any) as MultiSigWalletContract);
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
            return expect(multiSig.isFunctionRemoveAuthorizedAddress.callAsync(data)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should return true if data is for removeAuthorizedAddress', async () => {
            const data = MultiSigWrapper.encodeFnArgs('removeAuthorizedAddress', PROXY_ABI, [owners[0]]);
            const isFunctionRemoveAuthorizedAddress = await multiSig.isFunctionRemoveAuthorizedAddress.callAsync(data);
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
            const txId = log.args.transactionId;

            return expect(
                multiSig.executeRemoveAuthorizedAddress.sendTransactionAsync(txId, { from: owners[1] }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if tx destination is not the tokenTransferProxy', async () => {
            const invalidTokenTransferProxy = await TokenTransferProxyContract.deployFrom0xArtifactAsync(
                artifacts.TokenTransferProxy,
                provider,
                txDefaults,
            );
            const invalidDestination = invalidTokenTransferProxy.address;
            const dataParams: TransactionDataParams = {
                name: 'removeAuthorizedAddress',
                abi: PROXY_ABI,
                args: [authorizedAddress],
            };
            const txHash = await multiSigWrapper.submitTransactionAsync(invalidDestination, owners[0], dataParams);
            const res = await zeroEx.awaitTransactionMinedAsync(txHash);
            const log = abiDecoder.tryToDecodeLogOrNoop(res.logs[0]) as LogWithDecodedArgs<SubmissionContractEventArgs>;
            const txId = log.args.transactionId;
            await multiSig.confirmTransaction.sendTransactionAsync(txId, { from: owners[1] });
            const isConfirmed = await multiSig.isConfirmed.callAsync(txId);
            expect(isConfirmed).to.be.true();

            return expect(
                multiSig.executeRemoveAuthorizedAddress.sendTransactionAsync(txId, { from: owners[1] }),
            ).to.be.rejectedWith(constants.REVERT);
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
            const txId = log.args.transactionId;
            await multiSig.confirmTransaction.sendTransactionAsync(txId, { from: owners[1] });
            const isConfirmed = await multiSig.isConfirmed.callAsync(txId);
            expect(isConfirmed).to.be.true();

            return expect(
                multiSig.executeRemoveAuthorizedAddress.sendTransactionAsync(txId, { from: owners[1] }),
            ).to.be.rejectedWith(constants.REVERT);
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
            const txId = log.args.transactionId;
            await multiSig.confirmTransaction.sendTransactionAsync(txId, { from: owners[1] });
            const isConfirmed = await multiSig.isConfirmed.callAsync(txId);
            expect(isConfirmed).to.be.true();
            await multiSig.executeRemoveAuthorizedAddress.sendTransactionAsync(txId, { from: owners[1] });
            const isAuthorized = await tokenTransferProxy.authorized.callAsync(authorizedAddress);
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
            const txId = log.args.transactionId;
            await multiSig.confirmTransaction.sendTransactionAsync(txId, { from: owners[1] });
            const isConfirmed = await multiSig.isConfirmed.callAsync(txId);
            expect(isConfirmed).to.be.true();
            await multiSig.executeRemoveAuthorizedAddress.sendTransactionAsync(txId, { from: owners[1] });
            const tx = await multiSig.transactions.callAsync(txId);
            const isExecuted = tx[3];
            expect(isExecuted).to.be.true();
            return expect(
                multiSig.executeRemoveAuthorizedAddress.sendTransactionAsync(txId, { from: owners[1] }),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });
});
