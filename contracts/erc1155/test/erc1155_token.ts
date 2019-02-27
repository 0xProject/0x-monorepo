
import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    expectTransactionFailedWithoutReasonAsync,
    LogDecoder,
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
   // DummyERC1155ReceiverTokenReceivedEventArgs,
    DummyERC1155TokenContract,
    //DummyERC1155TokenTransferEventArgs,
    InvalidERC1155ReceiverContract,
    ERC1155TransferSingleEventArgs
} from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('ERC1155Token', () => {

    const DUMMY_FUNGIBLE_TOKEN_URI = 'FUN';
    const DUMMY_FUNGIBLE_TOKEN_IS_FUNGIBLE = false;
    const DUMMY_NONFUNGIBLE_TOKEN_URI = 'NOFUN';
    const DUMMY_NONFUNGIBLE_TOKEN_IS_FUNGIBLE = true;

    let owner: string;
    let spender: string;
    const spenderInitialBalance = new BigNumber(500);
    const receiverInitialBalance = new BigNumber(0);
    let token: DummyERC1155TokenContract;
    let erc1155Receiver: DummyERC1155ReceiverContract;
    let logDecoder: LogDecoder;
    const tokenId = new BigNumber(1);
    let dummyNft: BigNumber;
    const nftOwnerBalance = new BigNumber(1);
    const nftNotOwnerBalance = new BigNumber(0);

    let dummyFungibleTokenType: BigNumber;
    let dummyNonFungibleTokenType: BigNumber;

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

        logDecoder = new LogDecoder(web3Wrapper, artifacts);
        // Create & mint fungible token
        let txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
            await token.create.sendTransactionAsync(
                DUMMY_FUNGIBLE_TOKEN_URI,
                DUMMY_FUNGIBLE_TOKEN_IS_FUNGIBLE
            )
        );
        const createFungibleTokenLog = txReceipt.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>;
        dummyFungibleTokenType = createFungibleTokenLog.args._id;
        await web3Wrapper.awaitTransactionSuccessAsync(
            await token.mintFungible.sendTransactionAsync(
                dummyFungibleTokenType,
                [spender],
                [spenderInitialBalance],
                { from: owner }
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        // Create & mint non-fungible token
        txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
            await token.create.sendTransactionAsync(
                DUMMY_NONFUNGIBLE_TOKEN_URI,
                DUMMY_NONFUNGIBLE_TOKEN_IS_FUNGIBLE
            )
        );
        const createNonFungibleTokenLog = txReceipt.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>;
        dummyNonFungibleTokenType = createNonFungibleTokenLog.args._id;
        await web3Wrapper.awaitTransactionSuccessAsync(
            await token.mintNonFungible.sendTransactionAsync(
                dummyNonFungibleTokenType,
                [spender],
                { from: owner }
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        dummyNft = dummyNonFungibleTokenType.plus(1);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('batchSafeTransferFrom', () => {
        beforeEach(async () => {
            await blockchainLifecycle.startAsync();
        });
        afterEach(async () => {
            await blockchainLifecycle.revertAsync();
        });
        it('should transfer fungible tokens if called by token owner', async () => {
            // setup test parameters
            const from = spender;
            const to = erc1155Receiver.address;
            const fromIdx = 0;
            const toIdx = 1;
            const participatingOwners = [from, to];
            const participatingTokens = [dummyFungibleTokenType, dummyFungibleTokenType];
            const tokenTypesToTransfer = [dummyFungibleTokenType];
            const valueToTransfer = new BigNumber(200);
            const valuesToTransfer = [valueToTransfer];
            const callbackData = constants.NULL_BYTES;
            // check balances before transfer
            const balancesBeforeTransfer = await token.balanceOfBatch.callAsync(participatingOwners, participatingTokens);
            expect(balancesBeforeTransfer[fromIdx]).to.be.bignumber.equal(spenderInitialBalance);
            expect(balancesBeforeTransfer[toIdx]).to.be.bignumber.equal(receiverInitialBalance);
            // execute transfer
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.safeBatchTransferFrom.sendTransactionAsync(from, to, tokenTypesToTransfer, valuesToTransfer, callbackData, {from}),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // check balances after transfer
            const balancesAfterTransfer = await token.balanceOfBatch.callAsync(participatingOwners, participatingTokens);
            console.log(balancesBeforeTransfer);
            console.log(balancesAfterTransfer);
            expect(balancesAfterTransfer[fromIdx]).to.be.bignumber.equal(balancesBeforeTransfer[fromIdx].minus(valueToTransfer));
            expect(balancesAfterTransfer[toIdx]).to.be.bignumber.equal(balancesBeforeTransfer[toIdx].plus(valueToTransfer));
        });
        it('should transfer non-fungible token if called by token owner', async () => {
            // setup test parameters
            const from = spender;
            const to = erc1155Receiver.address;
            const fromIdx = 0;
            const toIdx = 1;
            const participatingOwners = [from, to];
            const participatingTokens = [dummyNft, dummyNft];
            const tokenTypesToTransfer = [dummyNft];
            const valueToTransfer = new BigNumber(1);
            const valuesToTransfer = [valueToTransfer];
            const callbackData = constants.NULL_BYTES;
            // check balances before transfer
            const balancesBeforeTransfer = await token.balanceOfBatch.callAsync(participatingOwners, participatingTokens);
            expect(balancesBeforeTransfer[fromIdx]).to.be.bignumber.equal(nftOwnerBalance);
            expect(balancesBeforeTransfer[toIdx]).to.be.bignumber.equal(nftNotOwnerBalance);
            // execute transfer
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.safeBatchTransferFrom.sendTransactionAsync(from, to, tokenTypesToTransfer, valuesToTransfer, callbackData, {from}),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // check balances after transfer
            const balancesAfterTransfer = await token.balanceOfBatch.callAsync(participatingOwners, participatingTokens);
            expect(balancesAfterTransfer[fromIdx]).to.be.bignumber.equal(nftNotOwnerBalance);
            expect(balancesAfterTransfer[toIdx]).to.be.bignumber.equal(nftOwnerBalance);
        });
        it('should transfer mix of fungible / non-fungible tokens if called by token owner', async () => {
             // setup test parameters
             const from = spender;
             const to = erc1155Receiver.address;
             const fromIdxFungible = 0;
             const toIdxFungible = 1;
             const fromIdxNonFungible = 2;
             const toIdxNonFungible = 3;
             const participatingOwners = [from, to, from, to];
             const participatingTokens = [dummyFungibleTokenType, dummyFungibleTokenType, dummyNft, dummyNft];
             const tokenTypesToTransfer = [dummyFungibleTokenType, dummyNft];
             const fungibleValueToTransfer = new BigNumber(200);
             const nonFungibleValueToTransfer = new BigNumber(1);
             const valuesToTransfer = [fungibleValueToTransfer, nonFungibleValueToTransfer];
             const callbackData = constants.NULL_BYTES;
             // check balances before transfer
             console.log('1');
             const balancesBeforeTransfer = await token.balanceOfBatch.callAsync(participatingOwners, participatingTokens);
             console.log('2');
             expect(balancesBeforeTransfer[fromIdxFungible]).to.be.bignumber.equal(spenderInitialBalance);
             expect(balancesBeforeTransfer[toIdxFungible]).to.be.bignumber.equal(receiverInitialBalance);
             expect(balancesBeforeTransfer[fromIdxNonFungible]).to.be.bignumber.equal(nftOwnerBalance);
             expect(balancesBeforeTransfer[toIdxNonFungible]).to.be.bignumber.equal(nftNotOwnerBalance);
             // execute transfer
             console.log(tokenTypesToTransfer);
             console.log(valuesToTransfer);
             await web3Wrapper.awaitTransactionSuccessAsync(
                 await token.safeBatchTransferFrom.sendTransactionAsync(from, to, tokenTypesToTransfer, valuesToTransfer, callbackData, {from}),
                 constants.AWAIT_TRANSACTION_MINED_MS,
             );
             console.log('3');
             // check balances after transfer
             const balancesAfterTransfer = await token.balanceOfBatch.callAsync(participatingOwners, participatingTokens);
             console.log(balancesBeforeTransfer);
             console.log(fungibleValueToTransfer);
             console.log(balancesAfterTransfer);
             expect(balancesAfterTransfer[fromIdxFungible]).to.be.bignumber.equal(balancesBeforeTransfer[fromIdxFungible].minus(fungibleValueToTransfer));
             expect(balancesAfterTransfer[toIdxFungible]).to.be.bignumber.equal(balancesBeforeTransfer[toIdxFungible].plus(fungibleValueToTransfer));
             expect(balancesAfterTransfer[fromIdxNonFungible]).to.be.bignumber.equal(nftNotOwnerBalance);
             expect(balancesAfterTransfer[toIdxNonFungible]).to.be.bignumber.equal(nftOwnerBalance);
        });
        it('should trigger callback if transferring to a contract', async () => {

        });
    });
});
// tslint:enable:no-unnecessary-type-assertion