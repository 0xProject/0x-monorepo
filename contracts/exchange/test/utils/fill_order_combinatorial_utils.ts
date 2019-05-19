import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { chaiSetup, constants, FillResults, orderUtils, signingUtils } from '@0x/contracts-test-utils';
import {
    assetDataUtils,
    BalanceAndProxyAllowanceLazyStore,
    ExchangeRevertErrors,
    orderHashUtils,
} from '@0x/order-utils';
import { AssetProxyId, Order, SignatureType, SignedOrder } from '@0x/types';
import { BigNumber, errorUtils, providerUtils, RevertError, StringRevertError } from '@0x/utils';
import { SupportedProvider, Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs, TxData } from 'ethereum-types';
import * as _ from 'lodash';
import 'make-promises-safe';

import { artifacts, ExchangeContract, ExchangeFillEventArgs } from '../../src';

import { AssetWrapper } from './asset_wrapper';
import { ExchangeWrapper } from './exchange_wrapper';
import {
    AllowanceAmountScenario,
    AssetDataScenario,
    BalanceAmountScenario,
    ExpirationTimeSecondsScenario,
    FeeAssetDataScenario,
    FeeRecipientAddressScenario,
    FillScenario,
    OrderAssetAmountScenario,
    OrderScenario,
    TakerAssetFillAmountScenario,
    TakerScenario,
    TraderStateScenario,
} from './fill_order_scenarios';
import { FillOrderError, FillOrderSimulator } from './fill_order_simulator';
import { OrderFactoryFromScenario } from './order_factory_from_scenario';
import { SimpleAssetBalanceAndProxyAllowanceFetcher } from './simple_asset_balance_and_proxy_allowance_fetcher';
import { SimpleOrderFilledCancelledFetcher } from './simple_order_filled_cancelled_fetcher';

chaiSetup.configure();
const expect = chai.expect;

const EMPTY_FILL_RESULTS = {
    takerAssetFilledAmount: constants.ZERO_AMOUNT,
    makerAssetFilledAmount: constants.ZERO_AMOUNT,
    makerFeePaid: constants.ZERO_AMOUNT,
    takerFeePaid: constants.ZERO_AMOUNT,
};

enum TestOutlook {
    Any,
    Success,
    Failure,
}

/**
 * Instantiates a new instance of FillOrderCombinatorialUtils. Since this method has some
 * required async setup, a factory method is required.
 * @param web3Wrapper Web3Wrapper instance
 * @param txDefaults Default Ethereum tx options
 * @return FillOrderCombinatorialUtils instance
 */
export async function fillOrderCombinatorialUtilsFactoryAsync(
    web3Wrapper: Web3Wrapper,
    txDefaults: Partial<TxData>,
): Promise<FillOrderCombinatorialUtils> {
    const accounts = await web3Wrapper.getAvailableAddressesAsync();
    const userAddresses = _.slice(accounts, 0, 5);
    const [ownerAddress, makerAddress, takerAddress] = userAddresses;
    const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];

    const supportedProvider = web3Wrapper.getProvider();
    const provider = providerUtils.standardizeOrThrow(supportedProvider);
    const chainId = await providerUtils.getChainIdAsync(provider);
    const erc20Wrapper = new ERC20Wrapper(provider, userAddresses, ownerAddress);
    const erc721Wrapper = new ERC721Wrapper(provider, userAddresses, ownerAddress);

    const erc20EighteenDecimalTokenCount = 4;
    const eighteenDecimals = new BigNumber(18);
    const erc20EighteenDecimalTokens = await erc20Wrapper.deployDummyTokensAsync(
        erc20EighteenDecimalTokenCount,
        eighteenDecimals,
    );

    const erc20FiveDecimalTokenCount = 2;
    const fiveDecimals = new BigNumber(5);
    const erc20FiveDecimalTokens = await erc20Wrapper.deployDummyTokensAsync(erc20FiveDecimalTokenCount, fiveDecimals);

    const zeroDecimals = new BigNumber(0);
    const erc20ZeroDecimalTokenCount = 2;
    const erc20ZeroDecimalTokens = await erc20Wrapper.deployDummyTokensAsync(erc20ZeroDecimalTokenCount, zeroDecimals);
    const erc20Proxy = await erc20Wrapper.deployProxyAsync();
    await erc20Wrapper.setBalancesAndAllowancesAsync();

    const [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
    const erc721Proxy = await erc721Wrapper.deployProxyAsync();
    await erc721Wrapper.setBalancesAndAllowancesAsync();
    const erc721Balances = await erc721Wrapper.getBalancesAsync();

    const assetWrapper = new AssetWrapper([erc20Wrapper, erc721Wrapper]);

    const exchangeContract = await ExchangeContract.deployFrom0xArtifactAsync(
        artifacts.Exchange,
        provider,
        txDefaults,
        new BigNumber(chainId),
    );
    const exchangeWrapper = new ExchangeWrapper(exchangeContract, provider);
    await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, ownerAddress);
    await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, ownerAddress);

    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeContract.address, { from: ownerAddress }),
        constants.AWAIT_TRANSACTION_MINED_MS,
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeContract.address, { from: ownerAddress }),
        constants.AWAIT_TRANSACTION_MINED_MS,
    );

    const orderFactory = new OrderFactoryFromScenario(
        userAddresses,
        erc20EighteenDecimalTokens.map(token => token.address),
        erc20FiveDecimalTokens.map(token => token.address),
        erc20ZeroDecimalTokens.map(token => token.address),
        erc721Token,
        erc721Balances,
        exchangeContract.address,
        chainId,
    );

    const fillOrderCombinatorialUtils = new FillOrderCombinatorialUtils(
        web3Wrapper.getProvider(),
        orderFactory,
        ownerAddress,
        makerAddress,
        makerPrivateKey,
        takerAddress,
        exchangeWrapper,
        assetWrapper,
    );
    return fillOrderCombinatorialUtils;
}

