import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { constants, ERC721TokenIdsByOwner } from '@0x/contracts-test-utils';
import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber, errorUtils } from '@0x/utils';

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
const POINT_ZERO_FIVE_UNITS_EIGHTEEN_DECIMALS = new BigNumber('0.05e18');
const TEN_UNITS_FIVE_DECIMALS = new BigNumber('10e5');
const FIVE_UNITS_FIVE_DECIMALS = new BigNumber('5e5');
const POINT_ONE_UNITS_FIVE_DECIMALS = new BigNumber('0.1e5');
const POINT_ZERO_FIVE_UNITS_FIVE_DECIMALS = new BigNumber('0.05e5');
const TEN_UNITS_ZERO_DECIMALS = new BigNumber(10);
const ONE_THOUSAND_UNITS_ZERO_DECIMALS = new BigNumber(1000);
const ONE_UNITS_ZERO_DECIMALS = new BigNumber(1);
const ONE_NFT_UNIT = new BigNumber(1);
const ZERO_UNITS = new BigNumber(0);

export class OrderFactoryFromScenario {
    private readonly _userAddresses: string[];
    private readonly _erc20EighteenDecimalTokenAddresses: string[];
    private readonly _erc20FiveDecimalTokenAddresses: string[];
    private readonly _erc20ZeroDecimalTokenAddresses: string[];
    private readonly _erc721Token: DummyERC721TokenContract;
    private readonly _erc721Balances: ERC721TokenIdsByOwner;
    private readonly _exchangeAddress: string;
    private readonly _chainId: number;
    constructor(
        userAddresses: string[],
        erc20EighteenDecimalTokenAddresses: string[],
        erc20FiveDecimalTokenAddresses: string[],
        erc20ZeroDecimalTokenAddresses: string[],
        erc721Token: DummyERC721TokenContract,
        erc721Balances: ERC721TokenIdsByOwner,
        exchangeAddress: string,
        chainId: number,
    ) {
        this._userAddresses = userAddresses;
        this._erc20EighteenDecimalTokenAddresses = erc20EighteenDecimalTokenAddresses;
        this._erc20FiveDecimalTokenAddresses = erc20FiveDecimalTokenAddresses;
        this._erc20ZeroDecimalTokenAddresses = erc20ZeroDecimalTokenAddresses;
        this._erc721Token = erc721Token;
        this._erc721Balances = erc721Balances;
        this._exchangeAddress = exchangeAddress;
        this._chainId = chainId;
    }
    public generateOrder(orderScenario: OrderScenario): Order {
        const makerAddress = this._userAddresses[1];
        let takerAddress = this._userAddresses[2];
        const erc721MakerAssetIds = this._erc721Balances[makerAddress][this._erc721Token.address];
        const erc721TakerAssetIds = this._erc721Balances[takerAddress][this._erc721Token.address];
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
            default:
                throw errorUtils.spawnSwitchErr('FeeRecipientAddressScenario', orderScenario.feeRecipientScenario);
        }

