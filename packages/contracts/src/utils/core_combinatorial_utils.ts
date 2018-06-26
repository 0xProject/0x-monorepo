import {
    assetProxyUtils,
    BalanceAndProxyAllowanceLazyStore,
    ExchangeTransferSimulator,
    orderHashUtils,
    OrderStateUtils,
    OrderValidationUtils,
} from '@0xproject/order-utils';
import { AssetProxyId, SignatureType, SignedOrder } from '@0xproject/types';
import { BigNumber, errorUtils, logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs, Provider, TxData } from 'ethereum-types';
import * as _ from 'lodash';
import 'make-promises-safe';

import { ExchangeContract, FillContractEventArgs } from '../generated_contract_wrappers/exchange';
import { artifacts } from '../utils/artifacts';
import { expectRevertReasonOrAlwaysFailingTransactionAsync } from '../utils/assertions';
import { AssetWrapper } from '../utils/asset_wrapper';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ERC721Wrapper } from '../utils/erc721_wrapper';
import { ExchangeWrapper } from '../utils/exchange_wrapper';
import { OrderFactoryFromScenario } from '../utils/order_factory_from_scenario';
import { orderUtils } from '../utils/order_utils';
import { signingUtils } from '../utils/signing_utils';
import { SimpleAssetBalanceAndProxyAllowanceFetcher } from '../utils/simple_asset_balance_and_proxy_allowance_fetcher';
import { SimpleOrderFilledCancelledFetcher } from '../utils/simple_order_filled_cancelled_fetcher';
import {
    AllowanceAmountScenario,
    AssetDataScenario,
    BalanceAmountScenario,
    ExpirationTimeSecondsScenario,
    FeeRecipientAddressScenario,
    FillScenario,
    OrderAssetAmountScenario,
    TakerAssetFillAmountScenario,
    TakerScenario,
    TraderStateScenario,
} from '../utils/types';

chaiSetup.configure();
const expect = chai.expect;

/**
 * Instantiates a new instance of CoreCombinatorialUtils. Since this method has some
 * required async setup, a factory method is required.
 * @param web3Wrapper Web3Wrapper instance
 * @param txDefaults Default Ethereum tx options
 * @return CoreCombinatorialUtils instance
 */
export async function coreCombinatorialUtilsFactoryAsync(
    web3Wrapper: Web3Wrapper,
    txDefaults: Partial<TxData>,
): Promise<CoreCombinatorialUtils> {
    const userAddresses = await web3Wrapper.getAvailableAddressesAsync();
    const [ownerAddress, makerAddress, takerAddress] = userAddresses;
    const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];

    const provider = web3Wrapper.getProvider();
    const erc20Wrapper = new ERC20Wrapper(provider, userAddresses, ownerAddress);
    const erc721Wrapper = new ERC721Wrapper(provider, userAddresses, ownerAddress);

    const erc20EighteenDecimalTokenCount = 3;
    const eighteenDecimals = new BigNumber(18);
    const [
        erc20EighteenDecimalTokenA,
        erc20EighteenDecimalTokenB,
        zrxToken,
    ] = await erc20Wrapper.deployDummyTokensAsync(erc20EighteenDecimalTokenCount, eighteenDecimals);
    const zrxAssetData = assetProxyUtils.encodeERC20AssetData(zrxToken.address);

    const erc20FiveDecimalTokenCount = 2;
    const fiveDecimals = new BigNumber(18);
    const [erc20FiveDecimalTokenA, erc20FiveDecimalTokenB] = await erc20Wrapper.deployDummyTokensAsync(
        erc20FiveDecimalTokenCount,
        fiveDecimals,
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
        zrxAssetData,
    );
    const exchangeWrapper = new ExchangeWrapper(exchangeContract, provider);
    await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC20, erc20Proxy.address, ownerAddress);
    await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC721, erc721Proxy.address, ownerAddress);

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
        erc721Token,
        erc721Balances,
        exchangeContract.address,
    );

    const coreCombinatorialUtils = new CoreCombinatorialUtils(
        orderFactory,
        ownerAddress,
        makerAddress,
        makerPrivateKey,
        takerAddress,
        zrxAssetData,
        exchangeWrapper,
        assetWrapper,
    );
    return coreCombinatorialUtils;
}

