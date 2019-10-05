import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import {
    artifacts as exchangeArtifacts,
    constants as exchangeConstants,
    ExchangeContract,
    exchangeDataEncoder,
    ExchangeFunctionName,
    TestProtocolFeeCollectorContract,
} from '@0x/contracts-exchange';
import {
    blockchainTests,
    constants,
    hexConcat,
    hexSlice,
    OrderFactory,
    TransactionFactory,
} from '@0x/contracts-test-utils';
import { assetDataUtils, CoordinatorRevertErrors, transactionHashUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { ApprovalFactory, artifacts, CoordinatorContract, CoordinatorTestFactory } from '../src';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Coordinator tests', env => {
    let chainId: number;
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20Proxy: ERC20ProxyContract;
    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let makerFeeToken: DummyERC20TokenContract;
    let takerFeeToken: DummyERC20TokenContract;
    let coordinatorContract: CoordinatorContract;
    let exchange: ExchangeContract;
    let protocolFeeCollector: TestProtocolFeeCollectorContract;
    let wethContract: WETH9Contract;

    let erc20Wrapper: ERC20Wrapper;
    let orderFactory: OrderFactory;
    let takerTransactionFactory: TransactionFactory;
    let makerTransactionFactory: TransactionFactory;
    let approvalFactory: ApprovalFactory;
    let testFactory: CoordinatorTestFactory;

    const GAS_PRICE = new BigNumber(env.txDefaults.gasPrice || constants.DEFAULT_GAS_PRICE);
    const PROTOCOL_FEE_MULTIPLIER = new BigNumber(150000);
    const PROTOCOL_FEE = GAS_PRICE.times(PROTOCOL_FEE_MULTIPLIER);

    before(async () => {
        chainId = await env.getChainIdAsync();
        const accounts = await env.getAccountAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = accounts);

        // Deploy Exchange
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            env.provider,
            env.txDefaults,
            {},
            new BigNumber(chainId),
        );

        // Set up ERC20
        erc20Wrapper = new ERC20Wrapper(env.provider, usedAddresses, owner);
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        const numDummyErc20ToDeploy = 4;
        [erc20TokenA, erc20TokenB, makerFeeToken, takerFeeToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, { from: owner });
        await exchange.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, { from: owner });

        // Set up WETH
        wethContract = await WETH9Contract.deployFrom0xArtifactAsync(
            erc20Artifacts.WETH9,
            env.provider,
            env.txDefaults,
            {},
        );
        const weth = new DummyERC20TokenContract(wethContract.address, env.provider);
        erc20Wrapper.addDummyTokenContract(weth);
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        // Set up Protocol Fee Collector
        protocolFeeCollector = await TestProtocolFeeCollectorContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.TestProtocolFeeCollector,
            env.provider,
            env.txDefaults,
            {},
            weth.address,
        );
        await exchange.setProtocolFeeMultiplier.awaitTransactionSuccessAsync(PROTOCOL_FEE_MULTIPLIER);
        await exchange.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(protocolFeeCollector.address);
        for (const account of usedAddresses) {
            await wethContract.deposit.awaitTransactionSuccessAsync({
                from: account,
                value: constants.ONE_ETHER,
            });
            await wethContract.approve.awaitTransactionSuccessAsync(
                protocolFeeCollector.address,
                constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
                {
                    from: account,
                },
            );
        }
        erc20Wrapper.addTokenOwnerAddress(protocolFeeCollector.address);

        // Deploy Coordinator
        coordinatorContract = await CoordinatorContract.deployFrom0xArtifactAsync(
            artifacts.Coordinator,
            env.provider,
            env.txDefaults,
            { ...exchangeArtifacts, ...artifacts },
            exchange.address,
            new BigNumber(chainId),
        );
        erc20Wrapper.addTokenOwnerAddress(coordinatorContract.address);

        // Configure order defaults
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            senderAddress: coordinatorContract.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
            takerAssetData: assetDataUtils.encodeERC20AssetData(erc20TokenB.address),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(makerFeeToken.address),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(takerFeeToken.address),
            exchangeAddress: exchange.address,
            chainId,
        };
        const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(takerAddress)];
        const feeRecipientPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(feeRecipientAddress)];
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        makerTransactionFactory = new TransactionFactory(makerPrivateKey, exchange.address, chainId);
        takerTransactionFactory = new TransactionFactory(takerPrivateKey, exchange.address, chainId);
        approvalFactory = new ApprovalFactory(feeRecipientPrivateKey, coordinatorContract.address);
        testFactory = new CoordinatorTestFactory(
            coordinatorContract,
            erc20Wrapper,
            makerAddress,
            takerAddress,
            feeRecipientAddress,
            protocolFeeCollector.address,
            erc20TokenA.address,
            erc20TokenB.address,
            makerFeeToken.address,
            takerFeeToken.address,
            weth.address,
            GAS_PRICE,
            PROTOCOL_FEE_MULTIPLIER,
        );
    });

    describe('single order fills', () => {
        for (const fnName of exchangeConstants.SINGLE_FILL_FN_NAMES) {
            it(`${fnName} should fill the order with a signed approval`, async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const approval = approvalFactory.newSignedApproval(transaction, takerAddress);
                const txData = { from: takerAddress, value: PROTOCOL_FEE };
                await testFactory.executeFillTransactionTestAsync(
                    [order],
                    transaction,
                    takerAddress,
                    [approval.signature],
                    txData,
                );
            });
            it(`${fnName} should fill the order if called by approver (eth protocol fee, no refund)`, async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const txData = { from: feeRecipientAddress, value: PROTOCOL_FEE };
                await testFactory.executeFillTransactionTestAsync(
                    [order],
                    transaction,
                    feeRecipientAddress,
                    [],
                    txData,
                );
            });
            it(`${fnName} should fill the order if called by approver (eth protocol fee, refund)`, async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const txData = { from: feeRecipientAddress, value: PROTOCOL_FEE.plus(1) };
                await testFactory.executeFillTransactionTestAsync(
                    [order],
                    transaction,
                    feeRecipientAddress,
                    [],
                    txData,
                );
            });
            it(`${fnName} should fill the order if called by approver (weth protocol fee, no refund)`, async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const txData = { from: feeRecipientAddress };
                await testFactory.executeFillTransactionTestAsync(
                    [order],
                    transaction,
                    feeRecipientAddress,
                    [],
                    txData,
                );
            });
            it(`${fnName} should fill the order if called by approver (weth protocol fee, refund)`, async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const txData = { from: feeRecipientAddress, value: new BigNumber(1) };
                await testFactory.executeFillTransactionTestAsync(
                    [order],
                    transaction,
                    feeRecipientAddress,
                    [],
                    txData,
                );
            });
            it(`${fnName} should fill the order if called by approver`, async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const txData = { from: feeRecipientAddress, value: PROTOCOL_FEE };
                await testFactory.executeFillTransactionTestAsync(
                    [order],
                    transaction,
                    feeRecipientAddress,
                    [],
                    txData,
                );
            });
            it(`${fnName} should revert with no approval signature`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                await testFactory.executeFillTransactionTestAsync(
                    orders,
                    transaction,
                    takerAddress,
                    [],
                    {
                        from: takerAddress,
                        gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
                        value: PROTOCOL_FEE,
                    },
                    new CoordinatorRevertErrors.InvalidApprovalSignatureError(transactionHash, feeRecipientAddress),
                );
            });
            it(`${fnName} should revert with an invalid approval signature`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const approval = approvalFactory.newSignedApproval(transaction, takerAddress);
                const signature = hexConcat(
                    hexSlice(approval.signature, 0, 2),
                    '0xFFFFFFFF',
                    hexSlice(approval.signature, 6),
                );
                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                await testFactory.executeFillTransactionTestAsync(
                    orders,
                    transaction,
                    takerAddress,
                    [signature],
                    { from: takerAddress, value: PROTOCOL_FEE },
                    new CoordinatorRevertErrors.InvalidApprovalSignatureError(transactionHash, feeRecipientAddress),
                );
            });
            it(`${fnName} should revert if not called by tx signer or approver`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const approval = approvalFactory.newSignedApproval(transaction, takerAddress);
                await testFactory.executeFillTransactionTestAsync(
                    orders,
                    transaction,
                    takerAddress,
                    [approval.signature],
                    { from: owner, value: PROTOCOL_FEE },
                    new CoordinatorRevertErrors.InvalidOriginError(takerAddress),
                );
            });
        }
    });
    describe('batch order fills', () => {
        for (const fnName of [...exchangeConstants.MARKET_FILL_FN_NAMES, ...exchangeConstants.BATCH_FILL_FN_NAMES]) {
            it(`${fnName} should fill the orders with a signed approval`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const approval = approvalFactory.newSignedApproval(transaction, takerAddress);
                await testFactory.executeFillTransactionTestAsync(
                    orders,
                    transaction,
                    takerAddress,
                    [approval.signature],
                    {
                        from: takerAddress,
                        gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
                        value: PROTOCOL_FEE.times(orders.length),
                    },
                );
            });
            it(`${fnName} should fill the orders if called by approver (eth fee, no refund)`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                await testFactory.executeFillTransactionTestAsync(orders, transaction, feeRecipientAddress, [], {
                    from: feeRecipientAddress,
                    gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
                    value: PROTOCOL_FEE.times(orders.length),
                });
            });
            it(`${fnName} should fill the orders if called by approver (mixed fees, refund)`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                await testFactory.executeFillTransactionTestAsync(orders, transaction, feeRecipientAddress, [], {
                    from: feeRecipientAddress,
                    gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
                    value: PROTOCOL_FEE.times(orders.length).plus(1),
                });
            });
            it(`${fnName} should revert with an invalid approval signature`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const approval = approvalFactory.newSignedApproval(transaction, takerAddress);
                const signature = hexConcat(
                    hexSlice(approval.signature, 0, 2),
                    '0xFFFFFFFF',
                    hexSlice(approval.signature, 6),
                );
                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                await testFactory.executeFillTransactionTestAsync(
                    orders,
                    transaction,
                    takerAddress,
                    [signature],
                    { from: takerAddress, value: PROTOCOL_FEE.times(orders.length) },
                    new CoordinatorRevertErrors.InvalidApprovalSignatureError(transactionHash, feeRecipientAddress),
                );
            });
            it(`${fnName} should revert if not called by tx signer or approver`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const approval = approvalFactory.newSignedApproval(transaction, takerAddress);
                await testFactory.executeFillTransactionTestAsync(
                    orders,
                    transaction,
                    takerAddress,
                    [approval.signature],
                    { from: owner, value: PROTOCOL_FEE.times(orders.length) },
                    new CoordinatorRevertErrors.InvalidOriginError(takerAddress),
                );
            });
        }
    });
    describe('cancels', () => {
        it('cancelOrder call should be successful without an approval', async () => {
            const orders = [await orderFactory.newSignedOrderAsync()];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, orders);
            const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
            await testFactory.executeCancelTransactionTestAsync(
                ExchangeFunctionName.CancelOrder,
                orders,
                transaction,
                makerAddress,
                [],
                {
                    from: makerAddress,
                },
            );
        });
        it('batchCancelOrders call should be successful without an approval', async () => {
            const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.BatchCancelOrders, orders);
            const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
            await testFactory.executeCancelTransactionTestAsync(
                ExchangeFunctionName.BatchCancelOrders,
                orders,
                transaction,
                makerAddress,
                [],
                {
                    from: makerAddress,
                },
            );
        });
        it('cancelOrdersUpTo call should be successful without an approval', async () => {
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrdersUpTo, []);
            const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
            await testFactory.executeCancelTransactionTestAsync(
                ExchangeFunctionName.CancelOrdersUpTo,
                [],
                transaction,
                makerAddress,
                [],
                {
                    from: makerAddress,
                },
            );
        });
    });
});
// tslint:disable:max-file-line-count
