import { assetProxyUtils, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { Order } from '@0xproject/types';
import { BigNumber, errorUtils } from '@0xproject/utils';

import { constants } from './constants';
import {
    AssetDataScenario,
    ERC721Token,
    ExpirationTimeSecondsScenario,
    FeeRecipientAddressScenario,
    OrderAmountScenario,
} from './types';

const TEN_UNITS_EIGHTEEN_DECIMALS = new BigNumber(10000000000000000000);
const POINT_ONE_UNITS_EIGHTEEN_DECIMALS = new BigNumber(100000000000000000);
const TEN_UNITS_FIVE_DECIMALS = new BigNumber(1000000);
const ONE_NFT_UNIT = new BigNumber(1);
const TEN_MINUTES_MS = 1000 * 60 * 10;

export const combinatorialUtils = {
    generateOrder(
        userAddresses: string[],
        zrxAddress: string,
        nonZrxERC20EighteenDecimalTokenAddress: string,
        erc20FiveDecimalTokenAddress: string,
        erc721Token: ERC721Token,
        exchangeAddress: string,
        feeRecipientScenario: FeeRecipientAddressScenario,
        makerAssetAmountScenario: OrderAmountScenario,
        takerAssetAmountScenario: OrderAmountScenario,
        makerFeeScenario: OrderAmountScenario,
        takerFeeScenario: OrderAmountScenario,
        expirationTimeSecondsScenario: ExpirationTimeSecondsScenario,
        makerAssetDataScenario: AssetDataScenario,
        takerAssetDataScenario: AssetDataScenario,
    ): Order {
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
                feeRecipientAddress = userAddresses[4];
                break;
            default:
                throw errorUtils.spawnSwitchErr('FeeRecipientAddressScenario', feeRecipientScenario);
        }

        const invalidAssetProxyIdHex = '0A';
        switch (makerAssetDataScenario) {
            case AssetDataScenario.ZRXFeeToken:
                makerAssetData = assetProxyUtils.encodeERC20ProxyData(zrxAddress);
                break;
            case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                makerAssetData = assetProxyUtils.encodeERC20ProxyData(nonZrxERC20EighteenDecimalTokenAddress);
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                makerAssetData = assetProxyUtils.encodeERC20ProxyData(erc20FiveDecimalTokenAddress);
                break;
            case AssetDataScenario.ERC20InvalidAssetProxyId: {
                const validAssetData = assetProxyUtils.encodeERC20ProxyData(nonZrxERC20EighteenDecimalTokenAddress);
                makerAssetData = `${validAssetData.slice(0, -2)}${invalidAssetProxyIdHex}`;
                break;
            }
            case AssetDataScenario.ERC721ValidAssetProxyId:
                makerAssetData = assetProxyUtils.encodeERC721ProxyData(erc721Token.address, erc721Token.id);
                break;
            case AssetDataScenario.ERC721InvalidAssetProxyId: {
                const validAssetData = assetProxyUtils.encodeERC721ProxyData(erc721Token.address, erc721Token.id);
                makerAssetData = `${validAssetData.slice(0, -2)}${invalidAssetProxyIdHex}`;
                break;
            }
            default:
                throw errorUtils.spawnSwitchErr('AssetDataScenario', makerAssetDataScenario);
        }

        switch (takerAssetDataScenario) {
            case AssetDataScenario.ZRXFeeToken:
                takerAssetData = assetProxyUtils.encodeERC20ProxyData(zrxAddress);
                break;
            case AssetDataScenario.ERC20NonZRXEighteenDecimals:
                takerAssetData = assetProxyUtils.encodeERC20ProxyData(nonZrxERC20EighteenDecimalTokenAddress);
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                takerAssetData = assetProxyUtils.encodeERC20ProxyData(erc20FiveDecimalTokenAddress);
                break;
            case AssetDataScenario.ERC20InvalidAssetProxyId: {
                const validAssetData = assetProxyUtils.encodeERC20ProxyData(nonZrxERC20EighteenDecimalTokenAddress);
                takerAssetData = `${validAssetData.slice(0, -2)}${invalidAssetProxyIdHex}`;
                break;
            }
            case AssetDataScenario.ERC721ValidAssetProxyId:
                takerAssetData = assetProxyUtils.encodeERC721ProxyData(erc721Token.address, erc721Token.id);
                break;
            case AssetDataScenario.ERC721InvalidAssetProxyId: {
                const validAssetData = assetProxyUtils.encodeERC721ProxyData(erc721Token.address, erc721Token.id);
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
            makerAddress: userAddresses[1],
            takerAddress: userAddresses[2],
            makerFee,
            takerFee,
            makerAssetAmount,
            takerAssetAmount,
            makerAssetData,
            takerAssetData,
            salt: generatePseudoRandomSalt(),
            exchangeAddress,
            feeRecipientAddress,
            expirationTimeSeconds,
        };

        return order;
    },
};
