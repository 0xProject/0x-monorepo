import {
    artifacts as proxyArtifacts,
    ERC1155ProxyWrapper,
    ERC20ProxyContract,
    ERC20Wrapper,
    ERC721ProxyContract,
    ERC721Wrapper,
    MultiAssetProxyContract,
    StaticCallProxyContract,
    TestStaticCallTargetContract,
} from '@0x/contracts-asset-proxy';
import { ERC1155MintableContract } from '@0x/contracts-erc1155';
import {
    artifacts as erc20Artifacts,
    DummyERC20TokenContract,
    DummyERC20TokenTransferEventArgs,
    DummyNoReturnERC20TokenContract,
} from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import {
    chaiSetup,
    constants,
    ERC20BalancesByOwner,
    getLatestBlockTimestampAsync,
    hexConcat,
    increaseTimeAndMineBlockAsync,
    OrderFactory,
    OrderStatus,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, ExchangeRevertErrors, LibMathRevertErrors, orderHashUtils } from '@0x/order-utils';
import { RevertReason, SignatureType, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils, ReentrancyGuardRevertErrors, StringRevertError } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { Erc1155Wrapper } from '../../erc1155/lib/src';
import {
    artifacts,
    constants as exchangeConstants,
    ExchangeCancelEventArgs,
    ExchangeContract,
    ExchangeWrapper,
    ReentrantERC20TokenContract,
    TestValidatorWalletContract,
    ValidatorWalletAction,
    ValidatorWalletDataType,
} from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

