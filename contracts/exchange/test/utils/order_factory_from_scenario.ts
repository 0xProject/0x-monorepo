import {
    encodeERC1155AssetData,
    encodeERC20AssetData,
    encodeERC721AssetData,
    encodeMultiAssetData,
} from '@0x/contracts-asset-proxy';
import { constants, ERC1155HoldingsByOwner, ERC721TokenIdsByOwner } from '@0x/contracts-test-utils';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber, errorUtils } from '@0x/utils';
import * as _ from 'lodash';

import {
    AssetDataScenario,
    ExpirationTimeSecondsScenario,
    FeeAssetDataScenario,
    FeeRecipientAddressScenario,
    OrderAssetAmountScenario,
    OrderScenario,
    TakerScenario,
} from './fill_order_scenarios';

const TEN_UNITS_EIGHTEEN_DECIMALS = new BigNumber('10e18');
const FIVE_UNITS_EIGHTEEN_DECIMALS = new BigNumber('5e18');
const POINT_ONE_UNITS_EIGHTEEN_DECIMALS = new BigNumber('0.1e18');
const ONE_UNITS_EIGHTEEN_DECIMALS = new BigNumber('1e18');
const POINT_ZERO_FIVE_UNITS_EIGHTEEN_DECIMALS = new BigNumber('0.05e18');
const TEN_UNITS_FIVE_DECIMALS = new BigNumber('10e5');
const FIVE_UNITS_FIVE_DECIMALS = new BigNumber('5e5');
const POINT_ONE_UNITS_FIVE_DECIMALS = new BigNumber('0.1e5');
const ONE_UNITS_FIVE_DECIMALS = new BigNumber('1e5');
const POINT_ZERO_FIVE_UNITS_FIVE_DECIMALS = new BigNumber('0.05e5');
const ONE_THOUSAND_UNITS_ZERO_DECIMALS = new BigNumber(1000);
const TEN_UNITS_ZERO_DECIMALS = new BigNumber(10);
const FIVE_UNITS_ZERO_DECIMALS = new BigNumber(5);
const ONE_UNITS_ZERO_DECIMALS = new BigNumber(1);
const ONE_NFT_UNIT = new BigNumber(1);
const ZERO_UNITS = new BigNumber(0);

