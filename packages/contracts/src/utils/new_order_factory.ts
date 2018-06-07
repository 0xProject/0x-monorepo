import { assetProxyUtils, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { Order } from '@0xproject/types';
import { BigNumber, errorUtils } from '@0xproject/utils';

import { DummyERC721TokenContract } from '../contract_wrappers/generated/dummy_e_r_c721_token';

import { constants } from './constants';
import {
    AssetDataScenario,
    ERC721TokenIdsByOwner,
    ExpirationTimeSecondsScenario,
    FeeRecipientAddressScenario,
    OrderAmountScenario,
} from './types';

const TEN_UNITS_EIGHTEEN_DECIMALS = new BigNumber(10000000000000000000);
const POINT_ONE_UNITS_EIGHTEEN_DECIMALS = new BigNumber(100000000000000000);
const TEN_UNITS_FIVE_DECIMALS = new BigNumber(1000000);
const ONE_NFT_UNIT = new BigNumber(1);
const TEN_MINUTES_MS = 1000 * 60 * 10;

/*
 * TODO:
 * - Write function that given an order, fillAmount, retrieves orderRelevantState and maps it to expected test outcome.
 * - Write function that generates order permutations.
 * - Write functions for other steps that must be permutated
 */

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
    public generateOrder(
        feeRecipientScenario: FeeRecipientAddressScenario,
        makerAssetAmountScenario: OrderAmountScenario,
        takerAssetAmountScenario: OrderAmountScenario,
        makerFeeScenario: OrderAmountScenario,
        takerFeeScenario: OrderAmountScenario,
        expirationTimeSecondsScenario: ExpirationTimeSecondsScenario,
        makerAssetDataScenario: AssetDataScenario,
        takerAssetDataScenario: AssetDataScenario,
    ): Order {
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

        switch (feeRecipientScenario) {
            case FeeRecipientAddressScenario.BurnAddress:
                feeRecipientAddress = constants.NULL_ADDRESS;
                break;
            case FeeRecipientAddressScenario.EthUserAddress:
                feeRecipientAddress = this._userAddresses[4];
                break;
            default:
                throw errorUtils.spawnSwitchErr('FeeRecipientAddressScenario', feeRecipientScenario);
        }

        const invalidAssetProxyIdHex = '0A';
        switch (makerAssetDataScenario) {
            case AssetDataScenario.ZRXFeeToken:
                makerAssetData = assetProxyUtils.encodeERC20ProxyData(this._zrxAddress);
                break;
            case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                makerAssetData = assetProxyUtils.encodeERC20ProxyData(
                    this._nonZrxERC20EighteenDecimalTokenAddresses[0],
                );
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                makerAssetData = assetProxyUtils.encodeERC20ProxyData(this._erc20FiveDecimalTokenAddresses[0]);
                break;
            case AssetDataScenario.ERC20InvalidAssetProxyId: {
                const validAssetData = assetProxyUtils.encodeERC20ProxyData(
                    this._nonZrxERC20EighteenDecimalTokenAddresses[0],
                );
                makerAssetData = `${validAssetData.slice(0, -2)}${invalidAssetProxyIdHex}`;
                break;
            }
            case AssetDataScenario.ERC721ValidAssetProxyId:
                makerAssetData = assetProxyUtils.encodeERC721ProxyData(
                    this._erc721Token.address,
                    erc721MakerAssetIds[0],
                );
                break;
            case AssetDataScenario.ERC721InvalidAssetProxyId: {
                const validAssetData = assetProxyUtils.encodeERC721ProxyData(
                    this._erc721Token.address,
                    erc721MakerAssetIds[0],
                );
                makerAssetData = `${validAssetData.slice(0, -2)}${invalidAssetProxyIdHex}`;
                break;
            }
            default:
                throw errorUtils.spawnSwitchErr('AssetDataScenario', makerAssetDataScenario);
        }

        switch (takerAssetDataScenario) {
            case AssetDataScenario.ZRXFeeToken:
                takerAssetData = assetProxyUtils.encodeERC20ProxyData(this._zrxAddress);
                break;
            case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                takerAssetData = assetProxyUtils.encodeERC20ProxyData(
                    this._nonZrxERC20EighteenDecimalTokenAddresses[1],
                );
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                takerAssetData = assetProxyUtils.encodeERC20ProxyData(this._erc20FiveDecimalTokenAddresses[1]);
                break;
            case AssetDataScenario.ERC20InvalidAssetProxyId: {
                const validAssetData = assetProxyUtils.encodeERC20ProxyData(
                    this._nonZrxERC20EighteenDecimalTokenAddresses[1],
                );
                takerAssetData = `${validAssetData.slice(0, -2)}${invalidAssetProxyIdHex}`;
                break;
            }
            case AssetDataScenario.ERC721ValidAssetProxyId:
                takerAssetData = assetProxyUtils.encodeERC721ProxyData(
                    this._erc721Token.address,
                    erc721TakerAssetIds[0],
                );
                break;
            case AssetDataScenario.ERC721InvalidAssetProxyId: {
                const validAssetData = assetProxyUtils.encodeERC721ProxyData(
                    this._erc721Token.address,
                    erc721TakerAssetIds[0],
                );
                takerAssetData = `${validAssetData.slice(0, -2)}${invalidAssetProxyIdHex}`;
                break;
            }
            default:
                throw errorUtils.spawnSwitchErr('AssetDataScenario', takerAssetDataScenario);
        }

        switch (makerAssetAmountScenario) {
            case OrderAmountScenario.NonZero:
                switch (makerAssetDataScenario) {
                    case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                    case AssetDataScenario.ERC20InvalidAssetProxyId:
                        makerAssetAmount = TEN_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        makerAssetAmount = TEN_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721ValidAssetProxyId:
                    case AssetDataScenario.ERC721InvalidAssetProxyId:
                        makerAssetAmount = ONE_NFT_UNIT;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', makerAssetDataScenario);
                }
                break;
            case OrderAmountScenario.Zero:
                makerAssetAmount = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAmountScenario', makerAssetAmountScenario);
        }

        switch (takerAssetAmountScenario) {
            case OrderAmountScenario.NonZero:
                switch (takerAssetDataScenario) {
                    case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                    case AssetDataScenario.ERC20InvalidAssetProxyId:
                        takerAssetAmount = TEN_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        takerAssetAmount = TEN_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721ValidAssetProxyId:
                    case AssetDataScenario.ERC721InvalidAssetProxyId:
                        takerAssetAmount = ONE_NFT_UNIT;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', takerAssetDataScenario);
                }
                break;
            case OrderAmountScenario.Zero:
                takerAssetAmount = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAmountScenario', takerAssetAmountScenario);
        }

        switch (makerFeeScenario) {
            case OrderAmountScenario.NonZero:
                makerFee = POINT_ONE_UNITS_EIGHTEEN_DECIMALS;
                break;
            case OrderAmountScenario.Zero:
                makerFee = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAmountScenario', makerFeeScenario);
        }

        switch (takerFeeScenario) {
            case OrderAmountScenario.NonZero:
                takerFee = POINT_ONE_UNITS_EIGHTEEN_DECIMALS;
                break;
            case OrderAmountScenario.Zero:
                takerFee = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAmountScenario', takerFeeScenario);
        }

        switch (expirationTimeSecondsScenario) {
            case ExpirationTimeSecondsScenario.InFuture:
                expirationTimeSeconds = new BigNumber(Date.now() + TEN_MINUTES_MS);
                break;
            case ExpirationTimeSecondsScenario.InPast:
                expirationTimeSeconds = new BigNumber(Date.now() - TEN_MINUTES_MS);
                break;
            default:
                throw errorUtils.spawnSwitchErr('ExpirationTimeSecondsScenario', expirationTimeSecondsScenario);
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
