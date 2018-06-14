import {
    assetProxyUtils,
    BalanceAndProxyAllowanceLazyStore,
    ExchangeTransferSimulator,
    orderHashUtils,
    OrderStateUtils,
    OrderValidationUtils,
} from '@0xproject/order-utils';
import { AssetProxyId, Order, SignatureType, SignedOrder } from '@0xproject/types';
import { BigNumber, errorUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import { BlockParamLiteral, LogWithDecodedArgs, Provider, TxData } from 'ethereum-types';
// import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';
import 'make-promises-safe';

import { ExchangeContract, FillContractEventArgs } from '../generated_contract_wrappers/exchange';
import { artifacts } from '../utils/artifacts';
import { expectRevertOrAlwaysFailingTransactionAsync } from '../utils/assertions';
import { AssetWrapper } from '../utils/asset_wrapper';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ERC721Wrapper } from '../utils/erc721_wrapper';
import { ExchangeWrapper } from '../utils/exchange_wrapper';
import { NewOrderFactory } from '../utils/new_order_factory';
import { orderUtils } from '../utils/order_utils';
import { signingUtils } from '../utils/signing_utils';
import { SimpleAssetBalanceAndProxyAllowanceFetcher } from '../utils/simple_asset_balance_and_proxy_allowance_fetcher';
import { SimpleOrderFilledCancelledFetcher } from '../utils/simple_order_filled_cancelled_fetcher';
import {
    AssetDataScenario,
    ExpirationTimeSecondsScenario,
    FeeRecipientAddressScenario,
    OrderAmountScenario,
    OrderScenario,
    TakerAssetFillAmountScenario,
    TakerScenario,
    FillScenario,
} from '../utils/types';

chaiSetup.configure();
const expect = chai.expect;