export class FillOrderCombinatorialUtils {
    public provider: SupportedProvider;
    public orderFactory: OrderFactoryFromScenario;
    public ownerAddress: string;
    public makerAddress: string;
    public makerPrivateKey: Buffer;
    public takerAddress: string;
    public exchangeWrapper: ExchangeWrapper;
    public assetWrapper: AssetWrapper;
    public balanceAndProxyAllowanceFetcher: SimpleAssetBalanceAndProxyAllowanceFetcher;
    public orderFilledCancelledFetcher: SimpleOrderFilledCancelledFetcher;

    public static generateFillOrderCombinations(): FillScenario[] {
        const takerScenarios = [
            TakerScenario.Unspecified,
            // TakerScenario.CorrectlySpecified,
            // TakerScenario.IncorrectlySpecified,
        ];
        const feeRecipientScenarios = [
            FeeRecipientAddressScenario.EthUserAddress,
            // FeeRecipientAddressScenario.BurnAddress,
        ];
        const makerAssetAmountScenario = [
            OrderAssetAmountScenario.Large,
            // OrderAssetAmountScenario.Zero,
            // OrderAssetAmountScenario.Small,
        ];
        const takerAssetAmountScenario = [
            OrderAssetAmountScenario.Large,
            // OrderAssetAmountScenario.Zero,
            // OrderAssetAmountScenario.Small,
        ];
        const makerFeeScenario = [
            OrderAssetAmountScenario.Large,
            // OrderAssetAmountScenario.Small,
            // OrderAssetAmountScenario.Zero,
        ];
        const takerFeeScenario = [
            OrderAssetAmountScenario.Large,
            // OrderAssetAmountScenario.Small,
            // OrderAssetAmountScenario.Zero,
        ];
        const expirationTimeSecondsScenario = [
            ExpirationTimeSecondsScenario.InFuture,
            // ExpirationTimeSecondsScenario.InPast,
        ];
        const makerAssetDataScenario = [
            AssetDataScenario.ERC20FiveDecimals,
            AssetDataScenario.ERC20EighteenDecimals,
            AssetDataScenario.ERC721,
        ];
        const takerAssetDataScenario = [
            AssetDataScenario.ERC20FiveDecimals,
            AssetDataScenario.ERC20EighteenDecimals,
            AssetDataScenario.ERC721,
        ];
        const makerFeeAssetDataScenario = [
            FeeAssetDataScenario.ERC20FiveDecimals,
            FeeAssetDataScenario.ERC20EighteenDecimals,
            FeeAssetDataScenario.ERC721,
            FeeAssetDataScenario.MakerToken,
            FeeAssetDataScenario.TakerToken,
        ];
        const takerFeeAssetDataScenario = [
            FeeAssetDataScenario.ERC20FiveDecimals,
            FeeAssetDataScenario.ERC20EighteenDecimals,
            FeeAssetDataScenario.ERC721,
            FeeAssetDataScenario.MakerToken,
            FeeAssetDataScenario.TakerToken,
        ];
        const takerAssetFillAmountScenario = [
            TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
            // TakerAssetFillAmountScenario.GreaterThanTakerAssetAmount,
            // TakerAssetFillAmountScenario.LessThanTakerAssetAmount,
        ];
        const makerAssetBalanceScenario = [
            BalanceAmountScenario.Higher,
            // BalanceAmountScenario.Exact,
            // BalanceAmountScenario.TooLow,
            // BalanceAmountScenario.Zero,
        ];
        const makerAssetAllowanceScenario = [
            // AllowanceAmountScenario.Higher,
            // AllowanceAmountScenario.Exact,
            // AllowanceAmountScenario.TooLow,
            AllowanceAmountScenario.Unlimited,
            // AllowanceAmountScenario.Zero,
        ];
        const makerFeeBalanceScenario = [
            BalanceAmountScenario.Higher,
            // BalanceAmountScenario.Exact,
            // BalanceAmountScenario.TooLow,
            // BalanceAmountScenario.Zero,
        ];
        const makerFeeAllowanceScenario = [
            // AllowanceAmountScenario.Higher,
            // AllowanceAmountScenario.Exact,
            // AllowanceAmountScenario.TooLow,
            AllowanceAmountScenario.Unlimited,
            // AllowanceAmountScenario.Zero,
        ];
        const takerAssetBalanceScenario = [
            BalanceAmountScenario.Higher,
            // BalanceAmountScenario.Exact,
            // BalanceAmountScenario.TooLow,
            // BalanceAmountScenario.Zero,
        ];
        const takerAssetAllowanceScenario = [
            // AllowanceAmountScenario.Higher,
            // AllowanceAmountScenario.Exact,
            // AllowanceAmountScenario.TooLow,
            AllowanceAmountScenario.Unlimited,
            // AllowanceAmountScenario.Zero,
        ];
        const takerFeeBalanceScenario = [
            BalanceAmountScenario.Higher,
            // BalanceAmountScenario.Exact,
            // BalanceAmountScenario.TooLow,
            // BalanceAmountScenario.Zero,
        ];
        const takerFeeAllowanceScenario = [
            // AllowanceAmountScenario.Higher,
            // AllowanceAmountScenario.Exact,
            // AllowanceAmountScenario.TooLow,
            AllowanceAmountScenario.Unlimited,
            // AllowanceAmountScenario.Zero,
        ];
        const fillScenarioArrays = FillOrderCombinatorialUtils._getAllCombinations([
            takerScenarios,
            feeRecipientScenarios,
            makerAssetAmountScenario,
            takerAssetAmountScenario,
            makerFeeScenario,
            takerFeeScenario,
            expirationTimeSecondsScenario,
            makerAssetDataScenario,
            takerAssetDataScenario,
            makerFeeAssetDataScenario,
            takerFeeAssetDataScenario,
            takerAssetFillAmountScenario,
            makerAssetBalanceScenario,
            makerAssetAllowanceScenario,
            makerFeeBalanceScenario,
            makerFeeAllowanceScenario,
            takerAssetBalanceScenario,
            takerAssetAllowanceScenario,
            takerFeeBalanceScenario,
            takerFeeAllowanceScenario,
        ]);

        const fillScenarios = _.map(fillScenarioArrays, fillScenarioArray => {
            // tslint:disable:custom-no-magic-numbers
            const fillScenario: FillScenario = {
                orderScenario: {
                    takerScenario: fillScenarioArray[0] as TakerScenario,
                    feeRecipientScenario: fillScenarioArray[1] as FeeRecipientAddressScenario,
                    makerAssetAmountScenario: fillScenarioArray[2] as OrderAssetAmountScenario,
                    takerAssetAmountScenario: fillScenarioArray[3] as OrderAssetAmountScenario,
                    makerFeeScenario: fillScenarioArray[4] as OrderAssetAmountScenario,
                    takerFeeScenario: fillScenarioArray[5] as OrderAssetAmountScenario,
                    expirationTimeSecondsScenario: fillScenarioArray[6] as ExpirationTimeSecondsScenario,
                    makerAssetDataScenario: fillScenarioArray[7] as AssetDataScenario,
                    takerAssetDataScenario: fillScenarioArray[8] as AssetDataScenario,
                    makerFeeAssetDataScenario: fillScenarioArray[9] as FeeAssetDataScenario,
                    takerFeeAssetDataScenario: fillScenarioArray[10] as FeeAssetDataScenario,
                },
                takerAssetFillAmountScenario: fillScenarioArray[11] as TakerAssetFillAmountScenario,
                makerStateScenario: {
                    traderAssetBalance: fillScenarioArray[12] as BalanceAmountScenario,
                    traderAssetAllowance: fillScenarioArray[13] as AllowanceAmountScenario,
                    feeBalance: fillScenarioArray[14] as BalanceAmountScenario,
                    feeAllowance: fillScenarioArray[15] as AllowanceAmountScenario,
                },
                takerStateScenario: {
                    traderAssetBalance: fillScenarioArray[16] as BalanceAmountScenario,
                    traderAssetAllowance: fillScenarioArray[17] as AllowanceAmountScenario,
                    feeBalance: fillScenarioArray[18] as BalanceAmountScenario,
                    feeAllowance: fillScenarioArray[19] as AllowanceAmountScenario,
                },
            };
            // tslint:enable:custom-no-magic-numbers
            return fillScenario;
        });

        return fillScenarios;
    }

