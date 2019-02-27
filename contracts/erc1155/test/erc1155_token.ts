import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    DummyERC1155ReceiverContract,
    DummyERC1155ReceiverTokenReceivedEventArgs,
    DummyERC1155TokenContract,
    DummyERC1155ReceiverBatchTokenReceivedEventArgs,
} from '../src';

import { Erc1155Wrapper } from './utils/erc1155_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('ERC1155Token', () => {
    // constant values used in transfer tests
    const nftOwnerBalance = new BigNumber(1);
    const nftNotOwnerBalance = new BigNumber(0);
    const spenderInitialBalance = new BigNumber(500);
    const receiverInitialBalance = new BigNumber(0);
    const fungibleValueToTransfer = spenderInitialBalance.div(2);
    const nonFungibleValueToTransfer = nftOwnerBalance;
    const receiverCallbackData = '0x01020304';
    // tokens & addresses
    let owner: string;
    let spender: string;
    let receiver: string;
    let token: DummyERC1155TokenContract;
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
        [owner, spender] = accounts;
        token = await DummyERC1155TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC1155Token,
            provider,
            txDefaults,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
        );
        erc1155Receiver = await DummyERC1155ReceiverContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC1155Receiver,
            provider,
            txDefaults,
        );
        receiver = erc1155Receiver.address;
        // create wrapper & mint erc1155 tokens
        erc1155Wrapper = new Erc1155Wrapper(token, provider, owner);
        fungibleToken = await erc1155Wrapper.mintFungibleTokenAsync(spender, spenderInitialBalance);
        [, nonFungibleToken] = await erc1155Wrapper.mintNonFungibleTokenAsync(spender);
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
            const expectedInitialBalances = [
                spenderInitialBalance,
                receiverInitialBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                [tokenToTransfer],
                expectedInitialBalances
            );
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
                spenderInitialBalance.minus(valueToTransfer),
                receiverInitialBalance.plus(valueToTransfer),
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                [tokenToTransfer],
                expectedFinalBalances
            );
        });
        it('should transfer non-fungible token if called by token owner', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokenToTransfer = nonFungibleToken;
            const valueToTransfer = nonFungibleValueToTransfer;
            // check balances before transfer
            const expectedInitialBalances = [
                nftOwnerBalance,
                nftNotOwnerBalance
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                [tokenToTransfer],
                expectedInitialBalances
            );
            // execute transfer
            await erc1155Wrapper.safeTransferFromAsync(
                spender,
                receiver,
                tokenToTransfer,
                valueToTransfer,
                receiverCallbackData,
            );
            // check balances after transfer
            const expectedFinalBalances = [
                nftNotOwnerBalance,
                nftOwnerBalance
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                [tokenToTransfer],
                expectedFinalBalances
            );
        });
        it('should trigger callback if transferring to a contract', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokenToTransfer = fungibleToken;
            const valueToTransfer = fungibleValueToTransfer;
            // check balances before transfer
            const expectedInitialBalances = [
                spenderInitialBalance,
                receiverInitialBalance,
                nftOwnerBalance,
                nftNotOwnerBalance
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                [tokenToTransfer],
                expectedInitialBalances
            );
            // execute transfer
            const tx = await erc1155Wrapper.safeTransferFromAsync(
                spender,
                receiver,
                tokenToTransfer,
                valueToTransfer,
                receiverCallbackData,
            );
            expect(tx.logs.length).to.be.equal(2);
            const receiverLog = tx.logs[1] as LogWithDecodedArgs<
                DummyERC1155ReceiverBatchTokenReceivedEventArgs
            >;
            // check callback logs
            const expectedCallbackLog = {
                operator: spender,
                from: spender,
                tokenId: tokenToTransfer,
                tokenValue: valueToTransfer,
                data: receiverCallbackData
            }
            expect(receiverLog.args.operator).to.be.equal(expectedCallbackLog.operator);
            expect(receiverLog.args.from).to.be.equal(expectedCallbackLog.from);
            expect(receiverLog.args.tokenId).to.be.bignumber.equal(expectedCallbackLog.tokenId);
            expect(receiverLog.args.tokenValue).to.be.bignumber.equal(expectedCallbackLog.tokenValue);
            expect(receiverLog.args.data).to.be.deep.equal(expectedCallbackLog.data);
            // check balances after transfer
            const expectedFinalBalances = [
                spenderInitialBalance.minus(valueToTransfer),
                receiverInitialBalance.plus(valueToTransfer),
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                [tokenToTransfer],
                expectedFinalBalances
            );
        });
        it('should throw if transfer reverts', async () => {
            // setup test parameters
            const tokenToTransfer = fungibleToken;
            const valueToTransfer = spenderInitialBalance.plus(1);
            // execute transfer
            await expectTransactionFailedAsync(
                token.safeTransferFrom.sendTransactionAsync(
                    spender,
                    receiver,
                    tokenToTransfer,
                    valueToTransfer,
                    receiverCallbackData,
                    { from: spender },
                ),
                RevertReason.Uint256Underflow
            );
        });
        it('should throw if callback reverts', async () => {
            // setup test parameters
            const tokenToTransfer = fungibleToken;
            const valueToTransfer = fungibleValueToTransfer;
            // set receiver to reject balances
            const shouldRejectTransfer = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc1155Receiver.setRejectTransferFlag.sendTransactionAsync(
                    shouldRejectTransfer,

                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
             // execute transfer
             await expectTransactionFailedAsync(
                token.safeTransferFrom.sendTransactionAsync(
                    spender,
                    receiver,
                    tokenToTransfer,
                    valueToTransfer,
                    receiverCallbackData,
                    { from: spender },
                ),
                RevertReason.TransferRejected
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
            const expectedInitialBalances = [
                spenderInitialBalance,
                receiverInitialBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                tokensToTransfer,
                expectedInitialBalances
            );
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
                spenderInitialBalance.minus(valuesToTransfer[0]),
                receiverInitialBalance.plus(valuesToTransfer[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                tokensToTransfer,
                expectedFinalBalances
            );
        });
        it('should transfer non-fungible token if called by token owner', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = [nonFungibleToken];
            const valuesToTransfer = [nonFungibleValueToTransfer];
            // check balances before transfer
            const expectedInitialBalances = [
                spenderInitialBalance,
                receiverInitialBalance,
                nftOwnerBalance,
                nftNotOwnerBalance
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                tokensToTransfer,
                expectedInitialBalances
            );
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
                nftNotOwnerBalance,
                nftOwnerBalance
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                tokensToTransfer,
                expectedFinalBalances
            );
        });
        it('should transfer mix of fungible / non-fungible tokens if called by token owner', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = [fungibleToken, nonFungibleToken];
            const valuesToTransfer = [fungibleValueToTransfer, nonFungibleValueToTransfer];
            // check balances before transfer
            const expectedInitialBalances = [
                spenderInitialBalance,
                receiverInitialBalance,
                nftOwnerBalance,
                nftNotOwnerBalance
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                tokensToTransfer,
                expectedInitialBalances
            );
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
                spenderInitialBalance.minus(valuesToTransfer[0]),
                receiverInitialBalance.plus(valuesToTransfer[0]),
                nftNotOwnerBalance,
                nftOwnerBalance
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                tokensToTransfer,
                expectedFinalBalances
            );
        });
        it('should trigger callback if transferring to a contract', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = [fungibleToken, nonFungibleToken];
            const valuesToTransfer = [fungibleValueToTransfer, nonFungibleValueToTransfer];
            // check balances before transfer
            const expectedInitialBalances = [
                spenderInitialBalance,
                receiverInitialBalance,
                nftOwnerBalance,
                nftNotOwnerBalance
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                tokensToTransfer,
                expectedInitialBalances
            );
            // execute transfer
            const tx = await erc1155Wrapper.safeBatchTransferFromAsync(
                spender,
                receiver,
                tokensToTransfer,
                valuesToTransfer,
                receiverCallbackData,
            );
            expect(tx.logs.length).to.be.equal(2);
            const receiverLog = tx.logs[1] as LogWithDecodedArgs<
                DummyERC1155ReceiverBatchTokenReceivedEventArgs
            >;
            // check callback logs
            const expectedCallbackLog = {
                operator: spender,
                from: spender,
                tokenIds: tokensToTransfer,
                tokenValues: valuesToTransfer,
                data: receiverCallbackData
            }
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
                spenderInitialBalance.minus(valuesToTransfer[0]),
                receiverInitialBalance.plus(valuesToTransfer[0]),
                nftNotOwnerBalance,
                nftOwnerBalance
            ];
            await erc1155Wrapper.assertBalancesAsync(
                tokenHolders,
                tokensToTransfer,
                expectedFinalBalances
            );
        });
        it('should throw if transfer reverts', async () => {
            // setup test parameters
            const tokensToTransfer = [fungibleToken];
            const valuesToTransfer = [spenderInitialBalance.plus(1)];
            // execute transfer
            await expectTransactionFailedAsync(
                token.safeBatchTransferFrom.sendTransactionAsync(
                    spender,
                    receiver,
                    tokensToTransfer,
                    valuesToTransfer,
                    receiverCallbackData,
                    { from: spender },
                ),
                RevertReason.Uint256Underflow
            );
        });
        it('should throw if callback reverts', async () => {
            // setup test parameters
            const tokensToTransfer = [fungibleToken];
            const valuesToTransfer = [fungibleValueToTransfer];
            // set receiver to reject balances
            const shouldRejectTransfer = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc1155Receiver.setRejectTransferFlag.sendTransactionAsync(
                    shouldRejectTransfer,

                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
             // execute transfer
             await expectTransactionFailedAsync(
                token.safeBatchTransferFrom.sendTransactionAsync(
                    spender,
                    receiver,
                    tokensToTransfer,
                    valuesToTransfer,
                    receiverCallbackData,
                    { from: spender },
                ),
                RevertReason.TransferRejected
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
