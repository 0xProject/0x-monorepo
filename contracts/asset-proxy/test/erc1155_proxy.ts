import {
    artifacts as erc1155Artifacts,
    DummyERC1155ReceiverBatchTokenReceivedEventArgs,
    DummyERC1155ReceiverContract,
    ERC1155MintableContract,
    Erc1155Wrapper,
} from '@0x/contracts-erc1155';
import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    expectTransactionFailedWithoutReasonAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { ERC1155ProxyWrapper, ERC721ProxyContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

// tslint:disable:no-unnecessary-type-assertion
describe('ERC1155Proxy', () => {
    // constant values used in transfer tests
    const nftOwnerBalance = new BigNumber(1);
    const nftNotOwnerBalance = new BigNumber(0);
    const spenderInitialFungibleBalance = constants.INITIAL_ERC1155_FUNGIBLE_BALANCE;
    const receiverInitialFungibleBalance = constants.INITIAL_ERC1155_FUNGIBLE_BALANCE;
    const receiverContractInitialFungibleBalance = new BigNumber(0);
    const fungibleValueToTransferSmall = spenderInitialFungibleBalance.div(100);
    const fungibleValueToTransferLarge = spenderInitialFungibleBalance.div(4);
    const valueMultiplierSmall = new BigNumber(2);
    const valueMultiplierNft = new BigNumber(1);
    const nonFungibleValueToTransfer = nftOwnerBalance;
    const receiverCallbackData = '0x01020304';
    // addresses
    let owner: string;
    let notAuthorized: string;
    let authorized: string;
    let spender: string;
    let receiver: string;
    let receiverContract: string;
    // contracts & wrappers
    let erc1155Proxy: ERC721ProxyContract;
    let erc1155Receiver: DummyERC1155ReceiverContract;
    let erc1155ProxyWrapper: ERC1155ProxyWrapper;
    let erc1155Contract: ERC1155MintableContract;
    let erc1155Wrapper: Erc1155Wrapper;
    // tokens
    let fungibleTokens: BigNumber[];
    let nonFungibleTokensOwnedBySpender: BigNumber[];
    // tests
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        /// deploy & configure ERC1155Proxy
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, notAuthorized, authorized, spender, receiver] = _.slice(accounts, 0, 5));
        erc1155ProxyWrapper = new ERC1155ProxyWrapper(provider, usedAddresses, owner);
        erc1155Proxy = await erc1155ProxyWrapper.deployProxyAsync();
        await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            authorized,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            erc1155Proxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        // deploy & configure ERC1155 tokens and receiver
        [erc1155Wrapper] = await erc1155ProxyWrapper.deployDummyContractsAsync();
        erc1155Contract = erc1155Wrapper.getContract();
        erc1155Receiver = await DummyERC1155ReceiverContract.deployFrom0xArtifactAsync(
            erc1155Artifacts.DummyERC1155Receiver,
            provider,
            txDefaults,
        );
        receiverContract = erc1155Receiver.address;
        await erc1155ProxyWrapper.setBalancesAndAllowancesAsync();
        fungibleTokens = erc1155ProxyWrapper.getFungibleTokenIds();
        const nonFungibleTokens = erc1155ProxyWrapper.getNonFungibleTokenIds();
        const tokenBalances = await erc1155ProxyWrapper.getBalancesAsync();
        nonFungibleTokensOwnedBySpender = [];
        _.each(nonFungibleTokens, (nonFungibleToken: BigNumber) => {
            const nonFungibleTokenAsString = nonFungibleToken.toString();
            const nonFungibleTokenHeldBySpender =
                tokenBalances.nonFungible[spender][erc1155Contract.address][nonFungibleTokenAsString][0];
            nonFungibleTokensOwnedBySpender.push(nonFungibleTokenHeldBySpender);
        });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('general', () => {
        it('should revert if undefined function is called', async () => {
            const undefinedSelector = '0x01020304';
            await expectTransactionFailedWithoutReasonAsync(
                web3Wrapper.sendTransactionAsync({
                    from: owner,
                    to: erc1155Proxy.address,
                    value: constants.ZERO_AMOUNT,
                    data: undefinedSelector,
                }),
            );
        });
        it('should have an id of 0x9645780d', async () => {
            const proxyId = await erc1155Proxy.getProxyId.callAsync();
            const expectedProxyId = AssetProxyId.ERC1155;
            expect(proxyId).to.equal(expectedProxyId);
        });
    });
    describe('transferFrom', () => {
        it('should successfully transfer value for a single, fungible token', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valuesToTransfer = [fungibleValueToTransferLarge];
            const valueMultiplier = valueMultiplierSmall;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check balances after transfer
            const totalValueTransferred = valuesToTransfer[0].times(valueMultiplier);
            const expectedFinalBalances = [
                spenderInitialFungibleBalance.minus(totalValueTransferred),
                receiverInitialFungibleBalance.plus(totalValueTransferred),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should successfully transfer value for the same fungible token several times', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokenToTransfer = fungibleTokens[0];
            const tokensToTransfer = [tokenToTransfer, tokenToTransfer, tokenToTransfer];
            const valuesToTransfer = [
                fungibleValueToTransferSmall.plus(10),
                fungibleValueToTransferSmall.plus(20),
                fungibleValueToTransferSmall.plus(30),
            ];
            const valueMultiplier = valueMultiplierSmall;
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                spenderInitialFungibleBalance,
                // receiver
                receiverInitialFungibleBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedInitialBalances);
            // execute transfer
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check balances after transfer
            let totalValueTransferred = _.reduce(valuesToTransfer, (sum: BigNumber, value: BigNumber) => {
                return sum.plus(value);
            }) as BigNumber;
            totalValueTransferred = totalValueTransferred.times(valueMultiplier);
            const expectedFinalBalances = [
                // spender
                spenderInitialFungibleBalance.minus(totalValueTransferred),
                // receiver
                receiverInitialFungibleBalance.plus(totalValueTransferred),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, [tokenToTransfer], expectedFinalBalances);
        });
        it('should successfully transfer value for several fungible tokens', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = fungibleTokens.slice(0, 3);
            const valuesToTransfer = [
                fungibleValueToTransferSmall.plus(10),
                fungibleValueToTransferSmall.plus(20),
                fungibleValueToTransferSmall.plus(30),
            ];
            const valueMultiplier = valueMultiplierSmall;
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                spenderInitialFungibleBalance,
                spenderInitialFungibleBalance,
                spenderInitialFungibleBalance,
                // receiver
                receiverInitialFungibleBalance,
                receiverInitialFungibleBalance,
                receiverInitialFungibleBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check balances after transfer
            const totalValuesTransferred = _.map(valuesToTransfer, (value: BigNumber) => {
                return value.times(valueMultiplier);
            });
            const expectedFinalBalances = [
                // spender
                spenderInitialFungibleBalance.minus(totalValuesTransferred[0]),
                spenderInitialFungibleBalance.minus(totalValuesTransferred[1]),
                spenderInitialFungibleBalance.minus(totalValuesTransferred[2]),
                // receiver
                receiverInitialFungibleBalance.plus(totalValuesTransferred[0]),
                receiverInitialFungibleBalance.plus(totalValuesTransferred[1]),
                receiverInitialFungibleBalance.plus(totalValuesTransferred[2]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should successfully transfer a non-fungible token', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = nonFungibleTokensOwnedBySpender.slice(0, 1);
            const valuesToTransfer = [nonFungibleValueToTransfer];
            const valueMultiplier = valueMultiplierNft;
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                nftOwnerBalance,
                // receiver
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check balances after transfer
            const expectedFinalBalances = [
                // spender
                nftNotOwnerBalance,
                // receiver
                nftOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should successfully transfer multiple non-fungible tokens', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = nonFungibleTokensOwnedBySpender.slice(0, 3);
            const valuesToTransfer = [
                nonFungibleValueToTransfer,
                nonFungibleValueToTransfer,
                nonFungibleValueToTransfer,
            ];
            const valueMultiplier = valueMultiplierNft;
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                nftOwnerBalance,
                nftOwnerBalance,
                nftOwnerBalance,
                // receiver
                nftNotOwnerBalance,
                nftNotOwnerBalance,
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check balances after transfer
            const expectedFinalBalances = [
                // spender
                nftNotOwnerBalance,
                nftNotOwnerBalance,
                nftNotOwnerBalance,
                // receiver
                nftOwnerBalance,
                nftOwnerBalance,
                nftOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should successfully transfer value for a combination of several fungible/non-fungible tokens', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const fungibleTokensToTransfer = fungibleTokens.slice(0, 3);
            const nonFungibleTokensToTransfer = nonFungibleTokensOwnedBySpender.slice(0, 2);
            const tokensToTransfer = fungibleTokensToTransfer.concat(nonFungibleTokensToTransfer);
            const valuesToTransfer = [
                fungibleValueToTransferLarge,
                fungibleValueToTransferSmall,
                fungibleValueToTransferSmall,
                nonFungibleValueToTransfer,
                nonFungibleValueToTransfer,
            ];
            const valueMultiplier = valueMultiplierNft;
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                spenderInitialFungibleBalance,
                spenderInitialFungibleBalance,
                spenderInitialFungibleBalance,
                nftOwnerBalance,
                nftOwnerBalance,
                // receiver
                receiverInitialFungibleBalance,
                receiverInitialFungibleBalance,
                receiverInitialFungibleBalance,
                nftNotOwnerBalance,
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check balances after transfer
            const totalValuesTransferred = _.map(valuesToTransfer, (value: BigNumber) => {
                return value.times(valueMultiplier);
            });
            const expectedFinalBalances = [
                // spender
                expectedInitialBalances[0].minus(totalValuesTransferred[0]),
                expectedInitialBalances[1].minus(totalValuesTransferred[1]),
                expectedInitialBalances[2].minus(totalValuesTransferred[2]),
                expectedInitialBalances[3].minus(totalValuesTransferred[3]),
                expectedInitialBalances[4].minus(totalValuesTransferred[4]),
                // receiver
                expectedInitialBalances[5].plus(totalValuesTransferred[0]),
                expectedInitialBalances[6].plus(totalValuesTransferred[1]),
                expectedInitialBalances[7].plus(totalValuesTransferred[2]),
                expectedInitialBalances[8].plus(totalValuesTransferred[3]),
                expectedInitialBalances[9].plus(totalValuesTransferred[4]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should successfully transfer value to a smart contract and trigger its callback', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiverContract];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valuesToTransfer = [fungibleValueToTransferLarge];
            const valueMultiplier = valueMultiplierSmall;
            const totalValuesTransferred = _.map(valuesToTransfer, (value: BigNumber) => {
                return value.times(valueMultiplier);
            });
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverContractInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            const txReceipt = await erc1155ProxyWrapper.transferFromWithLogsAsync(
                spender,
                receiverContract,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check receiver log ignored extra asset data
            expect(txReceipt.logs.length).to.be.equal(2);
            const receiverLog = txReceipt.logs[1] as LogWithDecodedArgs<
                DummyERC1155ReceiverBatchTokenReceivedEventArgs
            >;
            expect(receiverLog.args.operator).to.be.equal(erc1155Proxy.address);
            expect(receiverLog.args.from).to.be.equal(spender);
            expect(receiverLog.args.tokenIds.length).to.be.deep.equal(1);
            expect(receiverLog.args.tokenIds[0]).to.be.bignumber.equal(tokensToTransfer[0]);
            expect(receiverLog.args.tokenValues.length).to.be.deep.equal(1);
            expect(receiverLog.args.tokenValues[0]).to.be.bignumber.equal(totalValuesTransferred[0]);
            // note - if the `extraData` is ignored then the receiver log should ignore it as well.
            expect(receiverLog.args.data).to.be.deep.equal(receiverCallbackData);
            // check balances after transfer
            const expectedFinalBalances = [
                expectedInitialBalances[0].minus(totalValuesTransferred[0]),
                expectedInitialBalances[1].plus(totalValuesTransferred[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should successfully transfer value to a smart contract and trigger its callback, when callback `data` is NULL', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiverContract];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valuesToTransfer = [fungibleValueToTransferLarge];
            const valueMultiplier = valueMultiplierSmall;
            const totalValuesTransferred = _.map(valuesToTransfer, (value: BigNumber) => {
                return value.times(valueMultiplier);
            });
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverContractInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            const nullReceiverCallbackData = '0x';
            const txReceipt = await erc1155ProxyWrapper.transferFromWithLogsAsync(
                spender,
                receiverContract,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                nullReceiverCallbackData,
                authorized,
            );
            // check receiver log ignored extra asset data
            expect(txReceipt.logs.length).to.be.equal(2);
            const receiverLog = txReceipt.logs[1] as LogWithDecodedArgs<
                DummyERC1155ReceiverBatchTokenReceivedEventArgs
            >;
            expect(receiverLog.args.operator).to.be.equal(erc1155Proxy.address);
            expect(receiverLog.args.from).to.be.equal(spender);
            expect(receiverLog.args.tokenIds.length).to.be.deep.equal(1);
            expect(receiverLog.args.tokenIds[0]).to.be.bignumber.equal(tokensToTransfer[0]);
            expect(receiverLog.args.tokenValues.length).to.be.deep.equal(1);
            expect(receiverLog.args.tokenValues[0]).to.be.bignumber.equal(totalValuesTransferred[0]);
            // note - if the `extraData` is ignored then the receiver log should ignore it as well.
            expect(receiverLog.args.data).to.be.deep.equal(nullReceiverCallbackData);
            // check balances after transfer
            const expectedFinalBalances = [
                expectedInitialBalances[0].minus(totalValuesTransferred[0]),
                expectedInitialBalances[1].plus(totalValuesTransferred[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should successfully transfer value and ignore extra assetData', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiverContract];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valuesToTransfer = [fungibleValueToTransferLarge];
            const valueMultiplier = valueMultiplierSmall;
            const totalValuesTransferred = _.map(valuesToTransfer, (value: BigNumber) => {
                return value.times(valueMultiplier);
            });
            const erc1155ContractAddress = erc1155Wrapper.getContract().address;
            const assetData = assetDataUtils.encodeERC1155AssetData(
                erc1155ContractAddress,
                tokensToTransfer,
                valuesToTransfer,
                receiverCallbackData,
            );
            const extraData = '0102030405060708';
            const assetDataWithExtraData = `${assetData}${extraData}`;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverContractInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            const txReceipt = await erc1155ProxyWrapper.transferFromWithLogsAsync(
                spender,
                receiverContract,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
                assetDataWithExtraData,
            );
            // check receiver log ignored extra asset data
            expect(txReceipt.logs.length).to.be.equal(2);
            const receiverLog = txReceipt.logs[1] as LogWithDecodedArgs<
                DummyERC1155ReceiverBatchTokenReceivedEventArgs
            >;
            expect(receiverLog.args.operator).to.be.equal(erc1155Proxy.address);
            expect(receiverLog.args.from).to.be.equal(spender);
            expect(receiverLog.args.tokenIds.length).to.be.deep.equal(1);
            expect(receiverLog.args.tokenIds[0]).to.be.bignumber.equal(tokensToTransfer[0]);
            expect(receiverLog.args.tokenValues.length).to.be.deep.equal(1);
            expect(receiverLog.args.tokenValues[0]).to.be.bignumber.equal(totalValuesTransferred[0]);
            // note - if the `extraData` is ignored then the receiver log should ignore it as well.
            expect(receiverLog.args.data).to.be.deep.equal(receiverCallbackData);
            // check balances after transfer
            const expectedFinalBalances = [
                expectedInitialBalances[0].minus(totalValuesTransferred[0]),
                expectedInitialBalances[1].plus(totalValuesTransferred[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should successfully transfer if token ids and values are abi encoded to same entry in calldata', async () => {
            /**
             * Suppose the `tokensToTransfer` and `valuesToTransfer` are identical; their offsets in
             * the ABI-encoded asset data may be the same. E.g. token IDs [1, 2] and values [1, 2].
             * Suppose we scale by a factor of 2, then we expect to trade token IDs [1, 2] and values [2, 4].
             * This test ensures that scaling the values does not simultaneously scale the token IDs.
             */
            ///// Step 1/5 /////
            // Create tokens with ids [1, 2, 3, 4] and mint a balance of 4 for the `spender`
            const tokensToCreate = [new BigNumber(1), new BigNumber(2), new BigNumber(3), new BigNumber(4)];
            const spenderInitialBalance = new BigNumber(4);
            const receiverInitialBalance = new BigNumber(0);
            const tokenUri = '';
            const tokenIsNft = false;
            for (const tokenToCreate of tokensToCreate) {
                // create token
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc1155Wrapper
                        .getContract()
                        .createWithType.sendTransactionAsync(tokenToCreate, tokenUri, tokenIsNft, {
                            from: owner,
                        }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // mint balance for spender
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc1155Wrapper
                        .getContract()
                        .mintFungible.sendTransactionAsync(tokenToCreate, [spender], [spenderInitialBalance], {
                            from: owner,
                        }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
            }
            ///// Step 2/5 /////
            // Check balances before transfer
            const balanceHolders = [spender, spender, spender, spender, receiver, receiver, receiver, receiver];
            const balanceTokens = tokensToCreate.concat(tokensToCreate);
            const initialBalances = await erc1155Wrapper.getBalancesAsync(balanceHolders, balanceTokens);
            const expectedInitialBalances = [
                spenderInitialBalance, // Token ID 1 / Spender Balance
                spenderInitialBalance, // Token ID 2 / Spender Balance
                spenderInitialBalance, // Token ID 3 / Spender Balance
                spenderInitialBalance, // Token ID 4 / Spender Balance
                receiverInitialBalance, // Token ID 1 / Receiver Balance
                receiverInitialBalance, // Token ID 2 / Receiver Balance
                receiverInitialBalance, // Token ID 3 / Receiver Balance
                receiverInitialBalance, // Token ID 4 / Receiver Balance
            ];
            expect(initialBalances).to.be.deep.equal(expectedInitialBalances);
            ///// Step 3/5 /////
            // Create optimized calldata. We expect it to be formatted like the table below.
            // 0x         0000000000000000000000000b1ba0af832d7c05fd64161e0db78e85978e8082      // ERC1155 contract address
            // 0x20       0000000000000000000000000000000000000000000000000000000000000080      // Offset to token IDs
            // 0x40       0000000000000000000000000000000000000000000000000000000000000080      // Offset to token values (same as IDs)
            // 0x60       00000000000000000000000000000000000000000000000000000000000000e0      // Offset to data
            // 0x80       0000000000000000000000000000000000000000000000000000000000000002      // Length of token Ids / token values
            // 0xA0       0000000000000000000000000000000000000000000000000000000000000001      // First Token ID / Token value
            // 0xC0       0000000000000000000000000000000000000000000000000000000000000002      // Second Token ID / Token value
            // 0xE0       0000000000000000000000000000000000000000000000000000000000000004      // Length of callback data
            // 0x100      0102030400000000000000000000000000000000000000000000000000000000      // Callback data
            const erc1155ContractAddress = erc1155Wrapper.getContract().address;
            const tokensToTransfer = [new BigNumber(1), new BigNumber(2)];
            const valuesToTransfer = tokensToTransfer;
            const valueMultiplier = new BigNumber(2);
            const assetData = assetDataUtils.encodeERC1155AssetData(
                erc1155ContractAddress,
                tokensToTransfer,
                valuesToTransfer,
                receiverCallbackData,
            );
            const offsetToTokenIds = 74;
            const assetDataWithoutContractAddress = assetData.substr(offsetToTokenIds);
            const expectedAssetDataWithoutContractAddress =
                '0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040102030400000000000000000000000000000000000000000000000000000000';
            expect(assetDataWithoutContractAddress).to.be.equal(expectedAssetDataWithoutContractAddress);
            ///// Step 4/5 /////
            // Transfer token IDs [1, 2] and amounts [1, 2] with a multiplier of 2;
            // the expected trade will be token IDs [1, 2] and amounts [2, 4]
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
                assetData,
            );
            ///// Step 5/5 /////
            // Validate final balances
            const finalBalances = await erc1155Wrapper.getBalancesAsync(balanceHolders, balanceTokens);
            const expectedAmountsTransferred = _.map(valuesToTransfer, value => {
                return value.times(valueMultiplier);
            });
            const expectedFinalBalances = [
                spenderInitialBalance.minus(expectedAmountsTransferred[0]), // Token ID 1 / Spender Balance
                spenderInitialBalance.minus(expectedAmountsTransferred[1]), // Token ID 2 / Spender Balance
                spenderInitialBalance, // Token ID 3 / Spender Balance
                spenderInitialBalance, // Token ID 4 / Spender Balance
                receiverInitialBalance.plus(expectedAmountsTransferred[0]), // Token ID 1 / Receiver Balance
                receiverInitialBalance.plus(expectedAmountsTransferred[1]), // Token ID 2 / Receiver Balance
                receiverInitialBalance, // Token ID 3 / Receiver Balance
                receiverInitialBalance, // Token ID 4 / Receiver Balance
            ];
            expect(finalBalances).to.be.deep.equal(expectedFinalBalances);
        });
        it('should transfer nothing if value is zero', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valuesToTransfer = [new BigNumber(0)];
            const valueMultiplier = valueMultiplierSmall;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check balances after transfer
            const expectedFinalBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should transfer nothing if value multiplier is zero', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valuesToTransfer = [fungibleValueToTransferLarge];
            const valueMultiplier = new BigNumber(0);
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check balances after transfer
            const expectedFinalBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should transfer nothing if there are no tokens in asset data', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer: BigNumber[] = [];
            const valuesToTransfer: BigNumber[] = [];
            const valueMultiplier = valueMultiplierSmall;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await erc1155ProxyWrapper.transferFromAsync(
                spender,
                receiver,
                erc1155Contract.address,
                tokensToTransfer,
                valuesToTransfer,
                valueMultiplier,
                receiverCallbackData,
                authorized,
            );
            // check balances after transfer
            const expectedFinalBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should propagate revert reason from erc1155 contract failure', async () => {
            // disable transfers
            const shouldRejectTransfer = true;
            await erc1155Receiver.setRejectTransferFlag.awaitTransactionSuccessAsync(
                shouldRejectTransfer,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // setup test parameters
            const tokenHolders = [spender, receiverContract];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valuesToTransfer = [fungibleValueToTransferLarge];
            const valueMultiplier = valueMultiplierSmall;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverContractInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155ProxyWrapper.transferFromAsync(
                    spender,
                    receiverContract,
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    valueMultiplier,
                    receiverCallbackData,
                    authorized,
                ),
                RevertReason.TransferRejected,
            );
        });
        it('should revert if transferring the same non-fungible token more than once', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const nftToTransfer = nonFungibleTokensOwnedBySpender[0];
            const tokensToTransfer = [nftToTransfer, nftToTransfer];
            const valuesToTransfer = [nonFungibleValueToTransfer, nonFungibleValueToTransfer];
            const valueMultiplier = valueMultiplierNft;
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                nftOwnerBalance,
                nftOwnerBalance,
                // receiver
                nftNotOwnerBalance,
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155ProxyWrapper.transferFromAsync(
                    spender,
                    receiver,
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    valueMultiplier,
                    receiverCallbackData,
                    authorized,
                ),
                RevertReason.NFTNotOwnedByFromAddress,
            );
        });
        it('should revert if there is a multiplication overflow', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = nonFungibleTokensOwnedBySpender.slice(0, 3);
            const maxUintValue = new BigNumber(2).pow(256).minus(1);
            const valuesToTransfer = [nonFungibleValueToTransfer, maxUintValue, nonFungibleValueToTransfer];
            const valueMultiplier = new BigNumber(2);
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                nftOwnerBalance,
                nftOwnerBalance,
                nftOwnerBalance,
                // receiver
                nftNotOwnerBalance,
                nftNotOwnerBalance,
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            // note - this will overflow because we are trying to transfer `maxUintValue * 2` of the 2nd token
            await expectTransactionFailedAsync(
                erc1155ProxyWrapper.transferFromAsync(
                    spender,
                    receiver,
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    valueMultiplier,
                    receiverCallbackData,
                    authorized,
                ),
                RevertReason.Uint256Overflow,
            );
        });
        it('should revert if transferring > 1 instances of a non-fungible token (valueMultiplier field >1)', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = nonFungibleTokensOwnedBySpender.slice(0, 1);
            const valuesToTransfer = [nonFungibleValueToTransfer];
            const valueMultiplier = new BigNumber(2);
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                nftOwnerBalance,
                // receiver
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155ProxyWrapper.transferFromAsync(
                    spender,
                    receiver,
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    valueMultiplier,
                    receiverCallbackData,
                    authorized,
                ),
                RevertReason.AmountEqualToOneRequired,
            );
        });
        it('should revert if transferring > 1 instances of a non-fungible token (`valuesToTransfer` field >1)', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = nonFungibleTokensOwnedBySpender.slice(0, 1);
            const valuesToTransfer = [new BigNumber(2)];
            const valueMultiplier = valueMultiplierNft;
            // check balances before transfer
            const expectedInitialBalances = [
                // spender
                nftOwnerBalance,
                // receiver
                nftNotOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155ProxyWrapper.transferFromAsync(
                    spender,
                    receiver,
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    valueMultiplier,
                    receiverCallbackData,
                    authorized,
                ),
                RevertReason.AmountEqualToOneRequired,
            );
        });
        it('should revert if sender balance is insufficient', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valueGreaterThanSpenderBalance = spenderInitialFungibleBalance.plus(1);
            const valuesToTransfer = [valueGreaterThanSpenderBalance];
            const valueMultiplier = valueMultiplierSmall;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155ProxyWrapper.transferFromAsync(
                    spender,
                    receiver,
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    valueMultiplier,
                    receiverCallbackData,
                    authorized,
                ),
                RevertReason.Uint256Underflow,
            );
        });
        it('should revert if sender allowance is insufficient', async () => {
            // dremove allowance for ERC1155 proxy
            const wrapper = erc1155ProxyWrapper.getContractWrapper(erc1155Contract.address);
            const isApproved = false;
            await wrapper.setApprovalForAllAsync(spender, erc1155Proxy.address, isApproved);
            const isApprovedActualValue = await wrapper.isApprovedForAllAsync(spender, erc1155Proxy.address);
            expect(isApprovedActualValue).to.be.equal(isApproved);
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valuesToTransfer = [fungibleValueToTransferLarge];
            const valueMultiplier = valueMultiplierSmall;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155ProxyWrapper.transferFromAsync(
                    spender,
                    receiver,
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    valueMultiplier,
                    receiverCallbackData,
                    authorized,
                ),
                RevertReason.InsufficientAllowance,
            );
        });
        it('should revert if caller is not authorized', async () => {
            // setup test parameters
            const tokenHolders = [spender, receiver];
            const tokensToTransfer = fungibleTokens.slice(0, 1);
            const valuesToTransfer = [fungibleValueToTransferLarge];
            const valueMultiplier = valueMultiplierSmall;
            // check balances before transfer
            const expectedInitialBalances = [spenderInitialFungibleBalance, receiverInitialFungibleBalance];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await expectTransactionFailedAsync(
                erc1155ProxyWrapper.transferFromAsync(
                    spender,
                    receiver,
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    valueMultiplier,
                    receiverCallbackData,
                    notAuthorized,
                ),
                RevertReason.SenderNotAuthorized,
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