    /**
     * Recursive implementation of generating all combinations of the supplied
     * string-containing arrays.
     */
    private static _getAllCombinations(arrays: string[][]): string[][] {
        // Base case
        if (arrays.length === 1) {
            const remainingValues = _.map(arrays[0], val => {
                return [val];
            });
            return remainingValues;
        } else {
            const result = [];
            const restOfArrays = arrays.slice(1);
            const allCombinationsOfRemaining = FillOrderCombinatorialUtils._getAllCombinations(restOfArrays); // recur with the rest of array
            // tslint:disable:prefer-for-of
            for (let i = 0; i < allCombinationsOfRemaining.length; i++) {
                for (let j = 0; j < arrays[0].length; j++) {
                    result.push([arrays[0][j], ...allCombinationsOfRemaining[i]]);
                }
            }
            // tslint:enable:prefer-for-of
            return result;
        }
    }

    constructor(
        provider: SupportedProvider,
        orderFactory: OrderFactoryFromScenario,
        ownerAddress: string,
        makerAddress: string,
        makerPrivateKey: Buffer,
        takerAddress: string,
        exchangeWrapper: ExchangeWrapper,
        assetWrapper: AssetWrapper,
    ) {
        this.provider = provider;
        this.orderFactory = orderFactory;
        this.ownerAddress = ownerAddress;
        this.makerAddress = makerAddress;
        this.makerPrivateKey = makerPrivateKey;
        this.takerAddress = takerAddress;
        this.exchangeWrapper = exchangeWrapper;
        this.assetWrapper = assetWrapper;
        this.balanceAndProxyAllowanceFetcher = new SimpleAssetBalanceAndProxyAllowanceFetcher(assetWrapper);
        this.orderFilledCancelledFetcher = new SimpleOrderFilledCancelledFetcher(exchangeWrapper);
    }

