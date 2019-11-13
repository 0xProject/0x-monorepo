import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { SafeMathRevertErrors } from '@0x/contracts-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { Erc1155Wrapper } from '../src/erc1155_wrapper';
import { ERC1155MintableContract } from '../src/wrappers';

import { artifacts } from './artifacts';
import { DummyERC1155ReceiverBatchTokenReceivedEventArgs, DummyERC1155ReceiverContract } from './wrappers';
chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('ERC1155Token', () => {
    // constant values used in transfer tests
    const nftOwnerBalance = new BigNumber(1);
    const nftNotOwnerBalance = new BigNumber(0);
    const spenderInitialFungibleBalance = new BigNumber(500);
    const receiverInitialFungibleBalance = new BigNumber(0);
    const fungibleValueToTransfer = spenderInitialFungibleBalance.div(2);
    const nonFungibleValueToTransfer = nftOwnerBalance;
    const receiverCallbackData = '0x01020304';
    // tokens & addresses
    let owner: string;
    let spender: string;
    let delegatedSpender: string;
    let receiver: string;
    let erc1155Contract: ERC1155MintableContract;
    let erc1155Receiver: DummyERC1155ReceiverContract;
    let nonFungibleToken: BigNumber;
    let erc1155Wrapper: Erc1155Wrapper;
    let fungibleToken: BigNumber;
    // tests
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // deploy erc1155 contract & receiver
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [owner, spender, delegatedSpender] = accounts;
        erc1155Contract = await ERC1155MintableContract.deployFrom0xArtifactAsync(
            artifacts.ERC1155Mintable,
            provider,
            txDefaults,
            artifacts,
        );
        erc1155Receiver = await DummyERC1155ReceiverContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC1155Receiver,
            provider,
            txDefaults,
            artifacts,
        );
        receiver = erc1155Receiver.address;
        // create wrapper & mint erc1155 tokens
        erc1155Wrapper = new Erc1155Wrapper(erc1155Contract, provider, owner);
        fungibleToken = await erc1155Wrapper.mintFungibleTokensAsync([spender], spenderInitialFungibleBalance);
        let nonFungibleTokens: BigNumber[];
        [, nonFungibleTokens] = await erc1155Wrapper.mintNonFungibleTokensAsync([spender]);
        nonFungibleToken = nonFungibleTokens[0];
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('safeTransferFrom', () => {
        it('should transfer fungible token if called by token owner', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokenToTransfer = fungibleToken;
            const valueToTransfer = fungibleValueToTransfer;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedInitialBalances);
            // execute transfer
            await erc1155Wrapper.safeTransferFromAsync(
                spender,
                receiver,
                fungibleToken,
                valueToTransfer,
                receiverCallbackData,
            );
            // check balances after transfer
            const expectedFinalBalances = [
                spenderInitialFungibleBalance.minus(valueToTransfer),
                receiverInitialFungibleBalance.plus(valueToTransfer),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedFinalBalances);
        });
        it('should transfer non-fungible token if called by token owner', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokenToTransfer = nonFungibleToken;
            const valueToTransfer = nonFungibleValueToTransfer;
            // check balances before transfer
            const expectedInitialBalances = [nftOwnerBalance, nftNotOwnerBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedInitialBalances);
            // execute transfer
            await erc1155Wrapper.safeTransferFromAsync(
                spender,
                receiver,
                tokenToTransfer,
                valueToTransfer,
                receiverCallbackData,
            );
            // check balances after transfer
            const expectedFinalBalances = [nftNotOwnerBalance, nftOwnerBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedFinalBalances);
        });
        it('should trigger callback if transferring to a contract', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokenToTransfer = fungibleToken;
            const valueToTransfer = fungibleValueToTransfer;
            // check balances before transfer
            const expectedInitialBalances = [
                spenderInitialFungibleBalance,
                receiverInitialFungibleBalance,
                nftOwnerBalance,
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedInitialBalances);
            // execute transfer
            const tx = await erc1155Wrapper.safeTransferFromAsync(
                spender,
                receiver,
                tokenToTransfer,
                valueToTransfer,
                receiverCallbackData,
            );
            expect(tx.logs.length).to.be.equal(2);
            const receiverLog = tx.logs[1] as LogWithDecodedArgs<DummyERC1155ReceiverBatchTokenReceivedEventArgs>;
            // check callback logs
            const expectedCallbackLog = {
                operator: spender,
                from: spender,
                tokenId: tokenToTransfer,
                tokenValue: valueToTransfer,
                data: receiverCallbackData,
            };
            expect(receiverLog.args.operator).to.be.equal(expectedCallbackLog.operator);
            expect(receiverLog.args.from).to.be.equal(expectedCallbackLog.from);
            expect(receiverLog.args.tokenId).to.be.bignumber.equal(expectedCallbackLog.tokenId);
            expect(receiverLog.args.tokenValue).to.be.bignumber.equal(expectedCallbackLog.tokenValue);
            expect(receiverLog.args.data).to.be.deep.equal(expectedCallbackLog.data);
            // check balances after transfer
            const expectedFinalBalances = [
                spenderInitialFungibleBalance.minus(valueToTransfer),
                receiverInitialFungibleBalance.plus(valueToTransfer),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedFinalBalances);
        });
        it('should revert if transfer reverts', async () => {
            // setup test parameters
            const tokenToTransfer = fungibleToken;
            const valueToTransfer = spenderInitialFungibleBalance.plus(1);
            // create the expected error (a uint256 underflow)
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
                spenderInitialFungibleBalance,
                valueToTransfer,
            );
            // execute transfer
            const tx = erc1155Contract.safeTransferFrom.sendTransactionAsync(
                spender,
                receiver,
                tokenToTransfer,
                valueToTransfer,
                receiverCallbackData,
                { from: spender },
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if callback reverts', async () => {
            // setup test parameters
            const tokenToTransfer = fungibleToken;
            const valueToTransfer = fungibleValueToTransfer;
            // set receiver to reject balances
            const shouldRejectTransfer = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc1155Receiver.setRejectTransferFlag.sendTransactionAsync(shouldRejectTransfer),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155Contract.safeTransferFrom.sendTransactionAsync(
                    spender,
                    receiver,
                    tokenToTransfer,
                    valueToTransfer,
                    receiverCallbackData,
                    { from: spender },
                ),
                RevertReason.TransferRejected,
            );
        });
    });
    describe('batchSafeTransferFrom', () => {
        it('should transfer fungible tokens if called by token owner', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = [fungibleToken];
            const valuesToTransfer = [fungibleValueToTransfer];
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155Wrapper.safeBatchTransferFromAsync(
                spender,
                receiver,
                tokensToTransfer,
                valuesToTransfer,
                receiverCallbackData,
            );
            // check balances after transfer
            const expectedFinalBalances = [
                spenderInitialFungibleBalance.minus(valuesToTransfer[0]),
                receiverInitialFungibleBalance.plus(valuesToTransfer[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should transfer non-fungible token if called by token owner', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = [nonFungibleToken];
            const valuesToTransfer = [nonFungibleValueToTransfer];
            // check balances before transfer
            const expectedInitialBalances = [nftOwnerBalance, nftNotOwnerBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155Wrapper.safeBatchTransferFromAsync(
                spender,
                receiver,
                tokensToTransfer,
                valuesToTransfer,
                receiverCallbackData,
            );
            // check balances after transfer
            const expectedFinalBalances = [nftNotOwnerBalance, nftOwnerBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should transfer mix of fungible / non-fungible tokens if called by token owner', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = [fungibleToken, nonFungibleToken];
            const valuesToTransfer = [fungibleValueToTransfer, nonFungibleValueToTransfer];
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                spenderInitialFungibleBalance,
                nftOwnerBalance,
                // receiver
                receiverInitialFungibleBalance,
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155Wrapper.safeBatchTransferFromAsync(
                spender,
                receiver,
                tokensToTransfer,
                valuesToTransfer,
                receiverCallbackData,
            );
            // check balances after transfer
            const expectedFinalBalances = [
                // spender
                spenderInitialFungibleBalance.minus(valuesToTransfer[0]),
                nftNotOwnerBalance,
                // receiver
                receiverInitialFungibleBalance.plus(valuesToTransfer[0]),
                nftOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should trigger callback if transferring to a contract', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = [fungibleToken, nonFungibleToken];
            const valuesToTransfer = [fungibleValueToTransfer, nonFungibleValueToTransfer];
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                spenderInitialFungibleBalance,
                nftOwnerBalance,
                // receiver
                receiverInitialFungibleBalance,
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            const tx = await erc1155Wrapper.safeBatchTransferFromAsync(
                spender,
                receiver,
                tokensToTransfer,
                valuesToTransfer,
                receiverCallbackData,
            );
            expect(tx.logs.length).to.be.equal(2);
            const receiverLog = tx.logs[1] as LogWithDecodedArgs<DummyERC1155ReceiverBatchTokenReceivedEventArgs>;
            // check callback logs
            const expectedCallbackLog = {
                operator: spender,
                from: spender,
                tokenIds: tokensToTransfer,
                tokenValues: valuesToTransfer,
                data: receiverCallbackData,
            };
            expect(receiverLog.args.operator).to.be.equal(expectedCallbackLog.operator);
            expect(receiverLog.args.from).to.be.equal(expectedCallbackLog.from);
            expect(receiverLog.args.tokenIds.length).to.be.equal(2);
            expect(receiverLog.args.tokenIds[0]).to.be.bignumber.equal(expectedCallbackLog.tokenIds[0]);
            expect(receiverLog.args.tokenIds[1]).to.be.bignumber.equal(expectedCallbackLog.tokenIds[1]);
            expect(receiverLog.args.tokenValues.length).to.be.equal(2);
            expect(receiverLog.args.tokenValues[0]).to.be.bignumber.equal(expectedCallbackLog.tokenValues[0]);
            expect(receiverLog.args.tokenValues[1]).to.be.bignumber.equal(expectedCallbackLog.tokenValues[1]);
            expect(receiverLog.args.data).to.be.deep.equal(expectedCallbackLog.data);
            // check balances after transfer
            const expectedFinalBalances = [
                // spender
                spenderInitialFungibleBalance.minus(valuesToTransfer[0]),
                nftNotOwnerBalance,
                // receiver
                receiverInitialFungibleBalance.plus(valuesToTransfer[0]),
                nftOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should revert if transfer reverts', async () => {
            // setup test parameters
            const tokensToTransfer = [fungibleToken];
            const valuesToTransfer = [spenderInitialFungibleBalance.plus(1)];
            // create the expected error (a uint256 underflow)
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
                spenderInitialFungibleBalance,
                valuesToTransfer[0],
            );
            // execute transfer
            const tx = erc1155Contract.safeBatchTransferFrom.sendTransactionAsync(
                spender,
                receiver,
                tokensToTransfer,
                valuesToTransfer,
                receiverCallbackData,
                { from: spender },
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if callback reverts', async () => {
            // setup test parameters
            const tokensToTransfer = [fungibleToken];
            const valuesToTransfer = [fungibleValueToTransfer];
            // set receiver to reject balances
            const shouldRejectTransfer = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc1155Receiver.setRejectTransferFlag.sendTransactionAsync(shouldRejectTransfer),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155Contract.safeBatchTransferFrom.sendTransactionAsync(
                    spender,
                    receiver,
                    tokensToTransfer,
                    valuesToTransfer,
                    receiverCallbackData,
                    { from: spender },
                ),
                RevertReason.TransferRejected,
            );
        });
    });
    describe('setApprovalForAll', () => {
        it('should transfer token via safeTransferFrom if called by approved account', async () => {
            // set approval
            const isApprovedForAll = true;
            await erc1155Wrapper.setApprovalForAllAsync(spender, delegatedSpender, isApprovedForAll);
            const isApprovedForAllCheck = await erc1155Wrapper.isApprovedForAllAsync(spender, delegatedSpender);
            expect(isApprovedForAllCheck).to.be.true();
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokenToTransfer = fungibleToken;
            const valueToTransfer = fungibleValueToTransfer;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedInitialBalances);
            // execute transfer
            await erc1155Wrapper.safeTransferFromAsync(
                spender,
                receiver,
                tokenToTransfer,
                valueToTransfer,
                receiverCallbackData,
                delegatedSpender,
            );
            // check balances after transfer
            const expectedFinalBalances = [
                spenderInitialFungibleBalance.minus(valueToTransfer),
                receiverInitialFungibleBalance.plus(valueToTransfer),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedFinalBalances);
        });
        it('should revert if trying to transfer tokens via safeTransferFrom by an unapproved account', async () => {
            // check approval not set
            const isApprovedForAllCheck = await erc1155Wrapper.isApprovedForAllAsync(spender, delegatedSpender);
            expect(isApprovedForAllCheck).to.be.false();
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokenToTransfer = fungibleToken;
            const valueToTransfer = fungibleValueToTransfer;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedInitialBalances);
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155Contract.safeTransferFrom.sendTransactionAsync(
                    spender,
                    receiver,
                    tokenToTransfer,
                    valueToTransfer,
                    receiverCallbackData,
                    { from: delegatedSpender },
                ),
                RevertReason.InsufficientAllowance,
            );
        });
        it('should transfer token via safeBatchTransferFrom if called by approved account', async () => {
            // set approval
            const isApprovedForAll = true;
            await erc1155Wrapper.setApprovalForAllAsync(spender, delegatedSpender, isApprovedForAll);
            const isApprovedForAllCheck = await erc1155Wrapper.isApprovedForAllAsync(spender, delegatedSpender);
            expect(isApprovedForAllCheck).to.be.true();
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = [fungibleToken];
            const valuesToTransfer = [fungibleValueToTransfer];
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155Wrapper.safeBatchTransferFromAsync(
                spender,
                receiver,
                tokensToTransfer,
                valuesToTransfer,
                receiverCallbackData,
                delegatedSpender,
            );
            // check balances after transfer
            const expectedFinalBalances = [
                spenderInitialFungibleBalance.minus(valuesToTransfer[0]),
                receiverInitialFungibleBalance.plus(valuesToTransfer[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should revert if trying to transfer tokens via safeBatchTransferFrom by an unapproved account', async () => {
            // check approval not set
            const isApprovedForAllCheck = await erc1155Wrapper.isApprovedForAllAsync(spender, delegatedSpender);
            expect(isApprovedForAllCheck).to.be.false();
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = [fungibleToken];
            const valuesToTransfer = [fungibleValueToTransfer];
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155Contract.safeBatchTransferFrom.sendTransactionAsync(
                    spender,
                    receiver,
                    tokensToTransfer,
                    valuesToTransfer,
                    receiverCallbackData,
                    { from: delegatedSpender },
                ),
                RevertReason.InsufficientAllowance,
            );
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