export class OrderFactoryFromScenario {
    constructor(
        private readonly _userAddresses: string[],
        private readonly _erc20EighteenDecimalTokenAddresses: string[],
        private readonly _erc20FiveDecimalTokenAddresses: string[],
        private readonly _erc20ZeroDecimalTokenAddresses: string[],
        private readonly _erc721TokenAddress: string,
        private readonly _erc1155TokenAddress: string,
        private readonly _erc721Balances: ERC721TokenIdsByOwner,
        private readonly _erc1155Holdings: ERC1155HoldingsByOwner,
        private readonly _exchangeAddress: string,
        private readonly _chainId: number,
    ) {
        return;
    }
    public async generateOrderAsync(orderScenario: OrderScenario): Promise<Order> {
        const makerAddress = this._userAddresses[1];
        let takerAddress = this._userAddresses[2];
        const erc721MakerAssetIds = this._erc721Balances[makerAddress][this._erc721TokenAddress];
        const erc721TakerAssetIds = this._erc721Balances[takerAddress][this._erc721TokenAddress];
        const erc1155FungibleMakerTokenIds = getERC1155FungibleOwnerTokenIds(
            this._erc1155Holdings.fungible[makerAddress][this._erc1155TokenAddress],
        );
        const erc1155NonFungibleMakerTokenIds = getERC1155NonFungibleOwnerTokenIds(
            this._erc1155Holdings.nonFungible[makerAddress][this._erc1155TokenAddress],
        );
        const erc1155FungibleTakerTokenIds = getERC1155FungibleOwnerTokenIds(
            this._erc1155Holdings.fungible[takerAddress][this._erc1155TokenAddress],
        );
        const erc1155NonFungibleTakerTokenIds = getERC1155NonFungibleOwnerTokenIds(
            this._erc1155Holdings.nonFungible[takerAddress][this._erc1155TokenAddress],
        );
        const erc1155CallbackData = constants.NULL_BYTES;
        let feeRecipientAddress;
        let makerAssetAmount;
        let takerAssetAmount;
        let makerFee;
        let takerFee;
        let expirationTimeSeconds;
        let makerAssetData = constants.NULL_BYTES;
        let takerAssetData = constants.NULL_BYTES;
        let makerFeeAssetData = constants.NULL_BYTES;
        let takerFeeAssetData = constants.NULL_BYTES;

        switch (orderScenario.feeRecipientScenario) {
            case FeeRecipientAddressScenario.BurnAddress:
                feeRecipientAddress = constants.NULL_ADDRESS;
                break;
            case FeeRecipientAddressScenario.EthUserAddress:
                feeRecipientAddress = this._userAddresses[4];
                break;
            case FeeRecipientAddressScenario.MakerAddress:
                feeRecipientAddress = makerAddress;
                break;
            case FeeRecipientAddressScenario.TakerAddress:
                feeRecipientAddress = takerAddress;
                break;
            default:
                throw errorUtils.spawnSwitchErr('FeeRecipientAddressScenario', orderScenario.feeRecipientScenario);
        }

        switch (orderScenario.makerAssetDataScenario) {
            case AssetDataScenario.ERC20EighteenDecimals:
                makerAssetData = encodeERC20AssetData(this._erc20EighteenDecimalTokenAddresses[0]);
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                makerAssetData = encodeERC20AssetData(this._erc20FiveDecimalTokenAddresses[0]);
                break;
            case AssetDataScenario.ERC721:
                makerAssetData = encodeERC721AssetData(this._erc721TokenAddress, erc721MakerAssetIds[0]);
                break;
            case AssetDataScenario.ERC20ZeroDecimals:
                makerAssetData = encodeERC20AssetData(this._erc20ZeroDecimalTokenAddresses[0]);
                break;
            case AssetDataScenario.ERC1155Fungible:
                makerAssetData = encodeERC1155AssetData(
                    this._erc1155TokenAddress,
                    [erc1155FungibleMakerTokenIds[0]],
                    [ONE_UNITS_ZERO_DECIMALS],
                    erc1155CallbackData,
                );
                break;
            case AssetDataScenario.ERC1155NonFungible:
                makerAssetData = encodeERC1155AssetData(
                    this._erc1155TokenAddress,
                    [erc1155NonFungibleMakerTokenIds[0]],
                    [ONE_UNITS_ZERO_DECIMALS],
                    erc1155CallbackData,
                );
                break;
            case AssetDataScenario.MultiAssetERC20:
                makerAssetData = encodeMultiAssetData(
                    [ONE_UNITS_EIGHTEEN_DECIMALS, ONE_UNITS_FIVE_DECIMALS],
                    [
                        encodeERC20AssetData(this._erc20EighteenDecimalTokenAddresses[0]),
                        encodeERC20AssetData(this._erc20FiveDecimalTokenAddresses[0]),
                    ],
                );
                break;
            default:
                throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.makerAssetDataScenario);
        }