    public async testFillOrderScenarioAsync(fillScenario: FillScenario): Promise<void> {
        return this._testFillOrderScenarioAsync(fillScenario);
    }

    public async testFillOrderScenarioSuccessAsync(fillScenario: FillScenario): Promise<void> {
        return this._testFillOrderScenarioAsync(fillScenario, TestOutlook.Success);
    }

    public async testFillOrderScenarioFailureAsync(
        fillScenario: FillScenario,
        fillErrorIfExists?: FillOrderError,
    ): Promise<void> {
        return this._testFillOrderScenarioAsync(fillScenario, TestOutlook.Failure, fillErrorIfExists);
    }

    private async _testFillOrderScenarioAsync(
        fillScenario: FillScenario,
        expectedTestResult: TestOutlook = TestOutlook.Any,
        fillErrorIfExists?: FillOrderError,
    ): Promise<void> {
        const lazyStore = new BalanceAndProxyAllowanceLazyStore(this.balanceAndProxyAllowanceFetcher);
        const signedOrder = await this._generateSignedOrder(fillScenario.orderScenario);
        const takerAssetFillAmount = getTakerAssetFillAmountAsync(
            signedOrder,
            fillScenario.takerAssetFillAmountScenario,
        );

        await this._modifyTraderStateAsync(
            fillScenario.makerStateScenario,
            fillScenario.takerStateScenario,
            signedOrder,
            takerAssetFillAmount,
        );

        let expectedFillResults = EMPTY_FILL_RESULTS;
        let _fillErrorIfExists = fillErrorIfExists;
        if (expectedTestResult !== TestOutlook.Failure || fillErrorIfExists === undefined) {
            try {
                expectedFillResults = await this._simulateFillOrderAsync(signedOrder, takerAssetFillAmount, lazyStore);
            } catch (err) {
                _fillErrorIfExists = err.message;
                if (expectedTestResult === TestOutlook.Success) {
                    throw new Error(`Expected fillOrder() to succeed, but would fail with ${err.message}`);
                }
            }
        }

        await this._fillOrderAndAssertOutcomeAsync(
            signedOrder,
            takerAssetFillAmount,
            lazyStore,
            expectedFillResults,
            _fillErrorIfExists as any,
        );
    }

    private _generateSignedOrder(orderScenario: OrderScenario): SignedOrder {
        const order = this.orderFactory.generateOrder(orderScenario);
        const orderHashBuff = orderHashUtils.getOrderHashBuffer(order);
        const signature = signingUtils.signMessage(orderHashBuff, this.makerPrivateKey, SignatureType.EthSign);
        const signedOrder = {
            ...order,
            signature: `0x${signature.toString('hex')}`,
        };
        return signedOrder;
    }

