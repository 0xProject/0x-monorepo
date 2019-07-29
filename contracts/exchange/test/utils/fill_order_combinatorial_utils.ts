import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { artifacts as libsArtifacts, TestLibsContract } from '@0x/contracts-exchange-libs';
import {
    AllowanceAmountScenario,
    AssetDataScenario,
    BalanceAmountScenario,
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    ExpirationTimeSecondsScenario,
    FeeRecipientAddressScenario,
    FillScenario,
    OrderAssetAmountScenario,
    orderUtils,
    signingUtils,
    TakerAssetFillAmountScenario,
    TakerScenario,
    TraderStateScenario,
    Web3ProviderEngine,
} from '@0x/contracts-test-utils';
import {
    assetDataUtils,
    BalanceAndProxyAllowanceLazyStore,
    ExchangeTransferSimulator,
    orderHashUtils,
    OrderStateUtils,
    OrderValidationUtils,
} from '@0x/order-utils';
import { AssetProxyId, RevertReason, SignatureType, SignedOrder } from '@0x/types';
import { BigNumber, errorUtils, logUtils, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs, TxData } from 'ethereum-types';
import * as _ from 'lodash';
import 'make-promises-safe';

import { artifacts, ExchangeContract, ExchangeFillEventArgs } from '../../src';

import { AssetWrapper } from './asset_wrapper';
import { dependencyArtifacts } from './dependency_artifacts';
import { ExchangeWrapper } from './exchange_wrapper';
import { OrderFactoryFromScenario } from './order_factory_from_scenario';
import { SimpleAssetBalanceAndProxyAllowanceFetcher } from './simple_asset_balance_and_proxy_allowance_fetcher';
import { SimpleOrderFilledCancelledFetcher } from './simple_order_filled_cancelled_fetcher';

chaiSetup.configure();
const expect = chai.expect;

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
    const erc20Wrapper = new ERC20Wrapper(provider, userAddresses, ownerAddress);
    const erc721Wrapper = new ERC721Wrapper(provider, userAddresses, ownerAddress);

    const erc20EighteenDecimalTokenCount = 3;
    const eighteenDecimals = new BigNumber(18);
    const [
        erc20EighteenDecimalTokenA,
        erc20EighteenDecimalTokenB,
        zrxToken,
    ] = await erc20Wrapper.deployDummyTokensAsync(erc20EighteenDecimalTokenCount, eighteenDecimals);
    const zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);

    const erc20FiveDecimalTokenCount = 2;
    const fiveDecimals = new BigNumber(5);
    const [erc20FiveDecimalTokenA, erc20FiveDecimalTokenB] = await erc20Wrapper.deployDummyTokensAsync(
        erc20FiveDecimalTokenCount,
        fiveDecimals,
    );
    const zeroDecimals = new BigNumber(0);
    const erc20ZeroDecimalTokenCount = 2;
    const [erc20ZeroDecimalTokenA, erc20ZeroDecimalTokenB] = await erc20Wrapper.deployDummyTokensAsync(
        erc20ZeroDecimalTokenCount,
        zeroDecimals,
    );
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
        dependencyArtifacts,
        zrxAssetData,
    );
    const exchangeWrapper = new ExchangeWrapper(exchangeContract, provider);
    await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, ownerAddress);
    await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, ownerAddress);

    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeContract.address, {
            from: ownerAddress,
        }),
        constants.AWAIT_TRANSACTION_MINED_MS,
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeContract.address, {
            from: ownerAddress,
        }),
        constants.AWAIT_TRANSACTION_MINED_MS,
    );

    const orderFactory = new OrderFactoryFromScenario(
        userAddresses,
        zrxToken.address,
        [erc20EighteenDecimalTokenA.address, erc20EighteenDecimalTokenB.address],
        [erc20FiveDecimalTokenA.address, erc20FiveDecimalTokenB.address],
        [erc20ZeroDecimalTokenA.address, erc20ZeroDecimalTokenB.address],
        erc721Token,
        erc721Balances,
        exchangeContract.address,
    );

    const testLibsContract = await TestLibsContract.deployFrom0xArtifactAsync(
        libsArtifacts.TestLibs,
        provider,
        txDefaults,
        dependencyArtifacts,
    );

    const fillOrderCombinatorialUtils = new FillOrderCombinatorialUtils(
        orderFactory,
        ownerAddress,
        makerAddress,
        makerPrivateKey,
        takerAddress,
        zrxAssetData,
        exchangeWrapper,
        assetWrapper,
        testLibsContract,
    );
    return fillOrderCombinatorialUtils;
}