        switch (orderScenario.takerAssetDataScenario) {
            case AssetDataScenario.ERC20EighteenDecimals:
                takerAssetData = encodeERC20AssetData(this._erc20EighteenDecimalTokenAddresses[1]);
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                takerAssetData = encodeERC20AssetData(this._erc20FiveDecimalTokenAddresses[1]);
                break;
            case AssetDataScenario.ERC721:
                takerAssetData = encodeERC721AssetData(this._erc721TokenAddress, erc721TakerAssetIds[0]);
                break;
            case AssetDataScenario.ERC20ZeroDecimals:
                takerAssetData = encodeERC20AssetData(this._erc20ZeroDecimalTokenAddresses[1]);
                break;
            case AssetDataScenario.ERC1155Fungible:
                takerAssetData = encodeERC1155AssetData(
                    this._erc1155TokenAddress,
                    [erc1155FungibleTakerTokenIds[1]],
                    [ONE_UNITS_ZERO_DECIMALS],
                    erc1155CallbackData,
                );
                break;
            case AssetDataScenario.ERC1155NonFungible:
                takerAssetData = encodeERC1155AssetData(
                    this._erc1155TokenAddress,
                    [erc1155NonFungibleTakerTokenIds[0]],
                    [ONE_UNITS_ZERO_DECIMALS],
                    erc1155CallbackData,
                );
                break;
            case AssetDataScenario.MultiAssetERC20:
                takerAssetData = encodeMultiAssetData(
                    [ONE_UNITS_EIGHTEEN_DECIMALS, ONE_UNITS_FIVE_DECIMALS],
                    [
                        encodeERC20AssetData(this._erc20EighteenDecimalTokenAddresses[1]),
                        encodeERC20AssetData(this._erc20FiveDecimalTokenAddresses[1]),
                    ],
                );
                break;
            default:
                throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.takerAssetDataScenario);
        }

        switch (orderScenario.makerAssetAmountScenario) {
            case OrderAssetAmountScenario.Large:
                switch (orderScenario.makerAssetDataScenario) {
                    case AssetDataScenario.ERC20EighteenDecimals:
                    case AssetDataScenario.ERC1155Fungible:
                        makerAssetAmount = TEN_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        makerAssetAmount = TEN_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                    case AssetDataScenario.ERC1155NonFungible:
                        makerAssetAmount = ONE_NFT_UNIT;
                        break;
                    case AssetDataScenario.ERC20ZeroDecimals:
                        makerAssetAmount = ONE_THOUSAND_UNITS_ZERO_DECIMALS;
                        break;
                    case AssetDataScenario.MultiAssetERC20:
                        makerAssetAmount = TEN_UNITS_ZERO_DECIMALS;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.makerAssetDataScenario);
                }
                break;
            case OrderAssetAmountScenario.Small:
                switch (orderScenario.makerAssetDataScenario) {
                    case AssetDataScenario.ERC20EighteenDecimals:
                    case AssetDataScenario.ERC1155Fungible:
                        makerAssetAmount = FIVE_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        makerAssetAmount = FIVE_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                    case AssetDataScenario.ERC1155NonFungible:
                        makerAssetAmount = ONE_NFT_UNIT;
                        break;
                    case AssetDataScenario.ERC20ZeroDecimals:
                        makerAssetAmount = TEN_UNITS_ZERO_DECIMALS;
                        break;
                    case AssetDataScenario.MultiAssetERC20:
                        makerAssetAmount = ONE_UNITS_ZERO_DECIMALS;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.makerAssetDataScenario);
                }
                break;
            case OrderAssetAmountScenario.Zero:
                makerAssetAmount = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAssetAmountScenario', orderScenario.makerAssetAmountScenario);
        }

        switch (orderScenario.takerAssetAmountScenario) {
            case OrderAssetAmountScenario.Large:
                switch (orderScenario.takerAssetDataScenario) {
                    case AssetDataScenario.ERC20EighteenDecimals:
                    case AssetDataScenario.ERC1155Fungible:
                        takerAssetAmount = TEN_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        takerAssetAmount = TEN_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                    case AssetDataScenario.ERC1155NonFungible:
                        takerAssetAmount = ONE_NFT_UNIT;
                        break;
                    case AssetDataScenario.ERC20ZeroDecimals:
                        takerAssetAmount = ONE_THOUSAND_UNITS_ZERO_DECIMALS;
                        break;
                    case AssetDataScenario.MultiAssetERC20:
                        takerAssetAmount = TEN_UNITS_ZERO_DECIMALS;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.takerAssetDataScenario);
                }
                break;
            case OrderAssetAmountScenario.Small:
                switch (orderScenario.takerAssetDataScenario) {
                    case AssetDataScenario.ERC20EighteenDecimals:
                    case AssetDataScenario.ERC1155Fungible:
                        takerAssetAmount = FIVE_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        takerAssetAmount = FIVE_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                    case AssetDataScenario.ERC1155NonFungible:
                        takerAssetAmount = ONE_NFT_UNIT;
                        break;
                    case AssetDataScenario.ERC20ZeroDecimals:
                        takerAssetAmount = TEN_UNITS_ZERO_DECIMALS;
                        break;
                    case AssetDataScenario.MultiAssetERC20:
                        takerAssetAmount = ONE_UNITS_ZERO_DECIMALS;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.takerAssetDataScenario);
                }
                break;
            case OrderAssetAmountScenario.Zero:
                takerAssetAmount = new BigNumber(0);
                break;
            default:
                throw errorUtils.spawnSwitchErr('OrderAssetAmountScenario', orderScenario.takerAssetAmountScenario);
        }

        const feeFromScenario = async (
            feeAmountScenario: OrderAssetAmountScenario,
            feeAssetDataScenario: FeeAssetDataScenario,
            erc20EighteenDecimalTokenAddress: string,
            erc20FiveDecimalTokenAddress: string,
            erc20ZeroDecimalTokenAddress: string,
            erc721AssetId: BigNumber,
            erc1155FungibleTokenId: BigNumber,
            erc1155NonFungibleAssetId: BigNumber,
        ): Promise<[BigNumber, string]> => {
            const feeAmount = getFeeAmountFromScenario(orderScenario, feeAssetDataScenario, feeAmountScenario);
            switch (feeAssetDataScenario) {
                case FeeAssetDataScenario.MakerToken:
                    return [feeAmount, makerAssetData];
                case FeeAssetDataScenario.TakerToken:
                    return [feeAmount, takerAssetData];
                case FeeAssetDataScenario.ERC20EighteenDecimals:
                    return [feeAmount, encodeERC20AssetData(erc20EighteenDecimalTokenAddress)];
                case FeeAssetDataScenario.ERC20FiveDecimals:
                    return [feeAmount, encodeERC20AssetData(erc20FiveDecimalTokenAddress)];
                case FeeAssetDataScenario.ERC20ZeroDecimals:
                    return [feeAmount, encodeERC20AssetData(erc20ZeroDecimalTokenAddress)];
                case FeeAssetDataScenario.ERC721:
                    return [feeAmount, encodeERC721AssetData(this._erc721TokenAddress, erc721AssetId)];
                case FeeAssetDataScenario.ERC1155Fungible:
                    return [
                        feeAmount,
                        encodeERC1155AssetData(
                            this._erc1155TokenAddress,
                            [erc1155FungibleTokenId],
                            [ONE_UNITS_ZERO_DECIMALS],
                            erc1155CallbackData,
                        ),
                    ];
                case FeeAssetDataScenario.ERC1155NonFungible:
                    return [
                        feeAmount,
                        encodeERC1155AssetData(
                            this._erc1155TokenAddress,
                            [erc1155NonFungibleAssetId],
                            [ONE_UNITS_ZERO_DECIMALS],
                            erc1155CallbackData,
                        ),
                    ];
                case FeeAssetDataScenario.MultiAssetERC20:
                    return [
                        feeAmount,
                        encodeMultiAssetData(
                            [POINT_ZERO_FIVE_UNITS_EIGHTEEN_DECIMALS, POINT_ZERO_FIVE_UNITS_FIVE_DECIMALS],
                            [
                                encodeERC20AssetData(erc20EighteenDecimalTokenAddress),
                                encodeERC20AssetData(erc20FiveDecimalTokenAddress),
                            ],
                        ),
                    ];
                default:
                    throw errorUtils.spawnSwitchErr('FeeAssetDataScenario', feeAssetDataScenario);
            }
        };

        [makerFee, makerFeeAssetData] = await feeFromScenario(
            orderScenario.makerFeeScenario,
            orderScenario.makerFeeAssetDataScenario,
            this._erc20EighteenDecimalTokenAddresses[2],
            this._erc20FiveDecimalTokenAddresses[2],
            this._erc20ZeroDecimalTokenAddresses[2],
            erc721MakerAssetIds[1],
            erc1155FungibleMakerTokenIds[2],
            erc1155NonFungibleMakerTokenIds[1],
        );
        [takerFee, takerFeeAssetData] = await feeFromScenario(
            orderScenario.takerFeeScenario,
            orderScenario.takerFeeAssetDataScenario,
            this._erc20EighteenDecimalTokenAddresses[3],
            this._erc20FiveDecimalTokenAddresses[3],
            this._erc20ZeroDecimalTokenAddresses[3],
            erc721TakerAssetIds[1],
            erc1155FungibleTakerTokenIds[3],
            erc1155NonFungibleTakerTokenIds[1],
        );

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

        switch (orderScenario.takerScenario) {
            case TakerScenario.CorrectlySpecified:
                break; // noop since takerAddress is already specified

            case TakerScenario.IncorrectlySpecified:
                const notTaker = this._userAddresses[3];
                takerAddress = notTaker;
                break;

            case TakerScenario.Unspecified:
                takerAddress = constants.NULL_ADDRESS;
                break;

            default:
                throw errorUtils.spawnSwitchErr('TakerScenario', orderScenario.takerScenario);
        }

        const order = {
            senderAddress: constants.NULL_ADDRESS,
            makerAddress,
            takerAddress,
            makerFee,
            takerFee,
            makerAssetAmount,
            takerAssetAmount,
            makerAssetData,
            takerAssetData,
            makerFeeAssetData,
            takerFeeAssetData,
            salt: generatePseudoRandomSalt(),
            feeRecipientAddress,
            expirationTimeSeconds,
            exchangeAddress: this._exchangeAddress,
            chainId: this._chainId,
        };

        return order;
    }
}