    private async _simulateFillOrderAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
        lazyStore: BalanceAndProxyAllowanceLazyStore,
    ): Promise<FillResults> {
        const simulator = new FillOrderSimulator(lazyStore);
        return simulator.simulateFillOrderAsync(signedOrder, this.takerAddress, takerAssetFillAmount);
    }

    private async _fillOrderAndAssertOutcomeAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
        lazyStore: BalanceAndProxyAllowanceLazyStore,
        expectedFillResults: FillResults,
        fillErrorIfExists?: FillOrderError,
    ): Promise<void> {
        if (fillErrorIfExists !== undefined) {
            const tx = this.exchangeWrapper.fillOrderAsync(signedOrder, this.takerAddress, { takerAssetFillAmount });
            const revertError = fillErrorToRevertError(signedOrder, fillErrorIfExists);
            return expect(tx).to.revertWith(revertError);
        }

        const makerAddress = signedOrder.makerAddress;
        const makerAssetData = signedOrder.makerAssetData;
        const takerAssetData = signedOrder.takerAssetData;
        const makerFeeAssetData = signedOrder.makerAssetData;
        const takerFeeAssetData = signedOrder.takerAssetData;
        const feeRecipient = signedOrder.feeRecipientAddress;

        const expMakerAssetBalanceOfMaker = await lazyStore.getBalanceAsync(makerAssetData, makerAddress);
        const expMakerAssetAllowanceOfMaker = await lazyStore.getProxyAllowanceAsync(makerAssetData, makerAddress);
        const expTakerAssetBalanceOfMaker = await lazyStore.getBalanceAsync(takerAssetData, makerAddress);
        const expMakerFeeAssetBalanceOfMaker = await lazyStore.getBalanceAsync(makerFeeAssetData, makerAddress);
        const expTakerFeeAssetBalanceOfMaker = await lazyStore.getBalanceAsync(takerFeeAssetData, makerAddress);
        const expMakerFeeAssetAllowanceOfMaker = await lazyStore.getProxyAllowanceAsync(
            makerFeeAssetData,
            makerAddress,
        );
        const expTakerAssetBalanceOfTaker = await lazyStore.getBalanceAsync(takerAssetData, this.takerAddress);
        const expTakerAssetAllowanceOfTaker = await lazyStore.getProxyAllowanceAsync(takerAssetData, this.takerAddress);
        const expMakerAssetBalanceOfTaker = await lazyStore.getBalanceAsync(makerAssetData, this.takerAddress);
        const expMakerFeeAssetBalanceOfTaker = await lazyStore.getBalanceAsync(makerFeeAssetData, this.takerAddress);
        const expTakerFeeAssetBalanceOfTaker = await lazyStore.getBalanceAsync(takerFeeAssetData, this.takerAddress);
        const expTakerFeeAssetAllowanceOfTaker = await lazyStore.getProxyAllowanceAsync(
            takerFeeAssetData,
            this.takerAddress,
        );
        const expMakerFeeAssetBalanceOfFeeRecipient = await lazyStore.getBalanceAsync(makerFeeAssetData, feeRecipient);
        const expTakerFeeAssetBalanceOfFeeRecipient = await lazyStore.getBalanceAsync(takerFeeAssetData, feeRecipient);
        const expFilledTakerAmount = expectedFillResults.takerAssetFilledAmount;
        const expFilledMakerAmount = expectedFillResults.makerAssetFilledAmount;
        const expMakerFeePaid = expectedFillResults.makerFeePaid;
        const expTakerFeePaid = expectedFillResults.takerFeePaid;

        const fillResults = await this.exchangeWrapper.getFillOrderResultsAsync(signedOrder, this.takerAddress, {
            takerAssetFillAmount,
        });

        expect(fillResults.takerAssetFilledAmount, 'takerAssetFilledAmount').to.be.bignumber.equal(
            expFilledTakerAmount,
        );
        expect(fillResults.makerAssetFilledAmount, 'makerAssetFilledAmount').to.be.bignumber.equal(
            expFilledMakerAmount,
        );
        expect(fillResults.takerFeePaid, 'takerFeePaid').to.be.bignumber.equal(expTakerFeePaid);
        expect(fillResults.makerFeePaid, 'makerFeePaid').to.be.bignumber.equal(expMakerFeePaid);

        // - Let's fill the order!
        const txReceipt = await this.exchangeWrapper.fillOrderAsync(signedOrder, this.takerAddress, {
            takerAssetFillAmount,
        });

        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const actFilledTakerAmount = await this.exchangeWrapper.getTakerAssetFilledAmountAsync(orderHash);
        expect(actFilledTakerAmount, 'filledTakerAmount').to.be.bignumber.equal(expFilledTakerAmount);

        const exchangeLogs = _.filter(
            txReceipt.logs,
            txLog => txLog.address === this.exchangeWrapper.getExchangeAddress(),
        );
        expect(exchangeLogs.length).to.be.equal(1, 'logs length');
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const log = txReceipt.logs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>;
        expect(log.args.makerAddress, 'log.args.makerAddress').to.be.equal(makerAddress);
        expect(log.args.takerAddress, 'log.args.takerAddress').to.be.equal(this.takerAddress);
        expect(log.args.feeRecipientAddress, 'log.args.feeRecipientAddress').to.be.equal(feeRecipient);
        expect(log.args.makerAssetFilledAmount, 'log.args.makerAssetFilledAmount').to.be.bignumber.equal(
            expFilledMakerAmount,
        );
        expect(log.args.takerAssetFilledAmount, 'log.args.takerAssetFilledAmount').to.be.bignumber.equal(
            expFilledTakerAmount,
        );
        expect(log.args.makerFeePaid, 'log.args.makerFeePaid').to.be.bignumber.equal(expMakerFeePaid);
        expect(log.args.takerFeePaid, 'logs.args.takerFeePaid').to.be.bignumber.equal(expTakerFeePaid);
        expect(log.args.orderHash, 'log.args.orderHash').to.be.equal(orderHash);
        expect(log.args.makerAssetData, 'log.args.makerAssetData').to.be.equal(makerAssetData);
        expect(log.args.takerAssetData, 'log.args.takerAssetData').to.be.equal(takerAssetData);

        const actMakerAssetBalanceOfMaker = await this.assetWrapper.getBalanceAsync(makerAddress, makerAssetData);
        expect(actMakerAssetBalanceOfMaker, 'makerAssetBalanceOfMaker').to.be.bignumber.equal(
            expMakerAssetBalanceOfMaker,
        );

        const actMakerAssetAllowanceOfMaker = await this.assetWrapper.getProxyAllowanceAsync(
            makerAddress,
            makerAssetData,
        );
        expect(actMakerAssetAllowanceOfMaker, 'makerAssetAllowanceOfMaker').to.be.bignumber.equal(
            expMakerAssetAllowanceOfMaker,
        );

        const actTakerAssetBalanceOfMaker = await this.assetWrapper.getBalanceAsync(makerAddress, takerAssetData);
        expect(actTakerAssetBalanceOfMaker, 'takerAssetBalanceOfMaker').to.be.bignumber.equal(
            expTakerAssetBalanceOfMaker,
        );

        const actMakerFeeAssetBalanceOfMaker = await this.assetWrapper.getBalanceAsync(makerAddress, makerFeeAssetData);
        expect(actMakerFeeAssetBalanceOfMaker, 'makerFeeAssetBalanceOfMaker').to.be.bignumber.equal(
            expMakerFeeAssetBalanceOfMaker,
        );

        const actMakerFeeAssetAllowanceOfMaker = await this.assetWrapper.getProxyAllowanceAsync(
            makerAddress,
            makerFeeAssetData,
        );
        expect(actMakerFeeAssetAllowanceOfMaker, 'makerFeeAssetAllowanceOfMaker').to.be.bignumber.equal(
            expMakerFeeAssetAllowanceOfMaker,
        );

        const actTakerFeeAssetBalanceOfMaker = await this.assetWrapper.getBalanceAsync(makerAddress, takerFeeAssetData);
        expect(actTakerFeeAssetBalanceOfMaker, 'takerFeeAssetBalanceOfMaker').to.be.bignumber.equal(
            expTakerFeeAssetBalanceOfMaker,
        );

        const actTakerAssetBalanceOfTaker = await this.assetWrapper.getBalanceAsync(this.takerAddress, takerAssetData);
        expect(actTakerAssetBalanceOfTaker, 'TakerAssetBalanceOfTaker').to.be.bignumber.equal(
            expTakerAssetBalanceOfTaker,
        );

        const actTakerAssetAllowanceOfTaker = await this.assetWrapper.getProxyAllowanceAsync(
            this.takerAddress,
            takerAssetData,
        );

        expect(actTakerAssetAllowanceOfTaker, 'takerAssetAllowanceOfTaker').to.be.bignumber.equal(
            expTakerAssetAllowanceOfTaker,
        );

        const actMakerAssetBalanceOfTaker = await this.assetWrapper.getBalanceAsync(this.takerAddress, makerAssetData);
        expect(actMakerAssetBalanceOfTaker, 'makerAssetBalanceOfTaker').to.be.bignumber.equal(
            expMakerAssetBalanceOfTaker,
        );

        const actMakerFeeAssetBalanceOfTaker = await this.assetWrapper.getBalanceAsync(
            this.takerAddress,
            makerFeeAssetData,
        );
        expect(actMakerFeeAssetBalanceOfTaker, 'makerFeeAssetBalanceOfTaker').to.be.bignumber.equal(
            expMakerFeeAssetBalanceOfTaker,
        );

        const actTakerFeeAssetBalanceOfTaker = await this.assetWrapper.getBalanceAsync(
            this.takerAddress,
            takerFeeAssetData,
        );
        expect(actTakerFeeAssetBalanceOfTaker, 'takerFeeAssetBalanceOfTaker').to.be.bignumber.equal(
            expTakerFeeAssetBalanceOfTaker,
        );

        const actTakerFeeAssetAllowanceOfTaker = await this.assetWrapper.getProxyAllowanceAsync(
            this.takerAddress,
            takerFeeAssetData,
        );
        expect(actTakerFeeAssetAllowanceOfTaker, 'takerFeeAssetAllowanceOfTaker').to.be.bignumber.equal(
            expTakerFeeAssetAllowanceOfTaker,
        );

        const actMakerFeeAssetBalanceOfFeeRecipient = await this.assetWrapper.getBalanceAsync(
            feeRecipient,
            makerFeeAssetData,
        );
        expect(actMakerFeeAssetBalanceOfFeeRecipient, 'makerFeeAssetBalanceOfFeeRecipient').to.be.bignumber.equal(
            expMakerFeeAssetBalanceOfFeeRecipient,
        );

        const actTakerFeeAssetBalanceOfFeeRecipient = await this.assetWrapper.getBalanceAsync(
            feeRecipient,
            takerFeeAssetData,
        );
        expect(actTakerFeeAssetBalanceOfFeeRecipient, 'takerFeeAssetBalanceOfFeeRecipient').to.be.bignumber.equal(
            expTakerFeeAssetBalanceOfFeeRecipient,
        );
    }

    private async _modifyTraderStateAsync(
        makerStateScenario: TraderStateScenario,
        takerStateScenario: TraderStateScenario,
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
    ): Promise<void> {
        const makerAssetFillAmount = orderUtils.getPartialAmountFloor(
            takerAssetFillAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerAssetAmount,
        );

        const makerFee = orderUtils.getPartialAmountFloor(
            takerAssetFillAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerFee,
        );

        const takerFee = orderUtils.getPartialAmountFloor(
            takerAssetFillAmount,
            signedOrder.takerAssetAmount,
            signedOrder.takerFee,
        );

        let makerAssetBalance;
        switch (makerStateScenario.traderAssetBalance) {
            case BalanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case BalanceAmountScenario.TooLow:
                if (makerAssetFillAmount.eq(0)) {
                    throw new Error(`Cannot set makerAssetBalanceOfMaker TooLow if makerAssetFillAmount is 0`);
                }
                makerAssetBalance = makerAssetFillAmount.minus(1);
                break;

            case BalanceAmountScenario.Exact:
                makerAssetBalance = makerAssetFillAmount;
                break;

            case BalanceAmountScenario.Zero:
                makerAssetBalance = constants.ZERO_AMOUNT;
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'makerStateScenario.traderAssetBalance',
                    makerStateScenario.traderAssetBalance,
                );
        }
        if (makerAssetBalance !== undefined) {
            await this.assetWrapper.setBalanceAsync(
                signedOrder.makerAddress,
                signedOrder.makerAssetData,
                makerAssetBalance,
            );
        }

        let takerAssetBalance;
        switch (takerStateScenario.traderAssetBalance) {
            case BalanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case BalanceAmountScenario.TooLow:
                if (takerAssetFillAmount.eq(0)) {
                    throw new Error(`Cannot set takerAssetBalanceOfTaker TooLow if takerAssetFillAmount is 0`);
                }
                takerAssetBalance = takerAssetFillAmount.minus(1);
                break;

            case BalanceAmountScenario.Exact:
                takerAssetBalance = takerAssetFillAmount;
                break;

            case BalanceAmountScenario.Zero:
                takerAssetBalance = constants.ZERO_AMOUNT;
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'takerStateScenario.traderAssetBalance',
                    takerStateScenario.traderAssetBalance,
                );
        }
        if (takerAssetBalance !== undefined) {
            await this.assetWrapper.setBalanceAsync(this.takerAddress, signedOrder.takerAssetData, takerAssetBalance);
        }

        let makerFeeBalance;
        switch (makerStateScenario.feeBalance) {
            case BalanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case BalanceAmountScenario.TooLow:
                if (makerFee.eq(0)) {
                    throw new Error(`Cannot set makerFeeBalanceOfMaker TooLow if makerFee is 0`);
                }
                makerFeeBalance = makerFee.minus(1);
                break;

            case BalanceAmountScenario.Exact:
                makerFeeBalance = makerFee;
                break;

            case BalanceAmountScenario.Zero:
                makerFeeBalance = constants.ZERO_AMOUNT;
                break;

            default:
                throw errorUtils.spawnSwitchErr('makerStateScenario.feeBalance', makerStateScenario.feeBalance);
        }
        if (makerFeeBalance !== undefined) {
            await this.assetWrapper.setBalanceAsync(
                signedOrder.makerAddress,
                signedOrder.makerFeeAssetData,
                makerFeeBalance,
            );
        }

        let takerFeeBalance;
        switch (takerStateScenario.feeBalance) {
            case BalanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case BalanceAmountScenario.TooLow:
                if (takerFee.eq(0)) {
                    throw new Error(`Cannot set takerFeeBalanceOfTaker TooLow if takerFee is 0`);
                }
                takerFeeBalance = takerFee.minus(1);
                break;

            case BalanceAmountScenario.Exact:
                takerFeeBalance = takerFee;
                break;

            case BalanceAmountScenario.Zero:
                takerFeeBalance = constants.ZERO_AMOUNT;
                break;

            default:
                throw errorUtils.spawnSwitchErr('takerStateScenario.feeBalance', takerStateScenario.feeBalance);
        }
        if (takerFeeBalance !== undefined) {
            await this.assetWrapper.setBalanceAsync(this.takerAddress, signedOrder.takerFeeAssetData, takerFeeBalance);
        }

        let makerAssetAllowance;
        switch (makerStateScenario.traderAssetAllowance) {
            case AllowanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case AllowanceAmountScenario.TooLow:
                makerAssetAllowance = makerAssetFillAmount.minus(1);
                break;

            case AllowanceAmountScenario.Exact:
                makerAssetAllowance = makerAssetFillAmount;
                break;

            case AllowanceAmountScenario.Unlimited:
                makerAssetAllowance = constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
                break;

            case AllowanceAmountScenario.Zero:
                makerAssetAllowance = constants.ZERO_AMOUNT;
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'makerStateScenario.traderAssetAllowance',
                    makerStateScenario.traderAssetAllowance,
                );
        }
        if (makerAssetAllowance !== undefined) {
            await this.assetWrapper.setProxyAllowanceAsync(
                signedOrder.makerAddress,
                signedOrder.makerAssetData,
                makerAssetAllowance,
            );
        }

        let takerAssetAllowance;
        switch (takerStateScenario.traderAssetAllowance) {
            case AllowanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case AllowanceAmountScenario.TooLow:
                takerAssetAllowance = takerAssetFillAmount.minus(1);
                break;

            case AllowanceAmountScenario.Exact:
                takerAssetAllowance = takerAssetFillAmount;
                break;

            case AllowanceAmountScenario.Unlimited:
                takerAssetAllowance = constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
                break;

            case AllowanceAmountScenario.Zero:
                takerAssetAllowance = constants.ZERO_AMOUNT;
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'takerStateScenario.traderAssetAllowance',
                    takerStateScenario.traderAssetAllowance,
                );
        }
        if (takerAssetAllowance !== undefined) {
            await this.assetWrapper.setProxyAllowanceAsync(
                this.takerAddress,
                signedOrder.takerAssetData,
                takerAssetAllowance,
            );
        }

        let makerFeeAllowance;
        switch (makerStateScenario.feeAllowance) {
            case AllowanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case AllowanceAmountScenario.TooLow:
                makerFeeAllowance = makerFee.minus(1);
                break;

            case AllowanceAmountScenario.Exact:
                makerFeeAllowance = makerFee;
                break;

            case AllowanceAmountScenario.Unlimited:
                makerFeeAllowance = constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
                break;

            case AllowanceAmountScenario.Zero:
                makerFeeAllowance = constants.ZERO_AMOUNT;
                break;

            default:
                throw errorUtils.spawnSwitchErr('makerStateScenario.feeAllowance', makerStateScenario.feeAllowance);
        }
        if (makerFeeAllowance !== undefined) {
            await this.assetWrapper.setProxyAllowanceAsync(
                signedOrder.makerAddress,
                signedOrder.makerFeeAssetData,
                makerFeeAllowance,
            );
        }

        let takerFeeAllowance;
        switch (takerStateScenario.feeAllowance) {
            case AllowanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case AllowanceAmountScenario.TooLow:
                takerFeeAllowance = takerFee.minus(1);
                break;

            case AllowanceAmountScenario.Exact:
                takerFeeAllowance = takerFee;
                break;

            case AllowanceAmountScenario.Unlimited:
                takerFeeAllowance = constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
                break;

            case AllowanceAmountScenario.Zero:
                takerFeeAllowance = constants.ZERO_AMOUNT;
                break;

            default:
                throw errorUtils.spawnSwitchErr('takerStateScenario.feeAllowance', takerStateScenario.feeAllowance);
        }
        if (takerFeeAllowance !== undefined) {
            await this.assetWrapper.setProxyAllowanceAsync(
                this.takerAddress,
                signedOrder.takerFeeAssetData,
                takerFeeAllowance,
            );
        }
    }
}

