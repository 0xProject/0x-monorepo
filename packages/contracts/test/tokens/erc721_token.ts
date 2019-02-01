import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';

import {
    DummyERC721ReceiverContract,
    DummyERC721ReceiverTokenReceivedEventArgs,
} from '../../generated-wrappers/dummy_erc721_receiver';
import {
    DummyERC721TokenContract,
    DummyERC721TokenTransferEventArgs,
} from '../../generated-wrappers/dummy_erc721_token';
import { InvalidERC721ReceiverContract } from '../../generated-wrappers/invalid_erc721_receiver';
import { artifacts } from '../../src/artifacts';
import { expectTransactionFailedAsync, expectTransactionFailedWithoutReasonAsync } from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { LogDecoder } from '../utils/log_decoder';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('ERC721Token', () => {
    let owner: string;
    let spender: string;
    let token: DummyERC721TokenContract;
    let erc721Receiver: DummyERC721ReceiverContract;
    let logDecoder: LogDecoder;
    const tokenId = new BigNumber(1);
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        spender = accounts[1];
        token = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC721Token,
            provider,
            txDefaults,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
        );
        erc721Receiver = await DummyERC721ReceiverContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC721Receiver,
            provider,
            txDefaults,
        );
        logDecoder = new LogDecoder(web3Wrapper);
        await web3Wrapper.awaitTransactionSuccessAsync(
            await token.mint.sendTransactionAsync(owner, tokenId, { from: owner }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('transferFrom', () => {
        it('should revert if the tokenId is not owner', async () => {
            const from = owner;
            const to = erc721Receiver.address;
            const unownedTokenId = new BigNumber(2);
            await expectTransactionFailedAsync(
                token.transferFrom.sendTransactionAsync(from, to, unownedTokenId),
                RevertReason.Erc721ZeroOwner,
            );
        });
        it('should revert if transferring to a null address', async () => {
            const from = owner;
            const to = constants.NULL_ADDRESS;
            await expectTransactionFailedAsync(
                token.transferFrom.sendTransactionAsync(from, to, tokenId),
                RevertReason.Erc721ZeroToAddress,
            );
        });
        it('should revert if the from address does not own the token', async () => {
            const from = spender;
            const to = erc721Receiver.address;
            await expectTransactionFailedAsync(
                token.transferFrom.sendTransactionAsync(from, to, tokenId),
                RevertReason.Erc721OwnerMismatch,
            );
        });
        it('should revert if spender does not own the token, is not approved, and is not approved for all', async () => {
            const from = owner;
            const to = erc721Receiver.address;
            await expectTransactionFailedAsync(
                token.transferFrom.sendTransactionAsync(from, to, tokenId, { from: spender }),
                RevertReason.Erc721InvalidSpender,
            );
        });
        it('should transfer the token if called by owner', async () => {
            const from = owner;
            const to = erc721Receiver.address;
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await token.transferFrom.sendTransactionAsync(from, to, tokenId),
            );
            const newOwner = await token.ownerOf.callAsync(tokenId);
            expect(newOwner).to.be.equal(to);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<DummyERC721TokenTransferEventArgs>;
            expect(log.args._from).to.be.equal(from);
            expect(log.args._to).to.be.equal(to);
            expect(log.args._tokenId).to.be.bignumber.equal(tokenId);
        });
        it('should transfer the token if spender is approved for all', async () => {
            const isApproved = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.setApprovalForAll.sendTransactionAsync(spender, isApproved),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const from = owner;
            const to = erc721Receiver.address;
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await token.transferFrom.sendTransactionAsync(from, to, tokenId),
            );
            const newOwner = await token.ownerOf.callAsync(tokenId);
            expect(newOwner).to.be.equal(to);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<DummyERC721TokenTransferEventArgs>;
            expect(log.args._from).to.be.equal(from);
            expect(log.args._to).to.be.equal(to);
            expect(log.args._tokenId).to.be.bignumber.equal(tokenId);
        });
        it('should transfer the token if spender is individually approved', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.approve.sendTransactionAsync(spender, tokenId),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const from = owner;
            const to = erc721Receiver.address;
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await token.transferFrom.sendTransactionAsync(from, to, tokenId),
            );
            const newOwner = await token.ownerOf.callAsync(tokenId);
            expect(newOwner).to.be.equal(to);

            const approvedAddress = await token.getApproved.callAsync(tokenId);
            expect(approvedAddress).to.be.equal(constants.NULL_ADDRESS);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<DummyERC721TokenTransferEventArgs>;
            expect(log.args._from).to.be.equal(from);
            expect(log.args._to).to.be.equal(to);
            expect(log.args._tokenId).to.be.bignumber.equal(tokenId);
        });
    });
    describe('safeTransferFrom without data', () => {
        it('should transfer token to a non-contract address if called by owner', async () => {
            const from = owner;
            const to = spender;
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await token.safeTransferFrom1.sendTransactionAsync(from, to, tokenId),
            );
            const newOwner = await token.ownerOf.callAsync(tokenId);
            expect(newOwner).to.be.equal(to);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<DummyERC721TokenTransferEventArgs>;
            expect(log.args._from).to.be.equal(from);
            expect(log.args._to).to.be.equal(to);
            expect(log.args._tokenId).to.be.bignumber.equal(tokenId);
        });
        it('should revert if transferring to a contract address without onERC721Received', async () => {
            const contract = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
                artifacts.DummyERC721Token,
                provider,
                txDefaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
            );
            const from = owner;
            const to = contract.address;
            await expectTransactionFailedWithoutReasonAsync(
                token.safeTransferFrom1.sendTransactionAsync(from, to, tokenId),
            );
        });
        it('should revert if onERC721Received does not return the correct value', async () => {
            const invalidErc721Receiver = await InvalidERC721ReceiverContract.deployFrom0xArtifactAsync(
                artifacts.InvalidERC721Receiver,
                provider,
                txDefaults,
            );
            const from = owner;
            const to = invalidErc721Receiver.address;
            await expectTransactionFailedAsync(
                token.safeTransferFrom1.sendTransactionAsync(from, to, tokenId),
                RevertReason.Erc721InvalidSelector,
            );
        });
        it('should transfer to contract and call onERC721Received with correct return value', async () => {
            const from = owner;
            const to = erc721Receiver.address;
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await token.safeTransferFrom1.sendTransactionAsync(from, to, tokenId),
            );
            const newOwner = await token.ownerOf.callAsync(tokenId);
            expect(newOwner).to.be.equal(to);
            const transferLog = txReceipt.logs[0] as LogWithDecodedArgs<DummyERC721TokenTransferEventArgs>;
            const receiverLog = txReceipt.logs[1] as LogWithDecodedArgs<DummyERC721ReceiverTokenReceivedEventArgs>;
            expect(transferLog.args._from).to.be.equal(from);
            expect(transferLog.args._to).to.be.equal(to);
            expect(transferLog.args._tokenId).to.be.bignumber.equal(tokenId);
            expect(receiverLog.args.operator).to.be.equal(owner);
            expect(receiverLog.args.from).to.be.equal(from);
            expect(receiverLog.args.tokenId).to.be.bignumber.equal(tokenId);
            expect(receiverLog.args.data).to.be.equal(constants.NULL_BYTES);
        });
    });
    describe('safeTransferFrom with data', () => {
        const data = '0x0102030405060708090a0b0c0d0e0f';
        it('should transfer token to a non-contract address if called by owner', async () => {
            const from = owner;
            const to = spender;
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await token.safeTransferFrom2.sendTransactionAsync(from, to, tokenId, data),
            );
            const newOwner = await token.ownerOf.callAsync(tokenId);
            expect(newOwner).to.be.equal(to);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<DummyERC721TokenTransferEventArgs>;
            expect(log.args._from).to.be.equal(from);
            expect(log.args._to).to.be.equal(to);
            expect(log.args._tokenId).to.be.bignumber.equal(tokenId);
        });
        it('should revert if transferring to a contract address without onERC721Received', async () => {
            const contract = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
                artifacts.DummyERC721Token,
                provider,
                txDefaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
            );
            const from = owner;
            const to = contract.address;
            await expectTransactionFailedWithoutReasonAsync(
                token.safeTransferFrom2.sendTransactionAsync(from, to, tokenId, data),
            );
        });
        it('should revert if onERC721Received does not return the correct value', async () => {
            const invalidErc721Receiver = await InvalidERC721ReceiverContract.deployFrom0xArtifactAsync(
                artifacts.InvalidERC721Receiver,
                provider,
                txDefaults,
            );
            const from = owner;
            const to = invalidErc721Receiver.address;
            await expectTransactionFailedAsync(
                token.safeTransferFrom2.sendTransactionAsync(from, to, tokenId, data),
                RevertReason.Erc721InvalidSelector,
            );
        });
        it('should transfer to contract and call onERC721Received with correct return value', async () => {
            const from = owner;
            const to = erc721Receiver.address;
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await token.safeTransferFrom2.sendTransactionAsync(from, to, tokenId, data),
            );
            const newOwner = await token.ownerOf.callAsync(tokenId);
            expect(newOwner).to.be.equal(to);
            const transferLog = txReceipt.logs[0] as LogWithDecodedArgs<DummyERC721TokenTransferEventArgs>;
            const receiverLog = txReceipt.logs[1] as LogWithDecodedArgs<DummyERC721ReceiverTokenReceivedEventArgs>;
            expect(transferLog.args._from).to.be.equal(from);
            expect(transferLog.args._to).to.be.equal(to);
            expect(transferLog.args._tokenId).to.be.bignumber.equal(tokenId);
            expect(receiverLog.args.operator).to.be.equal(owner);
            expect(receiverLog.args.from).to.be.equal(from);
            expect(receiverLog.args.tokenId).to.be.bignumber.equal(tokenId);
            expect(receiverLog.args.data).to.be.equal(data);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
