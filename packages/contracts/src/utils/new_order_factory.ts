import { assetProxyUtils, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { Order } from '@0xproject/types';
import { BigNumber, errorUtils } from '@0xproject/utils';

import { DummyERC721TokenContract } from '../generated_contract_wrappers/dummy_e_r_c721_token';

import { constants } from './constants';
import {
    AssetDataScenario,
    ERC721TokenIdsByOwner,
    ExpirationTimeSecondsScenario,
    FeeRecipientAddressScenario,
    OrderAmountScenario,
    OrderScenario,
} from './types';

const TEN_UNITS_EIGHTEEN_DECIMALS = new BigNumber(10000000000000000000);
const POINT_ONE_UNITS_EIGHTEEN_DECIMALS = new BigNumber(100000000000000000);
const TEN_UNITS_FIVE_DECIMALS = new BigNumber(1000000);
const ONE_NFT_UNIT = new BigNumber(1);

export class NewOrderFactory {
    private _userAddresses: string[];
    private _zrxAddress: string;
    private _nonZrxERC20EighteenDecimalTokenAddresses: string[];
    private _erc20FiveDecimalTokenAddresses: string[];
    private _erc721Token: DummyERC721TokenContract;
    private _erc721Balances: ERC721TokenIdsByOwner;
    private _exchangeAddress: string;
    constructor(
        userAddresses: string[],
        zrxAddress: string,
        nonZrxERC20EighteenDecimalTokenAddresses: string[],
        erc20FiveDecimalTokenAddresses: string[],
        erc721Token: DummyERC721TokenContract,
        erc721Balances: ERC721TokenIdsByOwner,
        exchangeAddress: string,
    ) {
        this._userAddresses = userAddresses;
        this._zrxAddress = zrxAddress;
        this._nonZrxERC20EighteenDecimalTokenAddresses = nonZrxERC20EighteenDecimalTokenAddresses;
        this._erc20FiveDecimalTokenAddresses = erc20FiveDecimalTokenAddresses;
        this._erc721Token = erc721Token;
        this._erc721Balances = erc721Balances;
        this._exchangeAddress = exchangeAddress;
    }
    public generateOrder(orderScenario: OrderScenario): Order {
        const makerAddress = this._userAddresses[1];
        const takerAddress = this._userAddresses[2];
        const erc721MakerAssetIds = this._erc721Balances[makerAddress][this._erc721Token.address];
        const erc721TakerAssetIds = this._erc721Balances[takerAddress][this._erc721Token.address];
        let feeRecipientAddress;
        let makerAssetAmount;
        let takerAssetAmount;
        let makerFee;
        let takerFee;
        let expirationTimeSeconds;
        let makerAssetData;
        let takerAssetData;

        switch (orderScenario.feeRecipientScenario) {
            case FeeRecipientAddressScenario.BurnAddress:
                feeRecipientAddress = constants.NULL_ADDRESS;
                break;
            case FeeRecipientAddressScenario.EthUserAddress:
                feeRecipientAddress = this._userAddresses[4];
                break;
            default:
                throw errorUtils.spawnSwitchErr('FeeRecipientAddressScenario', orderScenario.feeRecipientScenario);
        }

        switch (orderScenario.makerAssetDataScenario) {
            case AssetDataScenario.ZRXFeeToken:
                makerAssetData = assetProxyUtils.encodeERC20AssetData(this._zrxAddress);
                break;
            case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                makerAssetData = assetProxyUtils.encodeERC20AssetData(
                    this._nonZrxERC20EighteenDecimalTokenAddresses[0],
                );
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                makerAssetData = assetProxyUtils.encodeERC20AssetData(this._erc20FiveDecimalTokenAddresses[0]);
                break;
            case AssetDataScenario.ERC721:
                makerAssetData = assetProxyUtils.encodeERC721AssetData(
                    this._erc721Token.address,
                    erc721MakerAssetIds[0],
                );
                break;
            default:
                throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.makerAssetDataScenario);
        }

        switch (orderScenario.takerAssetDataScenario) {
            case AssetDataScenario.ZRXFeeToken:
                takerAssetData = assetProxyUtils.encodeERC20AssetData(this._zrxAddress);
                break;
            case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                takerAssetData = assetProxyUtils.encodeERC20AssetData(
                    this._nonZrxERC20EighteenDecimalTokenAddresses[1],
                );
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                takerAssetData = assetProxyUtils.encodeERC20AssetData(this._erc20FiveDecimalTokenAddresses[1]);
                break;
            case AssetDataScenario.ERC721:
                takerAssetData = assetProxyUtils.encodeERC721AssetData(
                    this._erc721Token.address,
                    erc721TakerAssetIds[0],
                );
                break;
            default:
                throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.takerAssetDataScenario);
        }

        switch (orderScenario.makerAssetAmountScenario) {
            case OrderAmountScenario.NonZero:
                switch (orderScenario.makerAssetDataScenario) {
                    case AssetDataScenario.ZRXFeeToken:
                    case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                        makerAssetAmount = TEN_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        makerAssetAmount = TEN_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                        makerAssetAmount = ONE_NFT_UNIT;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.makerAssetDataScenario);
                }
                break;
            case OrderAmountScenario.Zero:
                makerAssetAmount = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAmountScenario', orderScenario.makerAssetAmountScenario);
        }

        switch (orderScenario.takerAssetAmountScenario) {
            case OrderAmountScenario.NonZero:
                switch (orderScenario.takerAssetDataScenario) {
                    case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                    case AssetDataScenario.ZRXFeeToken:
                        takerAssetAmount = TEN_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        takerAssetAmount = TEN_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                        takerAssetAmount = ONE_NFT_UNIT;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.takerAssetDataScenario);
                }
                break;
            case OrderAmountScenario.Zero:
                takerAssetAmount = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAmountScenario', orderScenario.takerAssetAmountScenario);
        }

        switch (orderScenario.makerFeeScenario) {
            case OrderAmountScenario.NonZero:
                makerFee = POINT_ONE_UNITS_EIGHTEEN_DECIMALS;
                break;
            case OrderAmountScenario.Zero:
                makerFee = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAmountScenario', orderScenario.makerFeeScenario);
        }

        switch (orderScenario.takerFeeScenario) {
            case OrderAmountScenario.NonZero:
                takerFee = POINT_ONE_UNITS_EIGHTEEN_DECIMALS;
                break;
            case OrderAmountScenario.Zero:
                takerFee = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAmountScenario', orderScenario.takerFeeScenario);
        }

        switch (orderScenario.expirationTimeSecondsScenario) {
            case ExpirationTimeSecondsScenario.InFuture:
                expirationTimeSeconds = new BigNumber(2524604400); // Close to infinite
                break;
            case ExpirationTimeSecondsScenario.InPast:
                expirationTimeSeconds = new BigNumber(0); // Jan 1, 1970
                break;
            default:
                throw errorUtils.spawnSwitchErr(
                    'ExpirationTimeSecondsScenario',
                    orderScenario.expirationTimeSecondsScenario,
                );
        }

        const order: Order = {
            senderAddress: constants.NULL_ADDRESS,
            makerAddress,
            takerAddress,
            makerFee,
            takerFee,
            makerAssetAmount,
            takerAssetAmount,
            makerAssetData,
            takerAssetData,
            salt: generatePseudoRandomSalt(),
            exchangeAddress: this._exchangeAddress,
            feeRecipientAddress,
            expirationTimeSeconds,
        };

        return order;
    }
}