const ERC721_PROXY_ID = 2;

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

    const orderFactory = new NewOrderFactory(
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
    public orderFactory: NewOrderFactory;
    public ownerAddress: string;
    public makerAddress: string;
    public makerPrivateKey: Buffer;
    public takerAddress: string;
    public zrxAssetData: string;
    public exchangeWrapper: ExchangeWrapper;
    public assetWrapper: AssetWrapper;
    public static generateOrderCombinations(): OrderScenario[] {
        const takerScenarios = [TakerScenario.Unspecified];
        const feeRecipientScenarios = [FeeRecipientAddressScenario.EthUserAddress];
        const makerAssetAmountScenario = [OrderAmountScenario.Large];
        const takerAssetAmountScenario = [OrderAmountScenario.Large];
        const makerFeeScenario = [OrderAmountScenario.Large];
        const takerFeeScenario = [OrderAmountScenario.Large];
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
        const orderScenarioArrays = CoreCombinatorialUtils._allPossibleCases([
            takerScenarios,
            feeRecipientScenarios,
            makerAssetAmountScenario,
            takerAssetAmountScenario,
            makerFeeScenario,
            takerFeeScenario,
            expirationTimeSecondsScenario,
            makerAssetDataScenario,
            takerAssetDataScenario,
        ]);

        const orderScenarios = _.map(orderScenarioArrays, orderScenarioArray => {
            const orderScenario: OrderScenario = {
                takerScenario: orderScenarioArray[0] as TakerScenario,
                feeRecipientScenario: orderScenarioArray[1] as FeeRecipientAddressScenario,
                makerAssetAmountScenario: orderScenarioArray[2] as OrderAmountScenario,
                takerAssetAmountScenario: orderScenarioArray[3] as OrderAmountScenario,
                makerFeeScenario: orderScenarioArray[4] as OrderAmountScenario,
                takerFeeScenario: orderScenarioArray[5] as OrderAmountScenario,
                expirationTimeSecondsScenario: orderScenarioArray[6] as ExpirationTimeSecondsScenario,
                makerAssetDataScenario: orderScenarioArray[7] as AssetDataScenario,
                takerAssetDataScenario: orderScenarioArray[8] as AssetDataScenario,
            };
            return orderScenario;
        });

        return orderScenarios;
    }
    private static _allPossibleCases(arrays: string[][]): string[][] {
        if (arrays.length === 1) {
            const remainingVals = _.map(arrays[0], val => {
                return [val];
            });
            return remainingVals;
        } else {
            const result = [];
            const allCasesOfRest = CoreCombinatorialUtils._allPossibleCases(arrays.slice(1)); // recur with the rest of array
            // tslint:disable:prefer-for-of
            for (let i = 0; i < allCasesOfRest.length; i++) {
                for (let j = 0; j < arrays[0].length; j++) {
                    result.push([arrays[0][j], ...allCasesOfRest[i]]);
                }
            }
            // tslint:enable:prefer-for-of
            return result;
        }
    }
    constructor(
        orderFactory: NewOrderFactory,
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
    public async testFillOrderScenarioAsync(provider: Provider, fillScenario: FillScenario): Promise<void> {
        // 1. Generate order
        const order = this.orderFactory.generateOrder(fillScenario.orderScenario);

        // 2. Sign order
        const orderHashBuff = orderHashUtils.getOrderHashBuff(order);
        const signature = signingUtils.signMessage(orderHashBuff, this.makerPrivateKey, SignatureType.EthSign);
        const signedOrder = {
            ...order,
            signature: `0x${signature.toString('hex')}`,
        };

        // 3. Permutate the maker and taker balance/allowance scenarios
        // TODO(fabio)

        // 4. Figure out fill amount
        const balanceAndProxyAllowanceFetcher = new SimpleAssetBalanceAndProxyAllowanceFetcher(this.assetWrapper);
        const orderFilledCancelledFetcher = new SimpleOrderFilledCancelledFetcher(
            this.exchangeWrapper,
            this.zrxAssetData,
        );
        const orderStateUtils = new OrderStateUtils(balanceAndProxyAllowanceFetcher, orderFilledCancelledFetcher);

        const fillableTakerAssetAmount = await orderStateUtils.getMaxFillableTakerAssetAmountAsync(
            signedOrder,
            this.takerAddress,
        );

        let takerAssetFillAmount;
        const takerAssetFillAmountScenario = fillScenario.takerAssetFillAmountScenario;
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
                    takerAssetProxyId === ERC721_PROXY_ID || makerAssetProxyId === ERC721_PROXY_ID;
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

        // 5. If I fill it by X, what are the resulting balances/allowances/filled amounts exp?
        const orderValidationUtils = new OrderValidationUtils(orderFilledCancelledFetcher);
        const lazyStore = new BalanceAndProxyAllowanceLazyStore(balanceAndProxyAllowanceFetcher);
        const exchangeTransferSimulator = new ExchangeTransferSimulator(lazyStore);

        let isFillFailureExpected = false;
        try {
            await orderValidationUtils.validateFillOrderThrowIfInvalidAsync(
                exchangeTransferSimulator,
                provider,
                signedOrder,
                takerAssetFillAmount,
                this.takerAddress,
                this.zrxAssetData,
            );
        } catch (err) {
            isFillFailureExpected = true;
        }

        await this._fillOrderAndAssertOutcomeAsync(
            signedOrder,
            takerAssetFillAmount,
            lazyStore,
            isFillFailureExpected,
            provider,
        );
    }
    private async _fillOrderAndAssertOutcomeAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
        lazyStore: BalanceAndProxyAllowanceLazyStore,
        isFillFailureExpected: boolean,
        provider: Provider,
    ): Promise<void> {
        if (isFillFailureExpected) {
            return expectRevertOrAlwaysFailingTransactionAsync(
                this.exchangeWrapper.fillOrderAsync(signedOrder, this.takerAddress, { takerAssetFillAmount }),
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
        const initialFilledTakerAmount = await this.exchangeWrapper.getTakerAssetFilledAmountAsync(orderHash);
        const expFilledTakerAmount = initialFilledTakerAmount.add(takerAssetFillAmount);

        const expFilledMakerAmount = orderUtils.getPartialAmount(
            takerAssetFillAmount,
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
            takerAssetFillAmount,
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
}