function getFeeAmountFromScenario(
    orderScenario: OrderScenario,
    feeAssetDataScenario: AssetDataScenario | FeeAssetDataScenario,
    feeAmountScenario: OrderAssetAmountScenario,
): BigNumber {
    switch (feeAssetDataScenario) {
        case FeeAssetDataScenario.ERC721:
        case FeeAssetDataScenario.ERC1155NonFungible:
            switch (feeAmountScenario) {
                case OrderAssetAmountScenario.Zero:
                    return ZERO_UNITS;
                case OrderAssetAmountScenario.Small:
                case OrderAssetAmountScenario.Large:
                    return ONE_NFT_UNIT;
                default:
                    throw errorUtils.spawnSwitchErr('OrderAssetAmountScenario', feeAmountScenario);
            }
        case FeeAssetDataScenario.ERC20ZeroDecimals:
            switch (feeAmountScenario) {
                case OrderAssetAmountScenario.Zero:
                    return ZERO_UNITS;
                case OrderAssetAmountScenario.Small:
                case OrderAssetAmountScenario.Large:
                    return ONE_UNITS_ZERO_DECIMALS;
                default:
                    throw errorUtils.spawnSwitchErr('OrderAssetAmountScenario', feeAmountScenario);
            }
        case FeeAssetDataScenario.ERC20FiveDecimals:
            switch (feeAmountScenario) {
                case OrderAssetAmountScenario.Zero:
                    return ZERO_UNITS;
                case OrderAssetAmountScenario.Small:
                    return POINT_ZERO_FIVE_UNITS_FIVE_DECIMALS;
                case OrderAssetAmountScenario.Large:
                    return POINT_ONE_UNITS_FIVE_DECIMALS;
                default:
                    throw errorUtils.spawnSwitchErr('OrderAssetAmountScenario', feeAmountScenario);
            }
        case FeeAssetDataScenario.ERC20EighteenDecimals:
        case FeeAssetDataScenario.ERC1155Fungible:
            switch (feeAmountScenario) {
                case OrderAssetAmountScenario.Zero:
                    return ZERO_UNITS;
                case OrderAssetAmountScenario.Small:
                    return POINT_ZERO_FIVE_UNITS_EIGHTEEN_DECIMALS;
                case OrderAssetAmountScenario.Large:
                    return POINT_ONE_UNITS_EIGHTEEN_DECIMALS;
                default:
                    throw errorUtils.spawnSwitchErr('OrderAssetAmountScenario', feeAmountScenario);
            }
        case FeeAssetDataScenario.MultiAssetERC20:
            switch (feeAmountScenario) {
                case OrderAssetAmountScenario.Zero:
                    return ZERO_UNITS;
                case OrderAssetAmountScenario.Small:
                    return ONE_UNITS_ZERO_DECIMALS;
                case OrderAssetAmountScenario.Large:
                    return FIVE_UNITS_ZERO_DECIMALS;
                default:
                    throw errorUtils.spawnSwitchErr('OrderAssetAmountScenario', feeAmountScenario);
            }
        case FeeAssetDataScenario.MakerToken:
            return getFeeAmountFromScenario(orderScenario, orderScenario.makerAssetDataScenario, feeAmountScenario);
        case FeeAssetDataScenario.TakerToken:
            return getFeeAmountFromScenario(orderScenario, orderScenario.takerAssetDataScenario, feeAmountScenario);
        default:
            throw errorUtils.spawnSwitchErr('FeeAssetDataScenario', feeAssetDataScenario);
    }
}

function getERC1155FungibleOwnerTokenIds(holdings: { [tokenId: string]: BigNumber }): BigNumber[] {
    return _.keys(holdings).map(id => new BigNumber(id));
}

function getERC1155NonFungibleOwnerTokenIds(holdings: { [tokenId: string]: BigNumber[] }): BigNumber[] {
    return _.values(holdings).map(group => group[0]);
}

// tslint:disable: max-file-line-count