// tslint:disable:no-unnecessary-type-assertion
describe.only('Exchange core', () => {
    let chainId: number;
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let feeToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let noReturnErc20Token: DummyNoReturnERC20TokenContract;
    let reentrantErc20Token: ReentrantERC20TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let erc1155Proxy: ERC721ProxyContract;
    let multiAssetProxy: MultiAssetProxyContract;
    let validatorWallet: TestValidatorWalletContract;
    let erc1155Contract: ERC1155MintableContract;
    let staticCallProxy: StaticCallProxyContract;
    let staticCallTarget: TestStaticCallTargetContract;

    let signedOrder: SignedOrder;
    let erc20Balances: ERC20BalancesByOwner;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc1155Wrapper: Erc1155Wrapper;
    let erc1155ProxyWrapper: ERC1155ProxyWrapper;
    let orderFactory: OrderFactory;

    let erc721MakerAssetIds: BigNumber[];
    let erc721TakerAssetIds: BigNumber[];
    let erc1155FungibleTokens: BigNumber[];
    let erc1155NonFungibleTokensOwnedByMaker: BigNumber[];
    let erc1155NonFungibleTokensOwnedByTaker: BigNumber[];

    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;
    let defaultFeeAssetAddress: string;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        chainId = await providerUtils.getChainIdAsync(provider);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = _.slice(accounts, 0, 4));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);
        erc1155ProxyWrapper = new ERC1155ProxyWrapper(provider, usedAddresses, owner);

        // Deploy AssetProxies, Exchange, tokens, and malicious contracts
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        multiAssetProxy = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.MultiAssetProxy,
            provider,
            txDefaults,
        );
        staticCallProxy = await StaticCallProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.StaticCallProxy,
            provider,
            txDefaults,
        );
        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, feeToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc1155Proxy = await erc1155ProxyWrapper.deployProxyAsync();
        [erc1155Wrapper] = await erc1155ProxyWrapper.deployDummyContractsAsync();
        erc1155Contract = erc1155Wrapper.getContract();
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            new BigNumber(chainId),
        );
        validatorWallet = await TestValidatorWalletContract.deployFrom0xArtifactAsync(
            artifacts.TestValidatorWallet,
            provider,
            txDefaults,
            exchange.address,
        );
        reentrantErc20Token = await ReentrantERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.ReentrantERC20Token,
            provider,
            txDefaults,
            exchange.address,
        );
        // Configure ERC20Proxy
        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, { from: owner });
        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(multiAssetProxy.address, { from: owner });

        // Configure ERC721Proxy
        await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, { from: owner });
        await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(multiAssetProxy.address, { from: owner });

        // Configure ERC1155Proxy
        await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, { from: owner });
        await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(multiAssetProxy.address, { from: owner });

        // Configure MultiAssetProxy
        await multiAssetProxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, { from: owner });
        await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, { from: owner });
        await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(erc721Proxy.address, { from: owner });
        await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(staticCallProxy.address, { from: owner });

        // Configure Exchange
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc1155Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(multiAssetProxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(staticCallProxy.address, owner);

        // Configure ERC20 tokens
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        // Configure ERC721 tokens
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetIds = erc721Balances[makerAddress][erc721Token.address];
        erc721TakerAssetIds = erc721Balances[takerAddress][erc721Token.address];

        // Configure ERC1155 tokens
        await erc1155ProxyWrapper.setBalancesAndAllowancesAsync();
        erc1155FungibleTokens = erc1155ProxyWrapper.getFungibleTokenIds();
        const nonFungibleTokens = erc1155ProxyWrapper.getNonFungibleTokenIds();
        const tokenBalances = await erc1155ProxyWrapper.getBalancesAsync();
        erc1155NonFungibleTokensOwnedByMaker = [];
        erc1155NonFungibleTokensOwnedByTaker = [];
        _.each(nonFungibleTokens, (nonFungibleToken: BigNumber) => {
            const nonFungibleTokenAsString = nonFungibleToken.toString();
            const nonFungibleTokenHeldByMaker =
                tokenBalances.nonFungible[makerAddress][erc1155Contract.address][nonFungibleTokenAsString][0];
            erc1155NonFungibleTokensOwnedByMaker.push(nonFungibleTokenHeldByMaker);
            const nonFungibleTokenHeldByTaker =
                tokenBalances.nonFungible[takerAddress][erc1155Contract.address][nonFungibleTokenAsString][0];
            erc1155NonFungibleTokensOwnedByTaker.push(nonFungibleTokenHeldByTaker);
        });

        // Configure order defaults
        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = erc20TokenB.address;
        defaultFeeAssetAddress = feeToken.address;
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeAssetAddress),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeAssetAddress),
            domain: {
                verifyingContractAddress: exchange.address,
                chainId,
            },
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('fillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        const reentrancyTest = (functionNames: string[]) => {
            _.forEach(functionNames, (functionName: string, functionId: number) => {
                const description = `should not allow fillOrder to reenter the Exchange contract via ${functionName}`;
                it(description, async () => {
                    signedOrder = await orderFactory.newSignedOrderAsync({
                        makerAssetData: await assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                    });
                    await reentrantErc20Token.setReentrantFunction.awaitTransactionSuccessAsync(functionId);
                    const expectedError = new ReentrancyGuardRevertErrors.IllegalReentrancyError();
                    const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
                    return expect(tx).to.revertWith(expectedError);
                });
            });
        };
        describe('fillOrder reentrancy tests', () => reentrancyTest(exchangeConstants.FUNCTIONS_WITH_MUTEX));

        describe('repeatable signature types', () => {
            beforeEach(async () => {
                // Approve the ERC20 proxy with the test validator wallet.
                await validatorWallet.approveERC20.awaitTransactionSuccessAsync(
                    erc20TokenA.address,
                    erc20Proxy.address,
                    constants.INITIAL_ERC20_ALLOWANCE,
                );
                // Mint some ERC20 tokens to the test validator wallet.
                await erc20TokenA.setBalance.awaitTransactionSuccessAsync(
                    validatorWallet.address,
                    constants.INITIAL_ERC20_BALANCE,
                );
                // Approve the validator.
                await exchange.setSignatureValidatorApproval.awaitTransactionSuccessAsync(
                    validatorWallet.address,
                    true,
                    {
                        from: makerAddress,
                    },
                );
                signedOrder = await orderFactory.newSignedOrderAsync({
                    makerFee: constants.ZERO_AMOUNT,
                    takerFee: constants.ZERO_AMOUNT,
                });
            });

            it('should revert if `Validator` signature type rejects during a second fill', async () => {
                const signatureHex = hexConcat(validatorWallet.address, SignatureType.Validator);
                signedOrder.signature = signatureHex;
                const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
                // Allow the signature check for the first fill.
                await validatorWallet.prepare.awaitTransactionSuccessAsync(
                    orderHashHex,
                    ValidatorWalletDataType.Order,
                    ValidatorWalletAction.Accept,
                    constants.NULL_BYTES,
                );
                const fillAmount = signedOrder.takerAssetAmount.div(10);
                await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount: fillAmount });
                // Reject the signature check for the second fill.
                await validatorWallet.prepare.awaitTransactionSuccessAsync(
                    orderHashHex,
                    ValidatorWalletDataType.Order,
                    ValidatorWalletAction.Reject,
                    constants.NULL_BYTES,
                );
                const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: fillAmount,
                });
                const expectedError = new ExchangeRevertErrors.SignatureError(
                    ExchangeRevertErrors.SignatureErrorCode.BadSignature,
                    orderHashHex,
                    signedOrder.makerAddress,
                    signedOrder.signature,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('should revert if `Wallet` signature type rejects during a second fill', async () => {
                const signatureHex = hexConcat(SignatureType.Wallet);
                signedOrder.makerAddress = validatorWallet.address;
                signedOrder.signature = signatureHex;
                const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
                // Allow the signature check for the first fill.
                await validatorWallet.prepare.awaitTransactionSuccessAsync(
                    orderHashHex,
                    ValidatorWalletDataType.Order,
                    ValidatorWalletAction.Accept,
                    constants.NULL_BYTES,
                );
                const fillAmount = signedOrder.takerAssetAmount.div(10);
                await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount: fillAmount });
                // Reject the signature check for the second fill.
                await validatorWallet.prepare.awaitTransactionSuccessAsync(
                    orderHashHex,
                    ValidatorWalletDataType.Order,
                    ValidatorWalletAction.Reject,
                    constants.NULL_BYTES,
                );
                const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: fillAmount,
                });
                const expectedError = new ExchangeRevertErrors.SignatureError(
                    ExchangeRevertErrors.SignatureErrorCode.BadSignature,
                    orderHashHex,
                    signedOrder.makerAddress,
                    signedOrder.signature,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('should revert if `EIP1271Wallet` signature type rejects during a second fill', async () => {
                const signatureHex = hexConcat(SignatureType.EIP1271Wallet);
                signedOrder.makerAddress = validatorWallet.address;
                signedOrder.signature = signatureHex;
                const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
                // Allow the signature check for the first fill.
                await validatorWallet.prepare.awaitTransactionSuccessAsync(
                    orderHashHex,
                    ValidatorWalletDataType.Order,
                    ValidatorWalletAction.Accept,
                    constants.NULL_BYTES,
                );
                const fillAmount = signedOrder.takerAssetAmount.div(10);
                await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount: fillAmount });
                // Reject the signature check for the second fill.
                await validatorWallet.prepare.awaitTransactionSuccessAsync(
                    orderHashHex,
                    ValidatorWalletDataType.Order,
                    ValidatorWalletAction.Reject,
                    constants.NULL_BYTES,
                );
                const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: fillAmount,
                });
                const expectedError = new ExchangeRevertErrors.SignatureError(
                    ExchangeRevertErrors.SignatureErrorCode.BadSignature,
                    orderHashHex,
                    signedOrder.makerAddress,
                    signedOrder.signature,
                );
                return expect(tx).to.revertWith(expectedError);
            });
        });

        it('should revert if fully filled', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHex, OrderStatus.FullyFilled);
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should not emit transfer events for transfers where from == to', async () => {
            const txReceipt = await exchangeWrapper.fillOrderAsync(signedOrder, makerAddress);
            const logs = txReceipt.logs;
            const transferLogs = _.filter(
                logs,
                log => (log as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).event === 'Transfer',
            );
            expect(transferLogs.length).to.be.equal(2);
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                feeToken.address,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                makerAddress,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                feeRecipientAddress,
            );
            expect(
                (transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.makerFee);
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                feeToken.address,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                makerAddress,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                feeRecipientAddress,
            );
            expect(
                (transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.takerFee);
        });

        it('should revert if order is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            signedOrder = await orderFactory.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHash, OrderStatus.Expired);
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('Fill transfer ordering', () => {
        it('should allow the maker to exchange assets received by the taker', async () => {
            // Set maker/taker assetData to the same asset
            const takerAssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
            const takerAssetAmount = new BigNumber(1);
            const makerAssetData = assetDataUtils.encodeMultiAssetData([takerAssetAmount], [takerAssetData]);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount: takerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            // Set maker balance to 0 so that the asset must be received by the taker in order for the fill to succeed
            await erc20TokenA.setBalance.awaitTransactionSuccessAsync(makerAddress, constants.ZERO_AMOUNT, {
                from: owner,
            });
            const txReceipt = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            const logs = txReceipt.logs;
            const transferLogs = _.filter(
                logs,
                log => (log as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).event === 'Transfer',
            );
            expect(transferLogs.length).to.be.equal(2);
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                erc20TokenA.address,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                takerAddress,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                makerAddress,
            );
            expect(
                (transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.takerAssetAmount);
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                erc20TokenA.address,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                makerAddress,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                takerAddress,
            );
            expect(
                (transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.makerAssetAmount);
        });
        it('should allow the taker to pay fees with an asset that received by the maker', async () => {
            const makerAssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerFeeAssetData: makerAssetData,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: new BigNumber(1),
            });
            // Set taker balance to 0 so that the asset must be received by the maker in order for the fill to succeed
            await erc20TokenA.setBalance.awaitTransactionSuccessAsync(takerAddress, constants.ZERO_AMOUNT, {
                from: owner,
            });
            const txReceipt = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            const logs = txReceipt.logs;
            const transferLogs = _.filter(
                logs,
                log => (log as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).event === 'Transfer',
            );
            expect(transferLogs.length).to.be.equal(3);
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                erc20TokenB.address,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                takerAddress,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                makerAddress,
            );
            expect(
                (transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.takerAssetAmount);
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                erc20TokenA.address,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                makerAddress,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                takerAddress,
            );
            expect(
                (transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.makerAssetAmount);
            expect((transferLogs[2] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                erc20TokenA.address,
            );
            expect((transferLogs[2] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                takerAddress,
            );
            expect((transferLogs[2] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                feeRecipientAddress,
            );
            expect(
                (transferLogs[2] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.takerFee);
        });
        it('should allow the maker to pay fees with an asset that received by the taker', async () => {
            const takerAssetData = assetDataUtils.encodeERC20AssetData(erc20TokenB.address);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerFeeAssetData: takerAssetData,
                makerFee: new BigNumber(1),
                takerFee: constants.ZERO_AMOUNT,
            });
            // Set maker balance to 0 so that the asset must be received by the taker in order for the fill to succeed
            await erc20TokenB.setBalance.awaitTransactionSuccessAsync(makerAddress, constants.ZERO_AMOUNT, {
                from: owner,
            });
            const txReceipt = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            const logs = txReceipt.logs;
            const transferLogs = _.filter(
                logs,
                log => (log as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).event === 'Transfer',
            );
            expect(transferLogs.length).to.be.equal(3);
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                erc20TokenB.address,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                takerAddress,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                makerAddress,
            );
            expect(
                (transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.takerAssetAmount);
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                erc20TokenA.address,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                makerAddress,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                takerAddress,
            );
            expect(
                (transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.makerAssetAmount);
            expect((transferLogs[2] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                erc20TokenB.address,
            );
            expect((transferLogs[2] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                makerAddress,
            );
            expect((transferLogs[2] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                feeRecipientAddress,
            );
            expect(
                (transferLogs[2] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.makerFee);
        });
    });
    describe('Testing exchange of ERC20 tokens with no return values', () => {
        before(async () => {
            noReturnErc20Token = await DummyNoReturnERC20TokenContract.deployFrom0xArtifactAsync(
                erc20Artifacts.DummyNoReturnERC20Token,
                provider,
                txDefaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
                constants.DUMMY_TOKEN_DECIMALS,
                constants.DUMMY_TOKEN_TOTAL_SUPPLY,
            );
            await noReturnErc20Token.setBalance.awaitTransactionSuccessAsync(
                makerAddress,
                constants.INITIAL_ERC20_BALANCE,
            );
            await noReturnErc20Token.approve.awaitTransactionSuccessAsync(
                erc20Proxy.address,
                constants.INITIAL_ERC20_ALLOWANCE,
                { from: makerAddress },
            );
        });
        it('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const initialMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const initialFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const finalFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);

            expect(finalMakerBalanceA).to.be.bignumber.equal(initialMakerBalanceA.minus(signedOrder.makerAssetAmount));
            expect(finalMakerBalanceB).to.be.bignumber.equal(initialMakerBalanceB.plus(signedOrder.takerAssetAmount));
            expect(finalTakerBalanceA).to.be.bignumber.equal(initialTakerBalanceA.plus(signedOrder.makerAssetAmount));
            expect(finalTakerBalanceB).to.be.bignumber.equal(initialTakerBalanceB.minus(signedOrder.takerAssetAmount));
            expect(finalMakerFeeTokenBalance).to.be.bignumber.equal(
                initialMakerFeeTokenBalance.minus(signedOrder.makerFee),
            );
            expect(finalTakerFeeTokenBalance).to.be.bignumber.equal(
                initialTakerFeeTokenBalance.minus(signedOrder.takerFee),
            );
            expect(finalFeeRecipientFeeTokenBalance).to.be.bignumber.equal(
                initialFeeRecipientFeeTokenBalance.plus(signedOrder.makerFee.plus(signedOrder.takerFee)),
            );
        });
        it('should transfer the correct amounts when makerAssetAmount > takerAssetAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const initialMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const initialFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const finalFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);

            expect(finalMakerBalanceA).to.be.bignumber.equal(initialMakerBalanceA.minus(signedOrder.makerAssetAmount));
            expect(finalMakerBalanceB).to.be.bignumber.equal(initialMakerBalanceB.plus(signedOrder.takerAssetAmount));
            expect(finalTakerBalanceA).to.be.bignumber.equal(initialTakerBalanceA.plus(signedOrder.makerAssetAmount));
            expect(finalTakerBalanceB).to.be.bignumber.equal(initialTakerBalanceB.minus(signedOrder.takerAssetAmount));
            expect(finalMakerFeeTokenBalance).to.be.bignumber.equal(
                initialMakerFeeTokenBalance.minus(signedOrder.makerFee),
            );
            expect(finalTakerFeeTokenBalance).to.be.bignumber.equal(
                initialTakerFeeTokenBalance.minus(signedOrder.takerFee),
            );
            expect(finalFeeRecipientFeeTokenBalance).to.be.bignumber.equal(
                initialFeeRecipientFeeTokenBalance.plus(signedOrder.makerFee.plus(signedOrder.takerFee)),
            );
        });
        it('should transfer the correct amounts when makerAssetAmount < takerAssetAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const initialMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const initialFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const finalFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);

            expect(finalMakerBalanceA).to.be.bignumber.equal(initialMakerBalanceA.minus(signedOrder.makerAssetAmount));
            expect(finalMakerBalanceB).to.be.bignumber.equal(initialMakerBalanceB.plus(signedOrder.takerAssetAmount));
            expect(finalTakerBalanceA).to.be.bignumber.equal(initialTakerBalanceA.plus(signedOrder.makerAssetAmount));
            expect(finalTakerBalanceB).to.be.bignumber.equal(initialTakerBalanceB.minus(signedOrder.takerAssetAmount));
            expect(finalMakerFeeTokenBalance).to.be.bignumber.equal(
                initialMakerFeeTokenBalance.minus(signedOrder.makerFee),
            );
            expect(finalTakerFeeTokenBalance).to.be.bignumber.equal(
                initialTakerFeeTokenBalance.minus(signedOrder.takerFee),
            );
            expect(finalFeeRecipientFeeTokenBalance).to.be.bignumber.equal(
                initialFeeRecipientFeeTokenBalance.plus(signedOrder.makerFee.plus(signedOrder.takerFee)),
            );
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should revert if not sent by maker', async () => {
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.InvalidMakerError(orderHash, takerAddress);
            const tx = exchangeWrapper.cancelOrderAsync(signedOrder, takerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if makerAssetAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(0),
            });
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(
                orderHash,
                OrderStatus.InvalidMakerAssetAmount,
            );
            const tx = exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if takerAssetAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerAssetAmount: new BigNumber(0),
            });
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(
                orderHash,
                OrderStatus.InvalidTakerAssetAmount,
            );
            const tx = exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should be able to cancel an order', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHash, OrderStatus.Cancelled);
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount.div(2),
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should log 1 event with correct arguments', async () => {
            const res = await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<ExchangeCancelEventArgs>;
            const logArgs = log.args;

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(signedOrder.makerAddress).to.be.equal(logArgs.senderAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerAssetData).to.be.equal(logArgs.makerAssetData);
            expect(signedOrder.takerAssetData).to.be.equal(logArgs.takerAssetData);
            expect(orderHashUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should revert if already cancelled', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHash, OrderStatus.Cancelled);
            const tx = exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if order is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            signedOrder = await orderFactory.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHash, OrderStatus.Expired);
            const tx = exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if rounding error is greater than 0.1%', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1001),
                takerAssetAmount: new BigNumber(3),
            });

            const fillTakerAssetAmount1 = new BigNumber(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: fillTakerAssetAmount1,
            });

            const fillTakerAssetAmount2 = new BigNumber(1);
            const expectedError = new LibMathRevertErrors.RoundingError(
                fillTakerAssetAmount2,
                new BigNumber(3),
                new BigNumber(1001),
            );
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: fillTakerAssetAmount2,
            });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('cancelOrdersUpTo', () => {
        it('should fail to set orderEpoch less than current orderEpoch', async () => {
            const orderEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);
            const lesserOrderEpoch = new BigNumber(0);
            const expectedError = new ExchangeRevertErrors.OrderEpochError(
                makerAddress,
                constants.NULL_ADDRESS,
                orderEpoch.plus(1),
            );
            const tx = exchangeWrapper.cancelOrdersUpToAsync(lesserOrderEpoch, makerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should fail to set orderEpoch equal to existing orderEpoch', async () => {
            const orderEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);
            const expectedError = new ExchangeRevertErrors.OrderEpochError(
                makerAddress,
                constants.NULL_ADDRESS,
                orderEpoch.plus(1),
            );
            const tx = exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should cancel only orders with a orderEpoch less than existing orderEpoch', async () => {
            // Cancel all transactions with a orderEpoch less than 1
            const orderEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);

            // Create 3 orders with orderEpoch values: 0,1,2,3
            // Since we cancelled with orderEpoch=1, orders with orderEpoch<=1 will not be processed
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            const signedOrders = [
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(9), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(9), 18),
                    salt: new BigNumber(0),
                }),
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(79), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(79), 18),
                    salt: new BigNumber(1),
                }),
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(979), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(979), 18),
                    salt: new BigNumber(2),
                }),
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(7979), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(7979), 18),
                    salt: new BigNumber(3),
                }),
            ];
            await exchangeWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                // HACK(albrow): We need to hardcode the gas estimate here because
                // the Geth gas estimator doesn't work with the way we use
                // delegatecall and swallow errors.
                gas: 600000,
            });

            const newBalances = await erc20Wrapper.getBalancesAsync();
            const fillMakerAssetAmount = signedOrders[2].makerAssetAmount.plus(signedOrders[3].makerAssetAmount);
            const fillTakerAssetAmount = signedOrders[2].takerAssetAmount.plus(signedOrders[3].takerAssetAmount);
            const makerFee = signedOrders[2].makerFee.plus(signedOrders[3].makerFee);
            const takerFee = signedOrders[2].takerFee.plus(signedOrders[3].takerFee);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(fillMakerAssetAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].plus(fillTakerAssetAmount),
            );
            expect(newBalances[makerAddress][feeToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][feeToken.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(fillTakerAssetAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(fillMakerAssetAmount),
            );
            expect(newBalances[takerAddress][feeToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][feeToken.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][feeToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][feeToken.address].plus(makerFee.plus(takerFee)),
            );
        });
    });

    describe('Testing Exchange of ERC721 Tokens', () => {
        it('should revert when maker does not own the token with id makerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721TakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[1];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.not.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                signedOrder.makerAssetData,
                new StringRevertError(RevertReason.TransferFailed).encode(),
            );
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when taker does not own the token with id takerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721MakerAssetIds[1];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.not.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                signedOrder.takerAssetData,
                new StringRevertError(RevertReason.TransferFailed).encode(),
            );
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when makerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(2),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                signedOrder.makerAssetData,
                new StringRevertError(RevertReason.InvalidAmount).encode(),
            );
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when takerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(500),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                signedOrder.takerAssetData,
                new StringRevertError(RevertReason.InvalidAmount).encode(),
            );
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert on partial fill', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            });
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            const expectedError = new LibMathRevertErrors.RoundingError(
                takerAssetFillAmount,
                signedOrder.takerAssetAmount,
                signedOrder.makerAssetAmount,
            );
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('Testing exchange of multiple assets', () => {
        it('should allow multiple assets to be exchanged for a single asset', async () => {
            const makerAmounts = [new BigNumber(10), new BigNumber(20)];
            const makerNestedAssetData = [
                assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
                assetDataUtils.encodeERC20AssetData(erc20TokenB.address),
            ];
            const makerAssetData = assetDataUtils.encodeMultiAssetData(makerAmounts, makerNestedAssetData);
            const makerAssetAmount = new BigNumber(1);
            const takerAssetData = assetDataUtils.encodeERC20AssetData(feeToken.address);
            const takerAssetAmount = new BigNumber(10);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });

            const initialMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);

            expect(finalMakerBalanceA).to.be.bignumber.equal(
                initialMakerBalanceA.minus(makerAmounts[0].times(makerAssetAmount)),
            );
            expect(finalMakerBalanceB).to.be.bignumber.equal(
                initialMakerBalanceB.minus(makerAmounts[1].times(makerAssetAmount)),
            );
            expect(finalMakerFeeTokenBalance).to.be.bignumber.equal(initialMakerFeeTokenBalance.plus(takerAssetAmount));
            expect(finalTakerBalanceA).to.be.bignumber.equal(
                initialTakerBalanceA.plus(makerAmounts[0].times(makerAssetAmount)),
            );
            expect(finalTakerBalanceB).to.be.bignumber.equal(
                initialTakerBalanceB.plus(makerAmounts[1].times(makerAssetAmount)),
            );
            expect(finalTakerFeeTokenBalance).to.be.bignumber.equal(
                initialTakerFeeTokenBalance.minus(takerAssetAmount),
            );
        });
        it('should allow multiple assets to be exchanged for multiple assets', async () => {
            const makerAmounts = [new BigNumber(10), new BigNumber(20)];
            const makerNestedAssetData = [
                assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
                assetDataUtils.encodeERC20AssetData(erc20TokenB.address),
            ];
            const makerAssetData = assetDataUtils.encodeMultiAssetData(makerAmounts, makerNestedAssetData);
            const makerAssetAmount = new BigNumber(1);
            const takerAmounts = [new BigNumber(10), new BigNumber(1)];
            const takerAssetId = erc721TakerAssetIds[0];
            const takerNestedAssetData = [
                assetDataUtils.encodeERC20AssetData(feeToken.address),
                assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            ];
            const takerAssetData = assetDataUtils.encodeMultiAssetData(takerAmounts, takerNestedAssetData);
            const takerAssetAmount = new BigNumber(1);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });

            const initialMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const finalOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);

            expect(finalMakerBalanceA).to.be.bignumber.equal(
                initialMakerBalanceA.minus(makerAmounts[0].times(makerAssetAmount)),
            );
            expect(finalMakerBalanceB).to.be.bignumber.equal(
                initialMakerBalanceB.minus(makerAmounts[1].times(makerAssetAmount)),
            );
            expect(finalMakerFeeTokenBalance).to.be.bignumber.equal(
                initialMakerFeeTokenBalance.plus(takerAmounts[0].times(takerAssetAmount)),
            );
            expect(finalTakerBalanceA).to.be.bignumber.equal(
                initialTakerBalanceA.plus(makerAmounts[0].times(makerAssetAmount)),
            );
            expect(finalTakerBalanceB).to.be.bignumber.equal(
                initialTakerBalanceB.plus(makerAmounts[1].times(makerAssetAmount)),
            );
            expect(finalTakerFeeTokenBalance).to.be.bignumber.equal(
                initialTakerFeeTokenBalance.minus(takerAmounts[0].times(takerAssetAmount)),
            );
            expect(finalOwnerTakerAsset).to.be.equal(makerAddress);
        });
        it('should allow an order selling multiple assets to be partially filled', async () => {
            const makerAmounts = [new BigNumber(10), new BigNumber(20)];
            const makerNestedAssetData = [
                assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
                assetDataUtils.encodeERC20AssetData(erc20TokenB.address),
            ];
            const makerAssetData = assetDataUtils.encodeMultiAssetData(makerAmounts, makerNestedAssetData);
            const makerAssetAmount = new BigNumber(30);
            const takerAssetData = assetDataUtils.encodeERC20AssetData(feeToken.address);
            const takerAssetAmount = new BigNumber(10);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });

            const initialMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);

            const takerAssetFillAmount = takerAssetAmount.dividedToIntegerBy(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });

            const finalMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);

            expect(finalMakerBalanceA).to.be.bignumber.equal(
                initialMakerBalanceA.minus(
                    makerAmounts[0].times(
                        makerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                    ),
                ),
            );
            expect(finalMakerBalanceB).to.be.bignumber.equal(
                initialMakerBalanceB.minus(
                    makerAmounts[1].times(
                        makerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                    ),
                ),
            );
            expect(finalMakerFeeTokenBalance).to.be.bignumber.equal(
                initialMakerFeeTokenBalance.plus(
                    takerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                ),
            );
            expect(finalTakerBalanceA).to.be.bignumber.equal(
                initialTakerBalanceA.plus(
                    makerAmounts[0].times(
                        makerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                    ),
                ),
            );
            expect(finalTakerBalanceB).to.be.bignumber.equal(
                initialTakerBalanceB.plus(
                    makerAmounts[1].times(
                        makerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                    ),
                ),
            );
            expect(finalTakerFeeTokenBalance).to.be.bignumber.equal(
                initialTakerFeeTokenBalance.minus(
                    takerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                ),
            );
        });
        it('should allow an order buying multiple assets to be partially filled', async () => {
            const takerAmounts = [new BigNumber(10), new BigNumber(20)];
            const takerNestedAssetData = [
                assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
                assetDataUtils.encodeERC20AssetData(erc20TokenB.address),
            ];
            const takerAssetData = assetDataUtils.encodeMultiAssetData(takerAmounts, takerNestedAssetData);
            const takerAssetAmount = new BigNumber(30);
            const makerAssetData = assetDataUtils.encodeERC20AssetData(feeToken.address);
            const makerAssetAmount = new BigNumber(10);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });

            const initialMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);

            const takerAssetFillAmount = takerAssetAmount.dividedToIntegerBy(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });

            const finalMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);

            expect(finalMakerBalanceA).to.be.bignumber.equal(
                initialMakerBalanceA.plus(
                    takerAmounts[0].times(
                        takerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                    ),
                ),
            );
            expect(finalMakerBalanceB).to.be.bignumber.equal(
                initialMakerBalanceB.plus(
                    takerAmounts[1].times(
                        takerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                    ),
                ),
            );
            expect(finalMakerFeeTokenBalance).to.be.bignumber.equal(
                initialMakerFeeTokenBalance.minus(
                    makerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                ),
            );
            expect(finalTakerBalanceA).to.be.bignumber.equal(
                initialTakerBalanceA.minus(
                    takerAmounts[0].times(
                        takerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                    ),
                ),
            );
            expect(finalTakerBalanceB).to.be.bignumber.equal(
                initialTakerBalanceB.minus(
                    takerAmounts[1].times(
                        takerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                    ),
                ),
            );
            expect(finalTakerFeeTokenBalance).to.be.bignumber.equal(
                initialTakerFeeTokenBalance.plus(
                    makerAssetAmount.times(takerAssetFillAmount).dividedToIntegerBy(takerAssetAmount),
                ),
            );
        });
    });
    describe('Testing exchange of erc1155 assets', () => {
        it('should allow a single fungible erc1155 asset to be exchanged for another', async () => {
            // setup test parameters
            const tokenHolders = [makerAddress, takerAddress];
            const makerAssetsToTransfer = erc1155FungibleTokens.slice(0, 1);
            const takerAssetsToTransfer = erc1155FungibleTokens.slice(1, 2);
            const makerValuesToTransfer = [new BigNumber(500)];
            const takerValuesToTransfer = [new BigNumber(200)];
            const tokensToTransfer = makerAssetsToTransfer.concat(takerAssetsToTransfer);
            const makerAssetAmount = new BigNumber(1);
            const takerAssetAmount = new BigNumber(1);
            const totalMakerValuesTransferred = _.map(makerValuesToTransfer, (value: BigNumber) => {
                return value.times(makerAssetAmount);
            });
            const totalTakerValuesTransferred = _.map(takerValuesToTransfer, (value: BigNumber) => {
                return value.times(takerAssetAmount);
            });
            const receiverCallbackData = '0x';
            const makerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFillAmount = new BigNumber(1);
            // check balances before transfer
            const expectedInitialBalances = [
                // makerAddress / makerToken
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // makerAddress / takerToken
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / makerToken
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / takerToken
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
            // check balances after transfer
            const expectedFinalBalances = [
                // makerAddress / makerToken
                expectedInitialBalances[0].minus(totalMakerValuesTransferred[0]),
                // makerAddress / takerToken
                expectedInitialBalances[1].plus(totalTakerValuesTransferred[0]),
                // takerAddress / makerToken
                expectedInitialBalances[2].plus(totalMakerValuesTransferred[0]),
                // takerAddress / takerToken
                expectedInitialBalances[3].minus(totalTakerValuesTransferred[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should allow a single non-fungible erc1155 asset to be exchanged for another', async () => {
            // setup test parameters
            const tokenHolders = [makerAddress, takerAddress];
            const makerAssetsToTransfer = erc1155NonFungibleTokensOwnedByMaker.slice(0, 1);
            const takerAssetsToTransfer = erc1155NonFungibleTokensOwnedByTaker.slice(0, 1);
            const makerValuesToTransfer = [new BigNumber(1)];
            const takerValuesToTransfer = [new BigNumber(1)];
            const tokensToTransfer = makerAssetsToTransfer.concat(takerAssetsToTransfer);
            const makerAssetAmount = new BigNumber(1);
            const takerAssetAmount = new BigNumber(1);
            const totalMakerValuesTransferred = _.map(makerValuesToTransfer, (value: BigNumber) => {
                return value.times(makerAssetAmount);
            });
            const totalTakerValuesTransferred = _.map(takerValuesToTransfer, (value: BigNumber) => {
                return value.times(takerAssetAmount);
            });
            const receiverCallbackData = '0x';
            const makerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFillAmount = new BigNumber(1);
            // check balances before transfer
            const nftOwnerBalance = new BigNumber(1);
            const nftNotOwnerBalance = new BigNumber(0);
            const expectedInitialBalances = [
                // makerAddress / makerToken
                nftOwnerBalance,
                // makerAddress / takerToken
                nftNotOwnerBalance,
                // takerAddress / makerToken
                nftNotOwnerBalance,
                // takerAddress / takerToken
                nftOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
            // check balances after transfer
            const expectedFinalBalances = [
                // makerAddress / makerToken
                expectedInitialBalances[0].minus(totalMakerValuesTransferred[0]),
                // makerAddress / takerToken
                expectedInitialBalances[1].plus(totalTakerValuesTransferred[0]),
                // takerAddress / makerToken
                expectedInitialBalances[2].plus(totalMakerValuesTransferred[0]),
                // takerAddress / takerToken
                expectedInitialBalances[3].minus(totalTakerValuesTransferred[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should allow multiple erc1155 assets to be exchanged for a single asset', async () => {
            // setup test parameters
            const tokenHolders = [makerAddress, takerAddress];
            const makerAssetsToTransfer = erc1155FungibleTokens.slice(0, 3);
            const takerAssetsToTransfer = erc1155NonFungibleTokensOwnedByTaker.slice(0, 1);
            const makerValuesToTransfer = [new BigNumber(500), new BigNumber(700), new BigNumber(900)];
            const takerValuesToTransfer = [new BigNumber(1)];
            const tokensToTransfer = makerAssetsToTransfer.concat(takerAssetsToTransfer);
            const makerAssetAmount = new BigNumber(1);
            const takerAssetAmount = new BigNumber(1);
            const totalMakerValuesTransferred = _.map(makerValuesToTransfer, (value: BigNumber) => {
                return value.times(makerAssetAmount);
            });
            const totalTakerValuesTransferred = _.map(takerValuesToTransfer, (value: BigNumber) => {
                return value.times(takerAssetAmount);
            });
            const receiverCallbackData = '0x';
            const makerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFillAmount = new BigNumber(1);
            // check balances before transfer
            const nftOwnerBalance = new BigNumber(1);
            const nftNotOwnerBalance = new BigNumber(0);
            const expectedInitialBalances = [
                // makerAddress / makerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // makerAddress / makerToken[1]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // makerAddress / makerToken[2]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // makerAddress / takerToken
                nftNotOwnerBalance,
                // takerAddress / makerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / makerToken[1]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / makerToken[2]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / takerToken
                nftOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
            // check balances after transfer
            const expectedFinalBalances = [
                // makerAddress / makerToken[0]
                expectedInitialBalances[0].minus(totalMakerValuesTransferred[0]),
                // makerAddress / makerToken[1]
                expectedInitialBalances[1].minus(totalMakerValuesTransferred[1]),
                // makerAddress / makerToken[2]
                expectedInitialBalances[2].minus(totalMakerValuesTransferred[2]),
                // makerAddress / takerToken
                expectedInitialBalances[3].plus(totalTakerValuesTransferred[0]),
                // takerAddress / makerToken[0]
                expectedInitialBalances[4].plus(totalMakerValuesTransferred[0]),
                // takerAddress / makerToken[1]
                expectedInitialBalances[5].plus(totalMakerValuesTransferred[1]),
                // takerAddress / makerToken[2]
                expectedInitialBalances[6].plus(totalMakerValuesTransferred[2]),
                // takerAddress / takerToken
                expectedInitialBalances[7].minus(totalTakerValuesTransferred[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should allow multiple erc1155 assets to be exchanged for multiple erc1155 assets, mixed fungible/non-fungible', async () => {
            // setup test parameters
            // the maker is trading two fungibles & one non-fungible
            // the taker is trading one fungible & two non-fungibles
            const tokenHolders = [makerAddress, takerAddress];
            const makerFungibleAssetsToTransfer = erc1155FungibleTokens.slice(0, 2);
            const makerNonFungibleAssetsToTransfer = erc1155NonFungibleTokensOwnedByMaker.slice(0, 1);
            const makerAssetsToTransfer = makerFungibleAssetsToTransfer.concat(makerNonFungibleAssetsToTransfer);
            const takerFungibleAssetsToTransfer = erc1155FungibleTokens.slice(2, 3);
            const takerNonFungibleAssetsToTransfer = erc1155NonFungibleTokensOwnedByTaker.slice(0, 2);
            const takerAssetsToTransfer = takerFungibleAssetsToTransfer.concat(takerNonFungibleAssetsToTransfer);
            const makerValuesToTransfer = [new BigNumber(500), new BigNumber(700), new BigNumber(1)];
            const takerValuesToTransfer = [new BigNumber(900), new BigNumber(1), new BigNumber(1)];
            const tokensToTransfer = makerAssetsToTransfer.concat(takerAssetsToTransfer);
            const makerAssetAmount = new BigNumber(1);
            const takerAssetAmount = new BigNumber(1);
            const totalMakerValuesTransferred = _.map(makerValuesToTransfer, (value: BigNumber) => {
                return value.times(makerAssetAmount);
            });
            const totalTakerValuesTransferred = _.map(takerValuesToTransfer, (value: BigNumber) => {
                return value.times(takerAssetAmount);
            });
            const receiverCallbackData = '0x';
            const makerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFillAmount = new BigNumber(1);
            // check balances before transfer
            const nftOwnerBalance = new BigNumber(1);
            const nftNotOwnerBalance = new BigNumber(0);
            const expectedInitialBalances = [
                // makerAddress / makerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // makerAddress / makerToken[1]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // makerAddress / makerToken[2]
                nftOwnerBalance,
                // makerAddress / takerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // makerAddress / takerToken[1]
                nftNotOwnerBalance,
                // makerAddress / takerToken[2]
                nftNotOwnerBalance,
                // takerAddress / makerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / makerToken[1]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / makerToken[2]
                nftNotOwnerBalance,
                // takerAddress / takerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / takerToken[1]
                nftOwnerBalance,
                // takerAddress / takerToken[2]
                nftOwnerBalance,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
            // check balances after transfer
            const expectedFinalBalances = [
                // makerAddress / makerToken[0]
                expectedInitialBalances[0].minus(totalMakerValuesTransferred[0]),
                // makerAddress / makerToken[1]
                expectedInitialBalances[1].minus(totalMakerValuesTransferred[1]),
                // makerAddress / makerToken[2]
                expectedInitialBalances[2].minus(totalMakerValuesTransferred[2]),
                // makerAddress / takerToken[0]
                expectedInitialBalances[3].plus(totalTakerValuesTransferred[0]),
                // makerAddress / takerToken[1]
                expectedInitialBalances[4].plus(totalTakerValuesTransferred[1]),
                // makerAddress / takerToken[2]
                expectedInitialBalances[5].plus(totalTakerValuesTransferred[2]),
                // takerAddress / makerToken[0]
                expectedInitialBalances[6].plus(totalMakerValuesTransferred[0]),
                // takerAddress / makerToken[1]
                expectedInitialBalances[7].plus(totalMakerValuesTransferred[1]),
                // takerAddress / makerToken[2]
                expectedInitialBalances[8].plus(totalMakerValuesTransferred[2]),
                // takerAddress / takerToken[0]
                expectedInitialBalances[9].minus(totalTakerValuesTransferred[0]),
                // takerAddress / takerToken[1]
                expectedInitialBalances[10].minus(totalTakerValuesTransferred[1]),
                // takerAddress / takerToken[2]
                expectedInitialBalances[11].minus(totalTakerValuesTransferred[2]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
        });
        it('should allow an order exchanging erc1155 assets to be partially filled', async () => {
            // NOTICE:
            // As-per the eip1155 standard, there is no way to distinguish between a fungible or non-fungible erc1155 assets.
            // Hence we cannot force partial fills to fail if there is a non-fungible asset (which should be fill or kill).
            // We considered encoding whether an asset is fungible/non-fungible in erc1155 assetData, but
            // this is no more robust than a simple check by the client. Enforcing this at the smart contract level
            // is something that could be done with the upcoming static call proxy.
            //
            // setup test parameters
            // the maker is trading two fungibles and the taker is trading one fungible
            // note that this will result in a partial fill because the `takerAssetAmount`
            // less than the `takerAssetAmount` of the order.
            const takerAssetFillAmount = new BigNumber(6);
            const tokenHolders = [makerAddress, takerAddress];
            const makerAssetsToTransfer = erc1155FungibleTokens.slice(0, 2);
            const takerAssetsToTransfer = erc1155FungibleTokens.slice(2, 3);
            const makerValuesToTransfer = [new BigNumber(500), new BigNumber(700)];
            const takerValuesToTransfer = [new BigNumber(900)];
            const tokensToTransfer = makerAssetsToTransfer.concat(takerAssetsToTransfer);
            const makerAssetAmount = new BigNumber(10);
            const takerAssetAmount = new BigNumber(20);
            const totalMakerValuesTransferred = _.map(makerValuesToTransfer, (value: BigNumber) => {
                return value
                    .times(makerAssetAmount)
                    .times(takerAssetFillAmount)
                    .dividedToIntegerBy(takerAssetAmount);
            });
            const totalTakerValuesTransferred = _.map(takerValuesToTransfer, (value: BigNumber) => {
                return value
                    .times(takerAssetAmount)
                    .times(takerAssetFillAmount)
                    .dividedToIntegerBy(takerAssetAmount);
            });
            const receiverCallbackData = '0x';
            const makerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            // check balances before transfer
            const expectedInitialBalances = [
                // makerAddress / makerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // makerAddress / makerToken[1]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // makerAddress / takerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / makerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / makerToken[1]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                // takerAddress / takerToken[0]
                constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
            // execute transfer
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
            // check balances after transfer
            const expectedFinalBalances = [
                // makerAddress / makerToken[0]
                expectedInitialBalances[0].minus(totalMakerValuesTransferred[0]),
                // makerAddress / makerToken[1]
                expectedInitialBalances[1].minus(totalMakerValuesTransferred[1]),
                // makerAddress / takerToken[0]
                expectedInitialBalances[2].plus(totalTakerValuesTransferred[0]),
                // takerAddress / makerToken[0]
                expectedInitialBalances[3].plus(totalMakerValuesTransferred[0]),
                // takerAddress / makerToken[1]
                expectedInitialBalances[4].plus(totalMakerValuesTransferred[1]),
                // takerAddress / takerToken[0]
                expectedInitialBalances[5].minus(totalTakerValuesTransferred[0]),
            ];
            await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
            // check that the order is partially filled
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = takerAssetFillAmount;
            const expectedOrderStatus = OrderStatus.Fillable;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
    });

    describe('Testing orders that utilize StaticCallProxy', () => {
        before(async () => {
            staticCallTarget = await TestStaticCallTargetContract.deployFrom0xArtifactAsync(
                proxyArtifacts.TestStaticCallTarget,
                provider,
                txDefaults,
            );
        });
        it('should revert if the staticcall is unsuccessful', async () => {
            const staticCallData = staticCallTarget.assertEvenNumber.getABIEncodedTransactionData(new BigNumber(1));
            const assetData = assetDataUtils.encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                constants.KECCAK256_NULL,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: assetData });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                assetData,
                new StringRevertError(RevertReason.TargetNotEven).encode(),
            );
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            return expect(tx).to.revertWith(expectedError);
        });
        it('should fill the order if the staticcall is successful', async () => {
            const staticCallData = staticCallTarget.assertEvenNumber.getABIEncodedTransactionData(
                constants.ZERO_AMOUNT,
            );
            const assetData = assetDataUtils.encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                constants.KECCAK256_NULL,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: assetData });

            const initialMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const initialTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const initialFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const finalTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const finalFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);

            expect(finalMakerFeeTokenBalance).to.bignumber.equal(
                initialMakerFeeTokenBalance.minus(signedOrder.makerFee),
            );
            expect(finalTakerFeeTokenBalance).to.bignumber.equal(
                initialTakerFeeTokenBalance.minus(signedOrder.takerFee),
            );
            expect(finalFeeRecipientFeeTokenBalance).to.bignumber.equal(
                initialFeeRecipientFeeTokenBalance.plus(signedOrder.makerFee).plus(signedOrder.takerFee),
            );
            expect(finalMakerBalanceB).to.bignumber.equal(initialMakerBalanceB.plus(signedOrder.takerAssetAmount));
            expect(finalTakerBalanceB).to.bignumber.equal(initialTakerBalanceB.minus(signedOrder.takerAssetAmount));
        });
        it('should revert if the staticcall is unsuccessful using the MultiAssetProxy', async () => {
            const staticCallData = staticCallTarget.assertEvenNumber.getABIEncodedTransactionData(new BigNumber(1));
            const staticCallAssetData = assetDataUtils.encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                constants.KECCAK256_NULL,
            );
            const assetData = assetDataUtils.encodeMultiAssetData(
                [new BigNumber(1), new BigNumber(1)],
                [assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress), staticCallAssetData],
            );
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: assetData });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                assetData,
                new StringRevertError(RevertReason.TargetNotEven).encode(),
            );
            const tx = exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            return expect(tx).to.revertWith(expectedError);
        });
        it('should fill the order is the staticcall is successful using the MultiAssetProxy', async () => {
            const staticCallData = staticCallTarget.assertEvenNumber.getABIEncodedTransactionData(
                constants.ZERO_AMOUNT,
            );
            const staticCallAssetData = assetDataUtils.encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                constants.KECCAK256_NULL,
            );
            const assetData = assetDataUtils.encodeMultiAssetData(
                [new BigNumber(1), new BigNumber(1)],
                [assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress), staticCallAssetData],
            );
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: assetData });

            const initialMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const initialTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const initialFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);
            const initialMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerFeeTokenBalance = await feeToken.balanceOf.callAsync(makerAddress);
            const finalTakerFeeTokenBalance = await feeToken.balanceOf.callAsync(takerAddress);
            const finalFeeRecipientFeeTokenBalance = await feeToken.balanceOf.callAsync(feeRecipientAddress);
            const finalMakerBalanceA = await erc20TokenA.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await erc20TokenA.balanceOf.callAsync(takerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);

            expect(finalMakerFeeTokenBalance).to.bignumber.equal(
                initialMakerFeeTokenBalance.minus(signedOrder.makerFee),
            );
            expect(finalTakerFeeTokenBalance).to.bignumber.equal(
                initialTakerFeeTokenBalance.minus(signedOrder.takerFee),
            );
            expect(finalFeeRecipientFeeTokenBalance).to.bignumber.equal(
                initialFeeRecipientFeeTokenBalance.plus(signedOrder.makerFee).plus(signedOrder.takerFee),
            );
            expect(finalMakerBalanceA).to.bignumber.equal(initialMakerBalanceA.minus(signedOrder.makerAssetAmount));
            expect(finalTakerBalanceA).to.bignumber.equal(initialTakerBalanceA.plus(signedOrder.makerAssetAmount));
            expect(finalMakerBalanceB).to.bignumber.equal(initialMakerBalanceB.plus(signedOrder.takerAssetAmount));
            expect(finalTakerBalanceB).to.bignumber.equal(initialTakerBalanceB.minus(signedOrder.takerAssetAmount));
        });
    });

    describe('getOrderInfo', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should return the correct orderInfo for an unfilled valid order', async () => {
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.Fillable;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a fully filled order', async () => {
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = signedOrder.takerAssetAmount;
            const expectedOrderStatus = OrderStatus.FullyFilled;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a partially filled order', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = takerAssetFillAmount;
            const expectedOrderStatus = OrderStatus.Fillable;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a cancelled and unfilled order', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.Cancelled;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a cancelled and partially filled order', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = takerAssetFillAmount;
            const expectedOrderStatus = OrderStatus.Cancelled;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an expired and unfilled order', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const timeUntilExpiration = signedOrder.expirationTimeSeconds.minus(currentTimestamp).toNumber();
            await increaseTimeAndMineBlockAsync(timeUntilExpiration);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.Expired;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an expired and partially filled order', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const timeUntilExpiration = signedOrder.expirationTimeSeconds.minus(currentTimestamp).toNumber();
            await increaseTimeAndMineBlockAsync(timeUntilExpiration);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = takerAssetFillAmount;
            const expectedOrderStatus = OrderStatus.Expired;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an expired and fully filled order', async () => {
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const timeUntilExpiration = signedOrder.expirationTimeSeconds.minus(currentTimestamp).toNumber();
            await increaseTimeAndMineBlockAsync(timeUntilExpiration);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = signedOrder.takerAssetAmount;
            // FULLY_FILLED takes precedence over EXPIRED
            const expectedOrderStatus = OrderStatus.FullyFilled;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an order with a makerAssetAmount of 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetAmount: new BigNumber(0) });
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.InvalidMakerAssetAmount;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an order with a takerAssetAmount of 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({ takerAssetAmount: new BigNumber(0) });
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.InvalidTakerAssetAmount;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