export class FillOrderCombinatorialUtils {
    public orderFactory: OrderFactoryFromScenario;
    public ownerAddress: string;
    public makerAddress: string;
    public makerPrivateKey: Buffer;
    public takerAddress: string;
    public zrxAssetData: string;
    public exchangeWrapper: ExchangeWrapper;
    public assetWrapper: AssetWrapper;
    public testLibsContract: TestLibsContract;
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
            ExpirationTimeSecondsScenario.InPast,
        ];
        const makerAssetDataScenario = [
            AssetDataScenario.ERC20FiveDecimals,
            AssetDataScenario.ERC20NonZRXEighteenDecimals,
            AssetDataScenario.ERC721,
            AssetDataScenario.ZRXFeeToken,
        ];
        const takerAssetDataScenario = [
            AssetDataScenario.ERC20FiveDecimals,
            AssetDataScenario.ERC20NonZRXEighteenDecimals,
            AssetDataScenario.ERC721,
            AssetDataScenario.ZRXFeeToken,
        ];
        const takerAssetFillAmountScenario = [
            TakerAssetFillAmountScenario.ExactlyRemainingFillableTakerAssetAmount,
            // TakerAssetFillAmountScenario.GreaterThanRemainingFillableTakerAssetAmount,
            // TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
        ];
        const makerAssetBalanceScenario = [
            BalanceAmountScenario.Higher,
            // BalanceAmountScenario.Exact,
            // BalanceAmountScenario.TooLow,
        ];
        const makerAssetAllowanceScenario = [
            AllowanceAmountScenario.Higher,
            // AllowanceAmountScenario.Exact,
            // AllowanceAmountScenario.TooLow,
            // AllowanceAmountScenario.Unlimited,
        ];
        const makerZRXBalanceScenario = [
            BalanceAmountScenario.Higher,
            // BalanceAmountScenario.Exact,
            // BalanceAmountScenario.TooLow,
        ];
        const makerZRXAllowanceScenario = [
            AllowanceAmountScenario.Higher,
            // AllowanceAmountScenario.Exact,
            // AllowanceAmountScenario.TooLow,
            // AllowanceAmountScenario.Unlimited,
        ];
        const takerAssetBalanceScenario = [
            BalanceAmountScenario.Higher,
            // BalanceAmountScenario.Exact,
            // BalanceAmountScenario.TooLow,
        ];
        const takerAssetAllowanceScenario = [
            AllowanceAmountScenario.Higher,
            // AllowanceAmountScenario.Exact,
            // AllowanceAmountScenario.TooLow,
            // AllowanceAmountScenario.Unlimited,
        ];
        const takerZRXBalanceScenario = [
            BalanceAmountScenario.Higher,
            // BalanceAmountScenario.Exact,
            // BalanceAmountScenario.TooLow,
        ];
        const takerZRXAllowanceScenario = [
            AllowanceAmountScenario.Higher,
            // AllowanceAmountScenario.Exact,
            // AllowanceAmountScenario.TooLow,
            // AllowanceAmountScenario.Unlimited,
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
            takerAssetFillAmountScenario,
            makerAssetBalanceScenario,
            makerAssetAllowanceScenario,
            makerZRXBalanceScenario,
            makerZRXAllowanceScenario,
            takerAssetBalanceScenario,
            takerAssetAllowanceScenario,
            takerZRXBalanceScenario,
            takerZRXAllowanceScenario,
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
                },
                takerAssetFillAmountScenario: fillScenarioArray[9] as TakerAssetFillAmountScenario,
                makerStateScenario: {
                    traderAssetBalance: fillScenarioArray[10] as BalanceAmountScenario,
                    traderAssetAllowance: fillScenarioArray[11] as AllowanceAmountScenario,
                    zrxFeeBalance: fillScenarioArray[12] as BalanceAmountScenario,
                    zrxFeeAllowance: fillScenarioArray[13] as AllowanceAmountScenario,
                },
                takerStateScenario: {
                    traderAssetBalance: fillScenarioArray[14] as BalanceAmountScenario,
                    traderAssetAllowance: fillScenarioArray[15] as AllowanceAmountScenario,
                    zrxFeeBalance: fillScenarioArray[16] as BalanceAmountScenario,
                    zrxFeeAllowance: fillScenarioArray[17] as AllowanceAmountScenario,
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
        orderFactory: OrderFactoryFromScenario,
        ownerAddress: string,
        makerAddress: string,
        makerPrivateKey: Buffer,
        takerAddress: string,
        zrxAssetData: string,
        exchangeWrapper: ExchangeWrapper,
        assetWrapper: AssetWrapper,
        testLibsContract: TestLibsContract,
    ) {
        this.orderFactory = orderFactory;
        this.ownerAddress = ownerAddress;
        this.makerAddress = makerAddress;
        this.makerPrivateKey = makerPrivateKey;
        this.takerAddress = takerAddress;
        this.zrxAssetData = zrxAssetData;
        this.exchangeWrapper = exchangeWrapper;
        this.assetWrapper = assetWrapper;
        this.testLibsContract = testLibsContract;
    }
    public async testFillOrderScenarioAsync(
        provider: Web3ProviderEngine,
        fillScenario: FillScenario,
        isVerbose: boolean = false,
    ): Promise<void> {
        // 1. Generate order
        const order = this.orderFactory.generateOrder(fillScenario.orderScenario);

        // 2. Sign order
        const orderHashBuff = orderHashUtils.getOrderHashBuffer(order);
        const signature = signingUtils.signMessage(orderHashBuff, this.makerPrivateKey, SignatureType.EthSign);
        const signedOrder = {
            ...order,
            signature: `0x${signature.toString('hex')}`,
        };

        const balanceAndProxyAllowanceFetcher = new SimpleAssetBalanceAndProxyAllowanceFetcher(this.assetWrapper);
        const orderFilledCancelledFetcher = new SimpleOrderFilledCancelledFetcher(
            this.exchangeWrapper,
            this.zrxAssetData,
        );

        // 3. Figure out fill amount
        const takerAssetFillAmount = await this._getTakerAssetFillAmountAsync(
            signedOrder,
            fillScenario.takerAssetFillAmountScenario,
            balanceAndProxyAllowanceFetcher,
            orderFilledCancelledFetcher,
        );

        // 4. Permutate the maker and taker balance/allowance scenarios
        await this._modifyTraderStateAsync(
            fillScenario.makerStateScenario,
            fillScenario.takerStateScenario,
            signedOrder,
            takerAssetFillAmount,
        );

        // 5. If I fill it by X, what are the resulting balances/allowances/filled amounts expected?
        const orderValidationUtils = new OrderValidationUtils(orderFilledCancelledFetcher, provider);
        const lazyStore = new BalanceAndProxyAllowanceLazyStore(balanceAndProxyAllowanceFetcher);
        const exchangeTransferSimulator = new ExchangeTransferSimulator(lazyStore);

        let fillRevertReasonIfExists;
        try {
            await orderValidationUtils.validateFillOrderThrowIfInvalidAsync(
                exchangeTransferSimulator,
                provider,
                signedOrder,
                takerAssetFillAmount,
                this.takerAddress,
                this.zrxAssetData,
            );
            if (isVerbose) {
                logUtils.log(`Expecting fillOrder to succeed.`);
            }
        } catch (err) {
            fillRevertReasonIfExists = err.message;
            if (isVerbose) {
                logUtils.log(`Expecting fillOrder to fail with:`);
                logUtils.log(err);
            }
        }

        // 6. Fill the order
        await this._fillOrderAndAssertOutcomeAsync(
            signedOrder,
            takerAssetFillAmount,
            lazyStore,
            fillRevertReasonIfExists,
        );

        await this._abiEncodeFillOrderAndAssertOutcomeAsync(signedOrder, takerAssetFillAmount);
    }
    private async _fillOrderAndAssertOutcomeAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
        lazyStore: BalanceAndProxyAllowanceLazyStore,
        fillRevertReasonIfExists: RevertReason | undefined,
    ): Promise<void> {
        if (fillRevertReasonIfExists !== undefined) {
            return expectTransactionFailedAsync(
                this.exchangeWrapper.fillOrderAsync(signedOrder, this.takerAddress, { takerAssetFillAmount }),
                fillRevertReasonIfExists,
            );
        }

        const makerAddress = signedOrder.makerAddress;
        const makerAssetData = signedOrder.makerAssetData;
        const takerAssetData = signedOrder.takerAssetData;
        const feeRecipient = signedOrder.feeRecipientAddress;

        const expMakerAssetBalanceOfMaker = await lazyStore.getBalanceAsync(makerAssetData, makerAddress);
        const expMakerAssetAllowanceOfMaker = await lazyStore.getProxyAllowanceAsync(makerAssetData, makerAddress);
        const expTakerAssetBalanceOfMaker = await lazyStore.getBalanceAsync(takerAssetData, makerAddress);
        const expZRXAssetBalanceOfMaker = await lazyStore.getBalanceAsync(this.zrxAssetData, makerAddress);
        const expZRXAssetAllowanceOfMaker = await lazyStore.getProxyAllowanceAsync(this.zrxAssetData, makerAddress);
        const expTakerAssetBalanceOfTaker = await lazyStore.getBalanceAsync(takerAssetData, this.takerAddress);
        const expTakerAssetAllowanceOfTaker = await lazyStore.getProxyAllowanceAsync(takerAssetData, this.takerAddress);
        const expMakerAssetBalanceOfTaker = await lazyStore.getBalanceAsync(makerAssetData, this.takerAddress);
        const expZRXAssetBalanceOfTaker = await lazyStore.getBalanceAsync(this.zrxAssetData, this.takerAddress);
        const expZRXAssetAllowanceOfTaker = await lazyStore.getProxyAllowanceAsync(
            this.zrxAssetData,
            this.takerAddress,
        );
        const expZRXAssetBalanceOfFeeRecipient = await lazyStore.getBalanceAsync(this.zrxAssetData, feeRecipient);

        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const alreadyFilledTakerAmount = await this.exchangeWrapper.getTakerAssetFilledAmountAsync(orderHash);
        const remainingTakerAmountToFill = signedOrder.takerAssetAmount.minus(alreadyFilledTakerAmount);
        const expFilledTakerAmount = takerAssetFillAmount.gt(remainingTakerAmountToFill)
            ? remainingTakerAmountToFill
            : alreadyFilledTakerAmount.plus(takerAssetFillAmount);

        const expFilledMakerAmount = orderUtils.getPartialAmountFloor(
            expFilledTakerAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerAssetAmount,
        );
        const expMakerFeePaid = orderUtils.getPartialAmountFloor(
            expFilledTakerAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerFee,
        );
        const expTakerFeePaid = orderUtils.getPartialAmountFloor(
            expFilledTakerAmount,
            signedOrder.takerAssetAmount,
            signedOrder.takerFee,
        );
        const fillResults = await this.exchangeWrapper.getFillOrderResultsAsync(signedOrder, this.takerAddress, {
            takerAssetFillAmount,
        });
        expect(fillResults.takerAssetFilledAmount).to.be.bignumber.equal(
            expFilledTakerAmount,
            'takerAssetFilledAmount',
        );
        expect(fillResults.makerAssetFilledAmount).to.be.bignumber.equal(
            expFilledMakerAmount,
            'makerAssetFilledAmount',
        );
        expect(fillResults.takerFeePaid).to.be.bignumber.equal(expTakerFeePaid, 'takerFeePaid');
        expect(fillResults.makerFeePaid).to.be.bignumber.equal(expMakerFeePaid, 'makerFeePaid');

        // - Let's fill the order!
        const txReceipt = await this.exchangeWrapper.fillOrderAsync(signedOrder, this.takerAddress, {
            takerAssetFillAmount,
        });

        const actFilledTakerAmount = await this.exchangeWrapper.getTakerAssetFilledAmountAsync(orderHash);
        expect(actFilledTakerAmount).to.be.bignumber.equal(expFilledTakerAmount, 'filledTakerAmount');

        const exchangeLogs = _.filter(
            txReceipt.logs,
            txLog => txLog.address === this.exchangeWrapper.getExchangeAddress(),
        );
        expect(exchangeLogs.length).to.be.equal(1, 'logs length');
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const log = txReceipt.logs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>;
        expect(log.args.makerAddress).to.be.equal(makerAddress, 'log.args.makerAddress');
        expect(log.args.takerAddress).to.be.equal(this.takerAddress, 'log.args.this.takerAddress');
        expect(log.args.feeRecipientAddress).to.be.equal(feeRecipient, 'log.args.feeRecipientAddress');
        expect(log.args.makerAssetFilledAmount).to.be.bignumber.equal(
            expFilledMakerAmount,
            'log.args.makerAssetFilledAmount',
        );
        expect(log.args.takerAssetFilledAmount).to.be.bignumber.equal(
            expFilledTakerAmount,
            'log.args.takerAssetFilledAmount',
        );
        expect(log.args.makerFeePaid).to.be.bignumber.equal(expMakerFeePaid, 'log.args.makerFeePaid');
        expect(log.args.takerFeePaid).to.be.bignumber.equal(expTakerFeePaid, 'logs.args.takerFeePaid');
        expect(log.args.orderHash).to.be.equal(orderHash, 'log.args.orderHash');
        expect(log.args.makerAssetData).to.be.equal(makerAssetData, 'log.args.makerAssetData');
        expect(log.args.takerAssetData).to.be.equal(takerAssetData, 'log.args.takerAssetData');

        const actMakerAssetBalanceOfMaker = await this.assetWrapper.getBalanceAsync(makerAddress, makerAssetData);
        expect(actMakerAssetBalanceOfMaker).to.be.bignumber.equal(
            expMakerAssetBalanceOfMaker,
            'makerAssetBalanceOfMaker',
        );

        const actMakerAssetAllowanceOfMaker = await this.assetWrapper.getProxyAllowanceAsync(
            makerAddress,
            makerAssetData,
        );
        expect(actMakerAssetAllowanceOfMaker).to.be.bignumber.equal(
            expMakerAssetAllowanceOfMaker,
            'makerAssetAllowanceOfMaker',
        );

        const actTakerAssetBalanceOfMaker = await this.assetWrapper.getBalanceAsync(makerAddress, takerAssetData);
        expect(actTakerAssetBalanceOfMaker).to.be.bignumber.equal(
            expTakerAssetBalanceOfMaker,
            'takerAssetBalanceOfMaker',
        );

        const actZRXAssetBalanceOfMaker = await this.assetWrapper.getBalanceAsync(makerAddress, this.zrxAssetData);
        expect(actZRXAssetBalanceOfMaker).to.be.bignumber.equal(expZRXAssetBalanceOfMaker, 'ZRXAssetBalanceOfMaker');

        const actZRXAssetAllowanceOfMaker = await this.assetWrapper.getProxyAllowanceAsync(
            makerAddress,
            this.zrxAssetData,
        );
        expect(actZRXAssetAllowanceOfMaker).to.be.bignumber.equal(
            expZRXAssetAllowanceOfMaker,
            'ZRXAssetAllowanceOfMaker',
        );

        const actTakerAssetBalanceOfTaker = await this.assetWrapper.getBalanceAsync(this.takerAddress, takerAssetData);
        expect(actTakerAssetBalanceOfTaker).to.be.bignumber.equal(
            expTakerAssetBalanceOfTaker,
            'TakerAssetBalanceOfTaker',
        );

        const actTakerAssetAllowanceOfTaker = await this.assetWrapper.getProxyAllowanceAsync(
            this.takerAddress,
            takerAssetData,
        );

        expect(actTakerAssetAllowanceOfTaker).to.be.bignumber.equal(
            expTakerAssetAllowanceOfTaker,
            'TakerAssetAllowanceOfTaker',
        );

        const actMakerAssetBalanceOfTaker = await this.assetWrapper.getBalanceAsync(this.takerAddress, makerAssetData);
        expect(actMakerAssetBalanceOfTaker).to.be.bignumber.equal(
            expMakerAssetBalanceOfTaker,
            'MakerAssetBalanceOfTaker',
        );

        const actZRXAssetBalanceOfTaker = await this.assetWrapper.getBalanceAsync(this.takerAddress, this.zrxAssetData);
        expect(actZRXAssetBalanceOfTaker).to.be.bignumber.equal(expZRXAssetBalanceOfTaker, 'ZRXAssetBalanceOfTaker');

        const actZRXAssetAllowanceOfTaker = await this.assetWrapper.getProxyAllowanceAsync(
            this.takerAddress,
            this.zrxAssetData,
        );
        expect(actZRXAssetAllowanceOfTaker).to.be.bignumber.equal(
            expZRXAssetAllowanceOfTaker,
            'ZRXAssetAllowanceOfTaker',
        );

        const actZRXAssetBalanceOfFeeRecipient = await this.assetWrapper.getBalanceAsync(
            feeRecipient,
            this.zrxAssetData,
        );
        expect(actZRXAssetBalanceOfFeeRecipient).to.be.bignumber.equal(
            expZRXAssetBalanceOfFeeRecipient,
            'ZRXAssetBalanceOfFeeRecipient',
        );
    }
    private async _abiEncodeFillOrderAndAssertOutcomeAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
    ): Promise<void> {
        const params = orderUtils.createFill(signedOrder, takerAssetFillAmount);
        const abiDataEncodedByContract = await this.testLibsContract.publicAbiEncodeFillOrder.callAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
        );
        const paramsDecodedByClient = this.exchangeWrapper.abiDecodeFillOrder(abiDataEncodedByContract);
        expect(paramsDecodedByClient).to.be.deep.equal(params, 'ABIEncodedFillOrderData');
    }
    private async _getTakerAssetFillAmountAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmountScenario: TakerAssetFillAmountScenario,
        balanceAndProxyAllowanceFetcher: SimpleAssetBalanceAndProxyAllowanceFetcher,
        orderFilledCancelledFetcher: SimpleOrderFilledCancelledFetcher,
    ): Promise<BigNumber> {
        const orderStateUtils = new OrderStateUtils(balanceAndProxyAllowanceFetcher, orderFilledCancelledFetcher);
        const fillableTakerAssetAmount = await orderStateUtils.getMaxFillableTakerAssetAmountAsync(
            signedOrder,
            this.takerAddress,
        );

        let takerAssetFillAmount;
        switch (takerAssetFillAmountScenario) {
            case TakerAssetFillAmountScenario.Zero:
                takerAssetFillAmount = new BigNumber(0);
                break;

            case TakerAssetFillAmountScenario.ExactlyRemainingFillableTakerAssetAmount:
                takerAssetFillAmount = fillableTakerAssetAmount;
                break;

            case TakerAssetFillAmountScenario.GreaterThanRemainingFillableTakerAssetAmount:
                takerAssetFillAmount = fillableTakerAssetAmount.plus(1);
                break;

            case TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount:
                const takerAssetProxyId = assetDataUtils.decodeAssetProxyId(signedOrder.takerAssetData);
                const makerAssetProxyId = assetDataUtils.decodeAssetProxyId(signedOrder.makerAssetData);
                const isEitherAssetERC721 =
                    takerAssetProxyId === AssetProxyId.ERC721 || makerAssetProxyId === AssetProxyId.ERC721;
                if (isEitherAssetERC721) {
                    throw new Error(
                        'Cannot test `TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount` together with ERC721 assets since orders involving ERC721 must always be filled exactly.',
                    );
                }
                takerAssetFillAmount = fillableTakerAssetAmount.div(2).integerValue(BigNumber.ROUND_FLOOR);
                break;

            default:
                throw errorUtils.spawnSwitchErr('TakerAssetFillAmountScenario', takerAssetFillAmountScenario);
        }

        return takerAssetFillAmount;
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
        switch (makerStateScenario.traderAssetBalance) {
            case BalanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case BalanceAmountScenario.TooLow:
                if (makerAssetFillAmount.eq(0)) {
                    throw new Error(`Cannot set makerAssetBalanceOfMaker TooLow if makerAssetFillAmount is 0`);
                }
                const tooLowBalance = makerAssetFillAmount.minus(1);
                await this.assetWrapper.setBalanceAsync(
                    signedOrder.makerAddress,
                    signedOrder.makerAssetData,
                    tooLowBalance,
                );
                break;

            case BalanceAmountScenario.Exact:
                const exactBalance = makerAssetFillAmount;
                await this.assetWrapper.setBalanceAsync(
                    signedOrder.makerAddress,
                    signedOrder.makerAssetData,
                    exactBalance,
                );
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'makerStateScenario.traderAssetBalance',
                    makerStateScenario.traderAssetBalance,
                );
        }

        const makerFee = orderUtils.getPartialAmountFloor(
            takerAssetFillAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerFee,
        );
        switch (makerStateScenario.zrxFeeBalance) {
            case BalanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case BalanceAmountScenario.TooLow:
                if (makerFee.eq(0)) {
                    throw new Error(`Cannot set zrxAsserBalanceOfMaker TooLow if makerFee is 0`);
                }
                const tooLowBalance = makerFee.minus(1);
                await this.assetWrapper.setBalanceAsync(signedOrder.makerAddress, this.zrxAssetData, tooLowBalance);
                break;

            case BalanceAmountScenario.Exact:
                const exactBalance = makerFee;
                await this.assetWrapper.setBalanceAsync(signedOrder.makerAddress, this.zrxAssetData, exactBalance);
                break;

            default:
                throw errorUtils.spawnSwitchErr('makerStateScenario.zrxFeeBalance', makerStateScenario.zrxFeeBalance);
        }

        switch (makerStateScenario.traderAssetAllowance) {
            case AllowanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case AllowanceAmountScenario.TooLow:
                const tooLowAllowance = makerAssetFillAmount.minus(1);
                await this.assetWrapper.setProxyAllowanceAsync(
                    signedOrder.makerAddress,
                    signedOrder.makerAssetData,
                    tooLowAllowance,
                );
                break;

            case AllowanceAmountScenario.Exact:
                const exactAllowance = makerAssetFillAmount;
                await this.assetWrapper.setProxyAllowanceAsync(
                    signedOrder.makerAddress,
                    signedOrder.makerAssetData,
                    exactAllowance,
                );
                break;

            case AllowanceAmountScenario.Unlimited:
                await this.assetWrapper.setProxyAllowanceAsync(
                    signedOrder.makerAddress,
                    signedOrder.makerAssetData,
                    constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
                );
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'makerStateScenario.traderAssetAllowance',
                    makerStateScenario.traderAssetAllowance,
                );
        }

        switch (makerStateScenario.zrxFeeAllowance) {
            case AllowanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case AllowanceAmountScenario.TooLow:
                const tooLowAllowance = makerFee.minus(1);
                await this.assetWrapper.setProxyAllowanceAsync(
                    signedOrder.makerAddress,
                    this.zrxAssetData,
                    tooLowAllowance,
                );
                break;

            case AllowanceAmountScenario.Exact:
                const exactAllowance = makerFee;
                await this.assetWrapper.setProxyAllowanceAsync(
                    signedOrder.makerAddress,
                    this.zrxAssetData,
                    exactAllowance,
                );
                break;

            case AllowanceAmountScenario.Unlimited:
                await this.assetWrapper.setProxyAllowanceAsync(
                    signedOrder.makerAddress,
                    this.zrxAssetData,
                    constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
                );
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'makerStateScenario.zrxFeeAllowance',
                    makerStateScenario.zrxFeeAllowance,
                );
        }

        switch (takerStateScenario.traderAssetBalance) {
            case BalanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case BalanceAmountScenario.TooLow:
                if (takerAssetFillAmount.eq(0)) {
                    throw new Error(`Cannot set takerAssetBalanceOfTaker TooLow if takerAssetFillAmount is 0`);
                }
                const tooLowBalance = takerAssetFillAmount.minus(1);
                await this.assetWrapper.setBalanceAsync(this.takerAddress, signedOrder.takerAssetData, tooLowBalance);
                break;

            case BalanceAmountScenario.Exact:
                const exactBalance = takerAssetFillAmount;
                await this.assetWrapper.setBalanceAsync(this.takerAddress, signedOrder.takerAssetData, exactBalance);
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'takerStateScenario.traderAssetBalance',
                    takerStateScenario.traderAssetBalance,
                );
        }

        const takerFee = orderUtils.getPartialAmountFloor(
            takerAssetFillAmount,
            signedOrder.takerAssetAmount,
            signedOrder.takerFee,
        );
        switch (takerStateScenario.zrxFeeBalance) {
            case BalanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case BalanceAmountScenario.TooLow:
                if (takerFee.eq(0)) {
                    throw new Error(`Cannot set zrxAssetBalanceOfTaker TooLow if takerFee is 0`);
                }
                const tooLowBalance = takerFee.minus(1);
                await this.assetWrapper.setBalanceAsync(this.takerAddress, this.zrxAssetData, tooLowBalance);
                break;

            case BalanceAmountScenario.Exact:
                const exactBalance = takerFee;
                await this.assetWrapper.setBalanceAsync(this.takerAddress, this.zrxAssetData, exactBalance);
                break;

            default:
                throw errorUtils.spawnSwitchErr('takerStateScenario.zrxFeeBalance', takerStateScenario.zrxFeeBalance);
        }

        switch (takerStateScenario.traderAssetAllowance) {
            case AllowanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case AllowanceAmountScenario.TooLow:
                const tooLowAllowance = takerAssetFillAmount.minus(1);
                await this.assetWrapper.setProxyAllowanceAsync(
                    this.takerAddress,
                    signedOrder.takerAssetData,
                    tooLowAllowance,
                );
                break;

            case AllowanceAmountScenario.Exact:
                const exactAllowance = takerAssetFillAmount;
                await this.assetWrapper.setProxyAllowanceAsync(
                    this.takerAddress,
                    signedOrder.takerAssetData,
                    exactAllowance,
                );
                break;

            case AllowanceAmountScenario.Unlimited:
                await this.assetWrapper.setProxyAllowanceAsync(
                    this.takerAddress,
                    signedOrder.takerAssetData,
                    constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
                );
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'takerStateScenario.traderAssetAllowance',
                    takerStateScenario.traderAssetAllowance,
                );
        }

        switch (takerStateScenario.zrxFeeAllowance) {
            case AllowanceAmountScenario.Higher:
                break; // Noop since this is already the default

            case AllowanceAmountScenario.TooLow:
                const tooLowAllowance = takerFee.minus(1);
                await this.assetWrapper.setProxyAllowanceAsync(this.takerAddress, this.zrxAssetData, tooLowAllowance);
                break;

            case AllowanceAmountScenario.Exact:
                const exactAllowance = takerFee;
                await this.assetWrapper.setProxyAllowanceAsync(this.takerAddress, this.zrxAssetData, exactAllowance);
                break;

            case AllowanceAmountScenario.Unlimited:
                await this.assetWrapper.setProxyAllowanceAsync(
                    this.takerAddress,
                    this.zrxAssetData,
                    constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
                );
                break;

            default:
                throw errorUtils.spawnSwitchErr(
                    'takerStateScenario.zrxFeeAllowance',
                    takerStateScenario.zrxFeeAllowance,
                );
        }
    }
} // tslint:disable:max-file-line-count
