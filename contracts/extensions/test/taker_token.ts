import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { artifacts as erc1155Artifacts, IERC1155Contract } from '@0x/contracts-erc1155';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { ExchangeContract, ExchangeWrapper } from '@0x/contracts-exchange';
import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, signatureUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';

import { artifacts, NotCoinContract, TakerTokenContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TakerToken', async () => {
    let takerTokenContract: TakerTokenContract;

    let erc1155Interface: IERC1155Contract;

    let exchangeContract: ExchangeContract;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Proxy: ERC20ProxyContract;
    let erc20Wrapper: ERC20Wrapper;
    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let notCoin: NotCoinContract;

    let ownerAddress: string;
    let makerAddress: string;
    let takerAddress: string;
    let otherAddress: string;

    let orderToTokenize: Order;
    let goodFaithDeposit: Order;

    before(async () => {
        await blockchainLifecycle.startAsync();

        const usedAddresses = ([
            ownerAddress,
            makerAddress,
            takerAddress,
            otherAddress,
        ] = await web3Wrapper.getAvailableAddressesAsync());
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, ownerAddress);

        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        exchangeContract = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            assetDataUtils.encodeERC20AssetData(zrxToken.address),
        );
        exchangeWrapper = new ExchangeWrapper(exchangeContract, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, ownerAddress);

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeContract.address, {
                from: ownerAddress,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        takerTokenContract = await TakerTokenContract.deployFrom0xArtifactAsync(
            artifacts.TakerToken,
            provider,
            txDefaults,
            exchangeContract.address,
        );

        erc1155Interface = new IERC1155Contract(
            erc1155Artifacts.IERC1155.compilerOutput.abi,
            takerTokenContract.address,
            provider,
        );

        notCoin = await NotCoinContract.deployFrom0xArtifactAsync(
            artifacts.NotCoin,
            provider,
            txDefaults,
            'NotCoin', // name
            'NOT', // symbol
            18, // decimals
        );

        orderToTokenize = {
            makerAddress,
            takerAddress: takerTokenContract.address,
            feeRecipientAddress: '0x0000000000000000000000000000000000000000',
            senderAddress: takerTokenContract.address,
            makerAssetAmount: new BigNumber('100000000000000000000'),
            takerAssetAmount: new BigNumber('200000000000000000000'),
            makerFee: new BigNumber('0'),
            takerFee: new BigNumber('0'),
            expirationTimeSeconds: new BigNumber('1904861753'),
            salt: new BigNumber('66097384406870180066678463045003379626790660770396923976862707230261946348951'),
            makerAssetData: assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
            takerAssetData: assetDataUtils.encodeERC20AssetData(erc20TokenB.address),
            exchangeAddress: exchangeContract.address,
        };

        goodFaithDeposit = {
            makerAddress,
            takerAddress: takerTokenContract.address,
            feeRecipientAddress: '0x0000000000000000000000000000000000000000',
            senderAddress: takerTokenContract.address,
            makerAssetAmount: orderToTokenize.makerAssetAmount.dividedBy(10),
            takerAssetAmount: new BigNumber('1'),
            makerFee: new BigNumber('0'),
            takerFee: new BigNumber('0'),
            expirationTimeSeconds: new BigNumber('1904861753'),
            salt: orderToTokenize.salt.plus(1),
            makerAssetData: assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
            takerAssetData: assetDataUtils.encodeERC20AssetData(notCoin.address),
            exchangeAddress: exchangeContract.address,
        };

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20TokenB.approve.sendTransactionAsync(erc20Proxy.address, constants.INITIAL_ERC20_ALLOWANCE, {
                from: makerAddress,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20TokenB.approve.sendTransactionAsync(erc20Proxy.address, constants.INITIAL_ERC20_ALLOWANCE, {
                from: takerAddress,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });

    it('should generate a token type ID from a TokenType structure', async () => {
        expect(
            await takerTokenContract.getTokenTypeIdFromTokenType.callAsync({
                makerAssetDataHash: new BigNumber('0x326d'),
                takerAssetDataHash: new BigNumber('0xc011'),
                exchangeRate: new BigNumber('0x000002'),
                collateralizationLevel: new BigNumber('0x14'),
            }),
        ).to.bignumber.equal('0x326dc01100000214');
    });

    it('should generate a token type ID from a token ID hex value', async () => {
        expect(
            await takerTokenContract.getTokenTypeIdFromTokenId.callAsync(
                new BigNumber('0x326dc01100000214000000000000000000000000000000000000000000000000'),
            ),
        ).to.bignumber.equal('0x326dc01100000214');
    });

    it('should generate a token ID from a TokenType struct and an order to wrap', async () => {
        expect(
            await takerTokenContract.getTokenIdFromTypeAndOrder.callAsync(
                {
                    makerAssetDataHash: 12909,
                    takerAssetDataHash: 49169,
                    exchangeRate: new BigNumber(2),
                    collateralizationLevel: 20,
                },
                orderToTokenize,
            ),
        ).to.bignumber.equal('0x326dc01100000214d43b4752c1142fc38d3880920a2d07d78114b6766304a841');
    });

    it('should grant a maker the token they minted', async () => {
        await web3Wrapper.awaitTransactionSuccessAsync(
            await takerTokenContract.mint.sendTransactionAsync(
                orderToTokenize,
                goodFaithDeposit,
                (await signatureUtils.ecSignOrderAsync(provider, orderToTokenize, makerAddress)).signature,
                (await signatureUtils.ecSignOrderAsync(provider, goodFaithDeposit, makerAddress)).signature,
                { from: makerAddress },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        const tokenId: BigNumber = await takerTokenContract.makeTokenId.callAsync(orderToTokenize, goodFaithDeposit);

        expect(await erc1155Interface.balanceOf.callAsync(makerAddress, tokenId)).to.bignumber.equal(
            orderToTokenize.makerAssetAmount,
        );

        expect(
            await takerTokenContract.getHoldings.callAsync(
                makerAddress,
                await takerTokenContract.getTokenTypeIdFromTokenId.callAsync(tokenId),
            ),
        ).to.deep.equal([tokenId]);
    });

    it('should disallow a second minting of the same order', async () => {
        expect(
            takerTokenContract.mint.sendTransactionAsync(
                orderToTokenize,
                goodFaithDeposit,
                (await signatureUtils.ecSignOrderAsync(provider, orderToTokenize, makerAddress)).signature,
                (await signatureUtils.ecSignOrderAsync(provider, goodFaithDeposit, makerAddress)).signature,
                { from: makerAddress },
            ),
        ).to.be.rejectedWith(Error, 'ORDER_ALREADY_TOKENIZED');
    });

    it('should allow a maker-minter to transfer the taker token they minted', async () => {
        const tokenId: BigNumber = await takerTokenContract.makeTokenId.callAsync(orderToTokenize, goodFaithDeposit);

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc1155Interface.safeTransferFrom.sendTransactionAsync(
                makerAddress,
                takerAddress,
                tokenId,
                orderToTokenize.makerAssetAmount,
                '0x00',
                { from: makerAddress },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        expect(await erc1155Interface.balanceOf.callAsync(makerAddress, tokenId)).to.bignumber.equal(
            0,
            "maker shouldn't have any token balance left after transferring it away",
        );

        expect(
            await takerTokenContract.getHoldings.callAsync(
                makerAddress,
                await takerTokenContract.getTokenTypeIdFromTokenId.callAsync(tokenId),
            ),
        ).to.deep.equal([], "maker shouldn't be holding the token anymore");

        expect(await erc1155Interface.balanceOf.callAsync(takerAddress, tokenId)).to.bignumber.equal(
            orderToTokenize.makerAssetAmount,
            'new holder should have been credited the token value',
        );

        expect(
            await takerTokenContract.getHoldings.callAsync(
                takerAddress,
                await takerTokenContract.getTokenTypeIdFromTokenId.callAsync(tokenId),
            ),
        ).to.deep.equal([tokenId], 'taker should be holding the token now');
    });

    it('should allow the token holder to fill the underlying order', async () => {
        const takersOldMakerTokenBalance: BigNumber = await erc20TokenA.balanceOf.callAsync(takerAddress);
        const makersOldMakerTokenBalance: BigNumber = await erc20TokenA.balanceOf.callAsync(makerAddress);

        const tokenId: BigNumber = await takerTokenContract.makeTokenId.callAsync(orderToTokenize, goodFaithDeposit);
        const settlementOrder: Order = {
            ...(await takerTokenContract.makeSettlementOrder.callAsync(tokenId, {
                from: takerAddress,
            })),
            exchangeAddress: exchangeContract.address,
        };

        await web3Wrapper.awaitTransactionSuccessAsync(
            await takerTokenContract.fill.sendTransactionAsync(
                tokenId,
                (await signatureUtils.ecSignOrderAsync(provider, settlementOrder, takerAddress)).signature,
                { from: takerAddress },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        expect(
            await takerTokenContract.getHoldings.callAsync(
                takerAddress,
                await takerTokenContract.getTokenTypeIdFromTokenId.callAsync(tokenId),
            ),
        ).to.deep.equal([], "taker shouldn't have any holdings left");

        const takersNewMakerTokenBalance: BigNumber = await erc20TokenA.balanceOf.callAsync(takerAddress);
        const makersNewMakerTokenBalance: BigNumber = await erc20TokenA.balanceOf.callAsync(makerAddress);

        expect(takersNewMakerTokenBalance.minus(takersOldMakerTokenBalance)).to.bignumber.equal(
            orderToTokenize.makerAssetAmount,
            "taker's balance should be increased by the fill amount",
        );

        expect(makersOldMakerTokenBalance.minus(makersNewMakerTokenBalance)).to.bignumber.equal(
            orderToTokenize.makerAssetAmount,
            "maker's balance should be decreased by the fill amount",
        );

        // TODO: check that maker received their deposit refund
    });

    it('should allow the maker-minter to burn the token', async () => {
        /* tslint:disable:no-empty */
    });
    it('should allow a taker-holder to trade away multiple holdings in one aggregated transfer', async () => {
        /* tslint:disable:no-empty */
    });
});