function getTakerAssetFillAmountAsync(
    signedOrder: SignedOrder,
    takerAssetFillAmountScenario: TakerAssetFillAmountScenario,
): BigNumber {
    let takerAssetFillAmount;
    switch (takerAssetFillAmountScenario) {
        case TakerAssetFillAmountScenario.Zero:
            takerAssetFillAmount = new BigNumber(0);
            break;

        case TakerAssetFillAmountScenario.ExactlyTakerAssetAmount:
            takerAssetFillAmount = signedOrder.takerAssetAmount;
            break;

        case TakerAssetFillAmountScenario.GreaterThanTakerAssetAmount:
            takerAssetFillAmount = signedOrder.takerAssetAmount.plus(1);
            break;

        case TakerAssetFillAmountScenario.LessThanTakerAssetAmount:
            const takerAssetProxyId = assetDataUtils.decodeAssetProxyId(signedOrder.takerAssetData);
            const makerAssetProxyId = assetDataUtils.decodeAssetProxyId(signedOrder.makerAssetData);
            const isEitherAssetERC721 =
                takerAssetProxyId === AssetProxyId.ERC721 || makerAssetProxyId === AssetProxyId.ERC721;
            if (isEitherAssetERC721) {
                throw new Error(
                    'Cannot test `TakerAssetFillAmountScenario.LessThanTakerAssetAmount` together with ERC721 assets since orders involving ERC721 must always be filled exactly.',
                );
            }
            takerAssetFillAmount = signedOrder.takerAssetAmount.div(2).integerValue(BigNumber.ROUND_FLOOR);
            break;

        default:
            throw errorUtils.spawnSwitchErr('TakerAssetFillAmountScenario', takerAssetFillAmountScenario);
    }

    return takerAssetFillAmount;
}

function fillErrorToRevertError(order: Order, error: FillOrderError): RevertError {
    const orderHash = orderHashUtils.getOrderHashHex(order);
    switch (error) {
        case FillOrderError.InvalidTaker:
            return new ExchangeRevertErrors.InvalidTakerError(orderHash);
        case FillOrderError.InvalidMakerAmount:
        case FillOrderError.OrderUnfillable:
            return new ExchangeRevertErrors.OrderStatusError(orderHash);
        case FillOrderError.InvalidTakerAmount:
            return new ExchangeRevertErrors.FillError(ExchangeRevertErrors.FillErrorCode.InvalidTakerAmount, orderHash);
        case FillOrderError.InvalidFillPrice:
            return new ExchangeRevertErrors.FillError(ExchangeRevertErrors.FillErrorCode.InvalidFillPrice, orderHash);
        case FillOrderError.TransferFailed:
            return new ExchangeRevertErrors.AssetProxyTransferError(
                orderHash,
                undefined,
                new StringRevertError(FillOrderError.TransferFailed).encode(),
            );
        default:
            return new StringRevertError(error);
    }
}

// tslint:disable:max-file-line-count