        switch (orderScenario.makerAssetDataScenario) {
            case AssetDataScenario.ERC20EighteenDecimals:
                makerAssetData = assetDataUtils.encodeERC20AssetData(this._erc20EighteenDecimalTokenAddresses[0]);
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                makerAssetData = assetDataUtils.encodeERC20AssetData(this._erc20FiveDecimalTokenAddresses[0]);
                break;
            case AssetDataScenario.ERC721:
                makerAssetData = assetDataUtils.encodeERC721AssetData(
                    this._erc721Token.address,
                    erc721MakerAssetIds[0],
                );
                break;
            case AssetDataScenario.ERC20ZeroDecimals:
                makerAssetData = assetDataUtils.encodeERC20AssetData(this._erc20ZeroDecimalTokenAddresses[0]);
                break;
            default:
                throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.makerAssetDataScenario);
        }

        switch (orderScenario.takerAssetDataScenario) {
            case AssetDataScenario.ERC20EighteenDecimals:
                takerAssetData = assetDataUtils.encodeERC20AssetData(this._erc20EighteenDecimalTokenAddresses[1]);
                break;
            case AssetDataScenario.ERC20FiveDecimals:
                takerAssetData = assetDataUtils.encodeERC20AssetData(this._erc20FiveDecimalTokenAddresses[1]);
                break;
            case AssetDataScenario.ERC721:
                takerAssetData = assetDataUtils.encodeERC721AssetData(
                    this._erc721Token.address,
                    erc721TakerAssetIds[0],
                );
                break;
            case AssetDataScenario.ERC20ZeroDecimals:
                takerAssetData = assetDataUtils.encodeERC20AssetData(this._erc20ZeroDecimalTokenAddresses[1]);
                break;
            default:
                throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.takerAssetDataScenario);
        }

        switch (orderScenario.makerAssetAmountScenario) {
            case OrderAssetAmountScenario.Large:
                switch (orderScenario.makerAssetDataScenario) {
                    case AssetDataScenario.ERC20EighteenDecimals:
                        makerAssetAmount = TEN_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        makerAssetAmount = TEN_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                        makerAssetAmount = ONE_NFT_UNIT;
                        break;
                    case AssetDataScenario.ERC20ZeroDecimals:
                        makerAssetAmount = ONE_THOUSAND_UNITS_ZERO_DECIMALS;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.makerAssetDataScenario);
                }
                break;
            case OrderAssetAmountScenario.Small:
                switch (orderScenario.makerAssetDataScenario) {
                    case AssetDataScenario.ERC20EighteenDecimals:
                        makerAssetAmount = FIVE_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        makerAssetAmount = FIVE_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                        makerAssetAmount = ONE_NFT_UNIT;
                        break;
                    case AssetDataScenario.ERC20ZeroDecimals:
                        makerAssetAmount = TEN_UNITS_ZERO_DECIMALS;
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
                        takerAssetAmount = TEN_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        takerAssetAmount = TEN_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                        takerAssetAmount = ONE_NFT_UNIT;
                        break;
                    case AssetDataScenario.ERC20ZeroDecimals:
                        takerAssetAmount = ONE_THOUSAND_UNITS_ZERO_DECIMALS;
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('AssetDataScenario', orderScenario.takerAssetDataScenario);
                }
                break;
            case OrderAssetAmountScenario.Small:
                switch (orderScenario.takerAssetDataScenario) {
                    case AssetDataScenario.ERC20EighteenDecimals:
                        takerAssetAmount = FIVE_UNITS_EIGHTEEN_DECIMALS;
                        break;
                    case AssetDataScenario.ERC20FiveDecimals:
                        takerAssetAmount = FIVE_UNITS_FIVE_DECIMALS;
                        break;
                    case AssetDataScenario.ERC721:
                        takerAssetAmount = ONE_NFT_UNIT;
                        break;
                    case AssetDataScenario.ERC20ZeroDecimals:
                        takerAssetAmount = TEN_UNITS_ZERO_DECIMALS;
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

        const feeFromScenario = (
            feeAmountScenario: OrderAssetAmountScenario,
            feeAssetDataScenario: FeeAssetDataScenario,
            erc20EighteenDecimalTokenAddress: string,
            erc20FiveDecimalTokenAddress: string,
            erc20ZeroDecimalTokenAddress: string,
            erc721AssetId: BigNumber,
        ): [BigNumber, string] => {
            const feeAmount = getFeeAmountFromScenario(orderScenario, feeAssetDataScenario, feeAmountScenario);
            switch (feeAssetDataScenario) {
                case FeeAssetDataScenario.MakerToken:
                    return [feeAmount, makerAssetData];
                case FeeAssetDataScenario.TakerToken:
                    return [feeAmount, takerAssetData];
                case FeeAssetDataScenario.ERC20EighteenDecimals:
                    return [feeAmount, assetDataUtils.encodeERC20AssetData(erc20EighteenDecimalTokenAddress)];
                case FeeAssetDataScenario.ERC20FiveDecimals:
                    return [feeAmount, assetDataUtils.encodeERC20AssetData(erc20FiveDecimalTokenAddress)];
                case FeeAssetDataScenario.ERC20ZeroDecimals:
                    return [feeAmount, assetDataUtils.encodeERC20AssetData(erc20ZeroDecimalTokenAddress)];
                case FeeAssetDataScenario.ERC721:
                    return [feeAmount, assetDataUtils.encodeERC721AssetData(this._erc721Token.address, erc721AssetId)];
                default:
                    throw errorUtils.spawnSwitchErr('FeeAssetDataScenario', feeAssetDataScenario);
            }
        };

        [makerFee, makerFeeAssetData] = feeFromScenario(
            orderScenario.makerFeeScenario,
            orderScenario.makerFeeAssetDataScenario,
            this._erc20EighteenDecimalTokenAddresses[2],
            this._erc20FiveDecimalTokenAddresses[2],
            this._erc20ZeroDecimalTokenAddresses[2],
            erc721MakerAssetIds[1],
        );
        [takerFee, takerFeeAssetData] = feeFromScenario(
            orderScenario.takerFeeScenario,
            orderScenario.takerFeeAssetDataScenario,
            this._erc20EighteenDecimalTokenAddresses[3],
            this._erc20FiveDecimalTokenAddresses[3],
            this._erc20ZeroDecimalTokenAddresses[3],
            erc721TakerAssetIds[1],
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
            domain: {
                verifyingContractAddress: this._exchangeAddress,
                chainId: this._chainId,
            },
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
        case FeeAssetDataScenario.MakerToken:
            return getFeeAmountFromScenario(orderScenario, orderScenario.makerAssetDataScenario, feeAmountScenario);
        case FeeAssetDataScenario.TakerToken:
            return getFeeAmountFromScenario(orderScenario, orderScenario.takerAssetDataScenario, feeAmountScenario);
        default:
            throw errorUtils.spawnSwitchErr('FeeAssetDataScenario', feeAssetDataScenario);
    }
}