export class CoreCombinatorialUtils {
    public orderFactory: OrderFactoryFromScenario;
    public ownerAddress: string;
    public makerAddress: string;
    public makerPrivateKey: Buffer;
    public takerAddress: string;
    public zrxAssetData: string;
    public exchangeWrapper: ExchangeWrapper;
    public assetWrapper: AssetWrapper;
    public static generateFillOrderCombinations(): FillScenario[] {
        const takerScenarios = [TakerScenario.Unspecified];
        const feeRecipientScenarios = [FeeRecipientAddressScenario.EthUserAddress];
        const makerAssetAmountScenario = [OrderAssetAmountScenario.Large];
        const takerAssetAmountScenario = [OrderAssetAmountScenario.Large];
        const makerFeeScenario = [OrderAssetAmountScenario.Large];
        const takerFeeScenario = [OrderAssetAmountScenario.Large];
        const expirationTimeSecondsScenario = [ExpirationTimeSecondsScenario.InFuture];
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
        const takerAssetFillAmountScenario = [TakerAssetFillAmountScenario.ExactlyRemainingFillableTakerAssetAmount];
        const fillScenarioArrays = CoreCombinatorialUtils._getAllCombinations([
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
        ]);

        const fillScenarios = _.map(fillScenarioArrays, fillScenarioArray => {
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
                    traderAssetBalance: BalanceAmountScenario.Higher,
                    traderAssetAllowance: AllowanceAmountScenario.Higher,
                    zrxFeeBalance: BalanceAmountScenario.Higher,
                    zrxFeeAllowance: AllowanceAmountScenario.Higher,
                },
                takerStateScenario: {
                    traderAssetBalance: BalanceAmountScenario.Higher,
                    traderAssetAllowance: AllowanceAmountScenario.Higher,
                    zrxFeeBalance: BalanceAmountScenario.Higher,
                    zrxFeeAllowance: AllowanceAmountScenario.Higher,
                },
            };
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
            const allCombinationsOfRemaining = CoreCombinatorialUtils._getAllCombinations(restOfArrays); // recur with the rest of array
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
    ) {
        this.orderFactory = orderFactory;
        this.ownerAddress = ownerAddress;
        this.makerAddress = makerAddress;
        this.makerPrivateKey = makerPrivateKey;
        this.takerAddress = takerAddress;
        this.zrxAssetData = zrxAssetData;
        this.exchangeWrapper = exchangeWrapper;
        this.assetWrapper = assetWrapper;
    }
    public async testFillOrderScenarioAsync(
        provider: Provider,
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
        const orderValidationUtils = new OrderValidationUtils(orderFilledCancelledFetcher);
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
    }
    private async _fillOrderAndAssertOutcomeAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
        lazyStore: BalanceAndProxyAllowanceLazyStore,
        fillRevertReasonIfExists: string | undefined,
    ): Promise<void> {
        if (!_.isUndefined(fillRevertReasonIfExists)) {
            return expectRevertReasonOrAlwaysFailingTransactionAsync(
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
            : alreadyFilledTakerAmount.add(takerAssetFillAmount);

        const expFilledMakerAmount = orderUtils.getPartialAmount(
            expFilledTakerAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerAssetAmount,
        );

        // - Let's fill the order!
        const txReceipt = await this.exchangeWrapper.fillOrderAsync(signedOrder, this.takerAddress, {
            takerAssetFillAmount,
        });

        const actFilledTakerAmount = await this.exchangeWrapper.getTakerAssetFilledAmountAsync(orderHash);
        expect(actFilledTakerAmount).to.be.bignumber.equal(expFilledTakerAmount, 'filledTakerAmount');

        expect(txReceipt.logs.length).to.be.equal(1, 'logs length');
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const log = txReceipt.logs[0] as LogWithDecodedArgs<FillContractEventArgs>;
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
        const expMakerFeePaid = orderUtils.getPartialAmount(
            expFilledTakerAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerFee,
        );
        expect(log.args.makerFeePaid).to.be.bignumber.equal(expMakerFeePaid, 'log.args.makerFeePaid');
        const expTakerFeePaid = orderUtils.getPartialAmount(
            expFilledTakerAmount,
            signedOrder.takerAssetAmount,
            signedOrder.takerFee,
        );
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
                takerAssetFillAmount = fillableTakerAssetAmount.add(1);
                break;

            case TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount:
                const takerAssetProxyId = assetProxyUtils.decodeAssetDataId(signedOrder.takerAssetData);
                const makerAssetProxyId = assetProxyUtils.decodeAssetDataId(signedOrder.makerAssetData);
                const isEitherAssetERC721 =
                    takerAssetProxyId === AssetProxyId.ERC721 || makerAssetProxyId === AssetProxyId.ERC721;
                if (isEitherAssetERC721) {
                    throw new Error(
                        'Cannot test `TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount` together with ERC721 assets since orders involving ERC721 must always be filled exactly.',
                    );
                }
                takerAssetFillAmount = fillableTakerAssetAmount.div(2).floor();
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
        const makerAssetFillAmount = orderUtils.getPartialAmount(
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

        const makerFee = orderUtils.getPartialAmount(
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

        const takerFee = orderUtils.getPartialAmount(
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
                await this.assetWrapper.setProxyAllowanceAsync(
                    signedOrder.takerAddress,
                    this.zrxAssetData,
                    tooLowAllowance,
                );
                break;

            case AllowanceAmountScenario.Exact:
                const exactAllowance = takerFee;
                await this.assetWrapper.setProxyAllowanceAsync(
                    signedOrder.takerAddress,
                    this.zrxAssetData,
                    exactAllowance,
                );
                break;

            case AllowanceAmountScenario.Unlimited:
                await this.assetWrapper.setProxyAllowanceAsync(
                    signedOrder.takerAddress,
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
