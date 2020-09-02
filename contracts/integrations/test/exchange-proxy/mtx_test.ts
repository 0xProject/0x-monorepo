import { ContractAddresses } from '@0x/contract-addresses';
import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { IExchangeContract } from '@0x/contracts-exchange';
import { blockchainTests, constants, expect, getRandomPortion, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import {
    artifacts as exchangeProxyArtifacts,
    IZeroExContract,
    LogMetadataTransformerContract,
    signCallData,
} from '@0x/contracts-zero-ex';
import { migrateOnceAsync } from '@0x/migrations';
import {
    assetDataUtils,
    encodeFillQuoteTransformerData,
    encodePayTakerTransformerData,
    ETH_TOKEN_ADDRESS,
    FillQuoteTransformerSide,
    findTransformerNonce,
    signatureUtils,
    SignedExchangeProxyMetaTransaction,
} from '@0x/order-utils';
import { AssetProxyId, Order, SignedOrder } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import * as ethjs from 'ethereumjs-util';

const { MAX_UINT256, NULL_ADDRESS, NULL_BYTES, NULL_BYTES32, ZERO_AMOUNT } = constants;

blockchainTests.resets('exchange proxy - meta-transactions', env => {
    const quoteSignerKey = hexUtils.random();
    const quoteSigner = hexUtils.toHex(ethjs.privateToAddress(ethjs.toBuffer(quoteSignerKey)));
    let owner: string;
    let relayer: string;
    let maker: string;
    let taker: string;
    let flashWalletAddress: string;
    let zeroEx: IZeroExContract;
    let exchange: IExchangeContract;
    let inputToken: DummyERC20TokenContract;
    let outputToken: DummyERC20TokenContract;
    let feeToken: DummyERC20TokenContract;
    let addresses: ContractAddresses;
    let protocolFee: BigNumber;
    let metadataTransformer: LogMetadataTransformerContract;
    const GAS_PRICE = new BigNumber('1e9');
    const MAKER_BALANCE = new BigNumber('100e18');
    const TAKER_BALANCE = new BigNumber('100e18');
    const TAKER_FEE_BALANCE = new BigNumber('100e18');

    before(async () => {
        [, relayer, maker, taker] = await env.getAccountAddressesAsync();
        addresses = await migrateOnceAsync(env.provider);
        zeroEx = new IZeroExContract(addresses.exchangeProxy, env.provider, env.txDefaults, {
            LogMetadataTransformer: LogMetadataTransformerContract.ABI(),
            DummyERC20Token: DummyERC20TokenContract.ABI(),
        });
        exchange = new IExchangeContract(addresses.exchange, env.provider, env.txDefaults);
        [inputToken, outputToken, feeToken] = await Promise.all(
            [...new Array(3)].map(i =>
                DummyERC20TokenContract.deployFrom0xArtifactAsync(
                    erc20Artifacts.DummyERC20Token,
                    env.provider,
                    env.txDefaults,
                    {},
                    `DummyToken-${i}`,
                    `TOK${i}`,
                    new BigNumber(18),
                    BigNumber.max(MAKER_BALANCE, TAKER_BALANCE),
                ),
            ),
        );
        // LogMetadataTransformer is not deployed in migrations.
        metadataTransformer = await LogMetadataTransformerContract.deployFrom0xArtifactAsync(
            exchangeProxyArtifacts.LogMetadataTransformer,
            env.provider,
            {
                ...env.txDefaults,
                from: addresses.exchangeProxyTransformerDeployer,
            },
            {},
        );
        owner = await zeroEx.owner().callAsync();
        protocolFee = await exchange.protocolFeeMultiplier().callAsync();
        flashWalletAddress = await zeroEx.getTransformWallet().callAsync();
        const erc20Proxy = await exchange.getAssetProxy(AssetProxyId.ERC20).callAsync();
        const allowanceTarget = await zeroEx.getAllowanceTarget().callAsync();
        await outputToken.mint(MAKER_BALANCE).awaitTransactionSuccessAsync({ from: maker });
        await inputToken.mint(TAKER_BALANCE).awaitTransactionSuccessAsync({ from: taker });
        await feeToken.mint(TAKER_FEE_BALANCE).awaitTransactionSuccessAsync({ from: taker });
        await outputToken.approve(erc20Proxy, MAX_UINT256).awaitTransactionSuccessAsync({ from: maker });
        await inputToken.approve(allowanceTarget, MAX_UINT256).awaitTransactionSuccessAsync({ from: taker });
        await feeToken.approve(allowanceTarget, MAX_UINT256).awaitTransactionSuccessAsync({ from: taker });
        await zeroEx.setQuoteSigner(quoteSigner).awaitTransactionSuccessAsync({ from: owner });
    });

    interface Transformation {
        deploymentNonce: number;
        data: string;
    }

    interface SwapInfo {
        inputTokenAddress: string;
        outputTokenAddress: string;
        inputTokenAmount: BigNumber;
        minOutputTokenAmount: BigNumber;
        transformations: Transformation[];
        orders: SignedOrder[];
    }

    async function generateSwapAsync(orderFields: Partial<Order> = {}, isRfqt: boolean = false): Promise<SwapInfo> {
        const order = await signatureUtils.ecSignTypedDataOrderAsync(
            env.provider,
            {
                chainId: 1337,
                exchangeAddress: exchange.address,
                expirationTimeSeconds: new BigNumber(Date.now()),
                salt: new BigNumber(hexUtils.random()),
                feeRecipientAddress: NULL_ADDRESS,
                senderAddress: NULL_ADDRESS,
                takerAddress: isRfqt ? flashWalletAddress : NULL_ADDRESS,
                makerAddress: maker,
                makerAssetData: assetDataUtils.encodeERC20AssetData(outputToken.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(inputToken.address),
                makerFeeAssetData: NULL_BYTES,
                takerFeeAssetData: NULL_BYTES,
                takerAssetAmount: getRandomPortion(TAKER_BALANCE),
                makerAssetAmount: getRandomPortion(MAKER_BALANCE),
                makerFee: ZERO_AMOUNT,
                takerFee: ZERO_AMOUNT,
                ...orderFields,
            },
            maker,
        );
        const transformations = [
            {
                deploymentNonce: findTransformerNonce(
                    addresses.transformers.fillQuoteTransformer,
                    addresses.exchangeProxyTransformerDeployer,
                ),
                data: encodeFillQuoteTransformerData({
                    orders: [order],
                    signatures: [order.signature],
                    buyToken: outputToken.address,
                    sellToken: inputToken.address,
                    fillAmount: order.takerAssetAmount,
                    maxOrderFillAmounts: [],
                    refundReceiver: hexUtils.leftPad(2, 20), // Send refund to sender.
                    rfqtTakerAddress: isRfqt ? taker : NULL_ADDRESS,
                    side: FillQuoteTransformerSide.Sell,
                }),
            },
            {
                deploymentNonce: findTransformerNonce(
                    addresses.transformers.payTakerTransformer,
                    addresses.exchangeProxyTransformerDeployer,
                ),
                data: encodePayTakerTransformerData({
                    tokens: [inputToken.address, outputToken.address, ETH_TOKEN_ADDRESS],
                    amounts: [MAX_UINT256, MAX_UINT256, MAX_UINT256],
                }),
            },
            {
                deploymentNonce: findTransformerNonce(
                    metadataTransformer.address,
                    addresses.exchangeProxyTransformerDeployer,
                ),
                data: NULL_BYTES,
            },
        ];
        return {
            transformations,
            orders: [order],
            inputTokenAddress: inputToken.address,
            outputTokenAddress: outputToken.address,
            inputTokenAmount: order.takerAssetAmount,
            minOutputTokenAmount: order.makerAssetAmount,
        };
    }

    function getSwapData(swap: SwapInfo): string {
        return zeroEx
            .transformERC20(
                swap.inputTokenAddress,
                swap.outputTokenAddress,
                swap.inputTokenAmount,
                swap.minOutputTokenAmount,
                swap.transformations,
            )
            .getABIEncodedTransactionData();
    }

    function getSignedSwapData(swap: SwapInfo, signerKey?: string): string {
        return signCallData(
            zeroEx
                .transformERC20(
                    swap.inputTokenAddress,
                    swap.outputTokenAddress,
                    swap.inputTokenAmount,
                    swap.minOutputTokenAmount,
                    swap.transformations,
                )
                .getABIEncodedTransactionData(),
            signerKey ? signerKey : quoteSignerKey,
        );
    }

    async function createMetaTransactionAsync(
        data: string,
        value: BigNumber,
        fee?: BigNumber | number,
    ): Promise<SignedExchangeProxyMetaTransaction> {
        return signatureUtils.ecSignTypedDataExchangeProxyMetaTransactionAsync(
            env.provider,
            {
                value,
                signer: taker,
                sender: relayer,
                minGasPrice: GAS_PRICE,
                maxGasPrice: GAS_PRICE,
                expirationTimeSeconds: new BigNumber(Math.floor(Date.now() / 1000) + 60),
                salt: new BigNumber(hexUtils.random()),
                callData: data,
                feeToken: feeToken.address,
                feeAmount: fee !== undefined ? new BigNumber(fee) : getRandomPortion(TAKER_FEE_BALANCE),
                domain: {
                    chainId: 1,
                    name: 'ZeroEx',
                    version: '1.0.0',
                    verifyingContract: zeroEx.address,
                },
            },
            taker,
        );
    }

    it('can call `transformERC20()` with signed calldata and no relayer fee', async () => {
        const swap = await generateSwapAsync();
        const callDataHash = hexUtils.hash(getSwapData(swap));
        const signedSwapData = getSignedSwapData(swap);
        const _protocolFee = protocolFee.times(GAS_PRICE).times(swap.orders.length + 1); // Pay a little more fee than needed.
        const mtx = await createMetaTransactionAsync(signedSwapData, _protocolFee, 0);
        const relayerEthBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(relayer);
        const receipt = await zeroEx
            .executeMetaTransaction(mtx, mtx.signature)
            .awaitTransactionSuccessAsync({ from: relayer, value: mtx.value, gasPrice: GAS_PRICE });
        const relayerEthRefund = relayerEthBalanceBefore
            .minus(await env.web3Wrapper.getBalanceInWeiAsync(relayer))
            .minus(GAS_PRICE.times(receipt.gasUsed));
        // Ensure the relayer got back the unused protocol fees.
        expect(relayerEthRefund).to.bignumber.eq(protocolFee.times(GAS_PRICE));
        // Ensure the relayer got paid no mtx fees.
        expect(await feeToken.balanceOf(relayer).callAsync()).to.bignumber.eq(0);
        // Ensure the taker got output tokens.
        expect(await outputToken.balanceOf(taker).callAsync()).to.bignumber.eq(swap.minOutputTokenAmount);
        // Ensure the maker got input tokens.
        expect(await inputToken.balanceOf(maker).callAsync()).to.bignumber.eq(swap.inputTokenAmount);
        // Check events.
        verifyEventsFromLogs(
            receipt.logs,
            [
                {
                    taker,
                    callDataHash,
                    sender: zeroEx.address,
                    data: NULL_BYTES,
                },
            ],
            'TransformerMetadata',
        );
    });

    it('can call `transformERC20()` with signed calldata and a relayer fee', async () => {
        const swap = await generateSwapAsync();
        const callDataHash = hexUtils.hash(getSwapData(swap));
        const signedSwapData = getSignedSwapData(swap);
        const _protocolFee = protocolFee.times(GAS_PRICE).times(swap.orders.length + 1); // Pay a little more fee than needed.
        const mtx = await createMetaTransactionAsync(signedSwapData, _protocolFee);
        const relayerEthBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(relayer);
        const receipt = await zeroEx
            .executeMetaTransaction(mtx, mtx.signature)
            .awaitTransactionSuccessAsync({ from: relayer, value: mtx.value, gasPrice: GAS_PRICE });
        const relayerEthRefund = relayerEthBalanceBefore
            .minus(await env.web3Wrapper.getBalanceInWeiAsync(relayer))
            .minus(GAS_PRICE.times(receipt.gasUsed));
        // Ensure the relayer got back the unused protocol fees.
        expect(relayerEthRefund).to.bignumber.eq(protocolFee.times(GAS_PRICE));
        // Ensure the relayer got paid mtx fees.
        expect(await feeToken.balanceOf(relayer).callAsync()).to.bignumber.eq(mtx.feeAmount);
        // Ensure the taker got output tokens.
        expect(await outputToken.balanceOf(taker).callAsync()).to.bignumber.eq(swap.minOutputTokenAmount);
        // Ensure the maker got input tokens.
        expect(await inputToken.balanceOf(maker).callAsync()).to.bignumber.eq(swap.inputTokenAmount);
        // Check events.
        verifyEventsFromLogs(
            receipt.logs,
            [
                {
                    taker,
                    callDataHash,
                    sender: zeroEx.address,
                    data: NULL_BYTES,
                },
            ],
            'TransformerMetadata',
        );
    });

    it('can call `transformERC20()` with wrongly signed calldata and a relayer fee', async () => {
        const swap = await generateSwapAsync();
        const signedSwapData = getSignedSwapData(swap, hexUtils.random());
        const _protocolFee = protocolFee.times(GAS_PRICE).times(swap.orders.length + 1); // Pay a little more fee than needed.
        const mtx = await createMetaTransactionAsync(signedSwapData, _protocolFee);
        const relayerEthBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(relayer);
        const receipt = await zeroEx
            .executeMetaTransaction(mtx, mtx.signature)
            .awaitTransactionSuccessAsync({ from: relayer, value: mtx.value, gasPrice: GAS_PRICE });
        const relayerEthRefund = relayerEthBalanceBefore
            .minus(await env.web3Wrapper.getBalanceInWeiAsync(relayer))
            .minus(GAS_PRICE.times(receipt.gasUsed));
        // Ensure the relayer got back the unused protocol fees.
        expect(relayerEthRefund).to.bignumber.eq(protocolFee.times(GAS_PRICE));
        // Ensure the relayer got paid mtx fees.
        expect(await feeToken.balanceOf(relayer).callAsync()).to.bignumber.eq(mtx.feeAmount);
        // Ensure the taker got output tokens.
        expect(await outputToken.balanceOf(taker).callAsync()).to.bignumber.eq(swap.minOutputTokenAmount);
        // Ensure the maker got input tokens.
        expect(await inputToken.balanceOf(maker).callAsync()).to.bignumber.eq(swap.inputTokenAmount);
        // Check events.
        verifyEventsFromLogs(
            receipt.logs,
            [
                {
                    taker,
                    // Only signed calldata should have a nonzero hash.
                    callDataHash: NULL_BYTES32,
                    sender: zeroEx.address,
                    data: NULL_BYTES,
                },
            ],
            'TransformerMetadata',
        );
    });

    it('`transformERC20()` can fill RFQT order if calldata is signed', async () => {
        const swap = await generateSwapAsync({}, true);
        const callDataHash = hexUtils.hash(getSwapData(swap));
        const signedSwapData = getSignedSwapData(swap);
        const _protocolFee = protocolFee.times(GAS_PRICE).times(swap.orders.length + 1); // Pay a little more fee than needed.
        const mtx = await createMetaTransactionAsync(signedSwapData, _protocolFee, 0);
        const relayerEthBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(relayer);
        const receipt = await zeroEx
            .executeMetaTransaction(mtx, mtx.signature)
            .awaitTransactionSuccessAsync({ from: relayer, value: mtx.value, gasPrice: GAS_PRICE });
        const relayerEthRefund = relayerEthBalanceBefore
            .minus(await env.web3Wrapper.getBalanceInWeiAsync(relayer))
            .minus(GAS_PRICE.times(receipt.gasUsed));
        // Ensure the relayer got back the unused protocol fees.
        expect(relayerEthRefund).to.bignumber.eq(protocolFee.times(GAS_PRICE));
        // Ensure the relayer got paid no mtx fees.
        expect(await feeToken.balanceOf(relayer).callAsync()).to.bignumber.eq(0);
        // Ensure the taker got output tokens.
        expect(await outputToken.balanceOf(taker).callAsync()).to.bignumber.eq(swap.minOutputTokenAmount);
        // Ensure the maker got input tokens.
        expect(await inputToken.balanceOf(maker).callAsync()).to.bignumber.eq(swap.inputTokenAmount);
        // Check events.
        verifyEventsFromLogs(
            receipt.logs,
            [
                {
                    taker,
                    callDataHash,
                    sender: zeroEx.address,
                    data: NULL_BYTES,
                },
            ],
            'TransformerMetadata',
        );
    });
});
