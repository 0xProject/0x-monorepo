import { ContractWrappersError, ECSignature, ExchangeContractErrs, ZeroEx } from '0x.js';
import { OrderError } from '@0xproject/order-utils';
import { constants as sharedConstants, EtherscanLinkSuffixes, Networks } from '@0xproject/react-shared';
import { Provider } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import deepEqual = require('deep-equal');
import * as _ from 'lodash';
import * as moment from 'moment';
import {
    BlockchainCallErrs,
    Environments,
    Order,
    Providers,
    ScreenWidths,
    Side,
    SideToAssetToken,
    Token,
    TokenByAddress,
} from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import * as u2f from 'ts/vendor/u2f_api';

const LG_MIN_EM = 64;
const MD_MIN_EM = 52;

const isDogfood = (): boolean => _.includes(window.location.href, configs.DOMAIN_DOGFOOD);

export const utils = {
    noop(): void {
        return undefined;
    },
    assert(condition: boolean, message: string): void {
        if (!condition) {
            throw new Error(message);
        }
    },
    spawnSwitchErr(name: string, value: any): Error {
        return new Error(`Unexpected switch value: ${value} encountered for ${name}`);
    },
    isNumeric(n: string): boolean {
        return !isNaN(parseFloat(n)) && isFinite(Number(n));
    },
    // This default unix timestamp is used for orders where the user does not specify an expiry date.
    // It is a fixed constant so that both the redux store's INITIAL_STATE and components can check for
    // whether a user has set an expiry date or not. It is set unrealistically high so as not to collide
    // with actual values a user would select.
    initialOrderExpiryUnixTimestampSec(): BigNumber {
        const m = moment('2050-01-01');
        return new BigNumber(m.unix());
    },
    convertToUnixTimestampSeconds(date: moment.Moment, time?: moment.Moment): BigNumber {
        const finalMoment = date;
        if (!_.isUndefined(time)) {
            finalMoment.hours(time.hours());
            finalMoment.minutes(time.minutes());
        }
        return new BigNumber(finalMoment.unix());
    },
    convertToMomentFromUnixTimestamp(unixTimestampSec: BigNumber): moment.Moment {
        return moment.unix(unixTimestampSec.toNumber());
    },
    convertToReadableDateTimeFromUnixTimestamp(unixTimestampSec: BigNumber): string {
        const m = this.convertToMomentFromUnixTimestamp(unixTimestampSec);
        const formattedDate: string = m.format('h:MMa MMMM D YYYY');
        return formattedDate;
    },
    generateOrder(
        exchangeContractAddress: string,
        sideToAssetToken: SideToAssetToken,
        expirationUnixTimestampSec: BigNumber,
        orderTakerAddress: string,
        orderMakerAddress: string,
        makerFee: BigNumber,
        takerFee: BigNumber,
        feeRecipient: string,
        ecSignature: ECSignature,
        tokenByAddress: TokenByAddress,
        orderSalt: BigNumber,
    ): Order {
        const makerToken = tokenByAddress[sideToAssetToken[Side.Deposit].address];
        const takerToken = tokenByAddress[sideToAssetToken[Side.Receive].address];
        const order = {
            signedOrder: {
                maker: orderMakerAddress,
                taker: orderTakerAddress,
                makerFee: makerFee.toString(),
                takerFee: takerFee.toString(),
                makerTokenAmount: sideToAssetToken[Side.Deposit].amount.toString(),
                takerTokenAmount: sideToAssetToken[Side.Receive].amount.toString(),
                makerTokenAddress: makerToken.address,
                takerTokenAddress: takerToken.address,
                expirationUnixTimestampSec: expirationUnixTimestampSec.toString(),
                feeRecipient,
                salt: orderSalt.toString(),
                ecSignature,
                exchangeContractAddress,
            },
            metadata: {
                makerToken: {
                    name: makerToken.name,
                    symbol: makerToken.symbol,
                    decimals: makerToken.decimals,
                },
                takerToken: {
                    name: takerToken.name,
                    symbol: takerToken.symbol,
                    decimals: takerToken.decimals,
                },
            },
        };
        return order;
    },
    async sleepAsync(ms: number): Promise<NodeJS.Timer> {
        return new Promise<NodeJS.Timer>(resolve => setTimeout(resolve, ms));
    },
    deepEqual(actual: any, expected: any, opts?: { strict: boolean }): boolean {
        return deepEqual(actual, expected, opts);
    },
    getColSize(items: number): number {
        const bassCssGridSize = 12; // Source: http://basscss.com/#basscss-grid
        const colSize = bassCssGridSize / items;
        if (!_.isInteger(colSize)) {
            throw new Error(`Number of cols must be divisible by ${bassCssGridSize}`);
        }
        return colSize;
    },
    getScreenWidth(): ScreenWidths {
        const documentEl = document.documentElement;
        const body = document.getElementsByTagName('body')[0];
        const widthInPx = window.innerWidth || documentEl.clientWidth || body.clientWidth;
        const bodyStyles: any = window.getComputedStyle(document.querySelector('body'));
        const widthInEm = widthInPx / parseFloat(bodyStyles['font-size']);

        // This logic mirrors the CSS media queries in BassCSS for the `lg-`, `md-` and `sm-` CSS
        // class prefixes. Do not edit these.
        if (widthInEm > LG_MIN_EM) {
            return ScreenWidths.Lg;
        } else if (widthInEm > MD_MIN_EM) {
            return ScreenWidths.Md;
        } else {
            return ScreenWidths.Sm;
        }
    },
    async isU2FSupportedAsync(): Promise<boolean> {
        const w = window as any;
        return new Promise((resolve: (isSupported: boolean) => void) => {
            if (w.u2f && !w.u2f.getApiVersion) {
                // u2f object was found (Firefox with extension)
                resolve(true);
            } else {
                // u2f object was not found. Using Google polyfill
                // HACK: u2f.getApiVersion will simply not return a version if the
                // U2F call fails for any reason. Because of this, we set a hard 3sec
                // timeout to the request on our end.
                const getApiVersionTimeoutMs = 3000;
                const intervalId = setTimeout(() => {
                    resolve(false);
                }, getApiVersionTimeoutMs);
                u2f.getApiVersion((version: number) => {
                    clearTimeout(intervalId);
                    resolve(true);
                });
            }
        });
    },
    // This checks the error message returned from an injected Web3 instance on the page
    // after a user was prompted to sign a message or send a transaction and decided to
    // reject the request.
    didUserDenyWeb3Request(errMsg: string): boolean {
        const metamaskDenialErrMsg = 'User denied';
        const paritySignerDenialErrMsg = 'Request has been rejected';
        const ledgerDenialErrMsg = 'Invalid status 6985';
        const isUserDeniedErrMsg =
            _.includes(errMsg, metamaskDenialErrMsg) ||
            _.includes(errMsg, paritySignerDenialErrMsg) ||
            _.includes(errMsg, ledgerDenialErrMsg);
        return isUserDeniedErrMsg;
    },
    getCurrentEnvironment(): string {
        switch (location.host) {
            case configs.DOMAIN_DEVELOPMENT:
                return 'development';
            case configs.DOMAIN_STAGING:
                return 'staging';
            case configs.DOMAIN_PRODUCTION:
                return 'production';
            default:
                return 'production';
        }
    },
    getAddressBeginAndEnd(address: string): string {
        const truncatedAddress = `${address.substring(0, 6)}...${address.substr(-4)}`; // 0x3d5a...b287
        return truncatedAddress;
    },
    hasUniqueNameAndSymbol(tokens: Token[], token: Token): boolean {
        if (token.isRegistered) {
            return true; // Since it's registered, it is the canonical token
        }
        const registeredTokens = _.filter(tokens, t => t.isRegistered);
        const tokenWithSameNameIfExists = _.find(registeredTokens, {
            name: token.name,
        });
        const isUniqueName = _.isUndefined(tokenWithSameNameIfExists);
        const tokenWithSameSymbolIfExists = _.find(registeredTokens, {
            name: token.symbol,
        });
        const isUniqueSymbol = _.isUndefined(tokenWithSameSymbolIfExists);
        return isUniqueName && isUniqueSymbol;
    },
    zeroExErrToHumanReadableErrMsg(error: ContractWrappersError | ExchangeContractErrs, takerAddress: string): string {
        const ContractWrappersErrorToHumanReadableError: { [error: string]: string } = {
            [ContractWrappersError.ExchangeContractDoesNotExist]: 'Exchange contract does not exist',
            [ContractWrappersError.EtherTokenContractDoesNotExist]: 'EtherToken contract does not exist',
            [ContractWrappersError.TokenTransferProxyContractDoesNotExist]:
                'TokenTransferProxy contract does not exist',
            [ContractWrappersError.TokenRegistryContractDoesNotExist]: 'TokenRegistry contract does not exist',
            [ContractWrappersError.TokenContractDoesNotExist]: 'Token contract does not exist',
            [ContractWrappersError.ZRXContractDoesNotExist]: 'ZRX contract does not exist',
            [BlockchainCallErrs.UserHasNoAssociatedAddresses]: 'User has no addresses available',
            [OrderError.InvalidSignature]: 'Order signature is not valid',
            [ContractWrappersError.ContractNotDeployedOnNetwork]: 'Contract is not deployed on the detected network',
            [ContractWrappersError.InvalidJump]: 'Invalid jump occured while executing the transaction',
            [ContractWrappersError.OutOfGas]: 'Transaction ran out of gas',
        };
        const exchangeContractErrorToHumanReadableError: {
            [error: string]: string;
        } = {
            [ExchangeContractErrs.OrderFillExpired]: 'This order has expired',
            [ExchangeContractErrs.OrderCancelExpired]: 'This order has expired',
            [ExchangeContractErrs.OrderCancelAmountZero]: "Order cancel amount can't be 0",
            [ExchangeContractErrs.OrderAlreadyCancelledOrFilled]:
                'This order has already been completely filled or cancelled',
            [ExchangeContractErrs.OrderFillAmountZero]: "Order fill amount can't be 0",
            [ExchangeContractErrs.OrderRemainingFillAmountZero]:
                'This order has already been completely filled or cancelled',
            [ExchangeContractErrs.OrderFillRoundingError]:
                'Rounding error will occur when filling this order. Please try filling a different amount.',
            [ExchangeContractErrs.InsufficientTakerBalance]:
                'Taker no longer has a sufficient balance to complete this order',
            [ExchangeContractErrs.InsufficientTakerAllowance]:
                'Taker no longer has a sufficient allowance to complete this order',
            [ExchangeContractErrs.InsufficientMakerBalance]:
                'Maker no longer has a sufficient balance to complete this order',
            [ExchangeContractErrs.InsufficientMakerAllowance]:
                'Maker no longer has a sufficient allowance to complete this order',
            [ExchangeContractErrs.InsufficientTakerFeeBalance]: 'Taker no longer has a sufficient balance to pay fees',
            [ExchangeContractErrs.InsufficientTakerFeeAllowance]:
                'Taker no longer has a sufficient allowance to pay fees',
            [ExchangeContractErrs.InsufficientMakerFeeBalance]: 'Maker no longer has a sufficient balance to pay fees',
            [ExchangeContractErrs.InsufficientMakerFeeAllowance]:
                'Maker no longer has a sufficient allowance to pay fees',
            [ExchangeContractErrs.TransactionSenderIsNotFillOrderTaker]: `This order can only be filled by ${takerAddress}`,
            [ExchangeContractErrs.InsufficientRemainingFillAmount]: 'Insufficient remaining fill amount',
        };
        const humanReadableErrorMsg =
            exchangeContractErrorToHumanReadableError[error] || ContractWrappersErrorToHumanReadableError[error];
        return humanReadableErrorMsg;
    },
    isParityNode(nodeVersion: string): boolean {
        return _.includes(nodeVersion, 'Parity');
    },
    isTestRpc(nodeVersion: string): boolean {
        return _.includes(nodeVersion, 'TestRPC');
    },
    isTestNetwork(networkId: number): boolean {
        const isTestNetwork = _.includes(
            [
                sharedConstants.NETWORK_ID_BY_NAME[Networks.Kovan],
                sharedConstants.NETWORK_ID_BY_NAME[Networks.Rinkeby],
                sharedConstants.NETWORK_ID_BY_NAME[Networks.Ropsten],
            ],
            networkId,
        );
        return isTestNetwork;
    },
    getCurrentBaseUrl(): string {
        const port = window.location.port;
        const hasPort = !_.isUndefined(port);
        const baseUrl = `https://${window.location.hostname}${hasPort ? `:${port}` : ''}`;
        return baseUrl;
    },
    async onPageLoadAsync(): Promise<void> {
        if (document.readyState === 'complete') {
            return; // Already loaded
        }
        return new Promise<void>((resolve, reject) => {
            window.onload = () => resolve();
        });
    },
    getProviderType(provider: Provider): Providers | string {
        const constructorName = provider.constructor.name;
        let parsedProviderName = constructorName;
        switch (constructorName) {
            case 'EthereumProvider':
                parsedProviderName = Providers.Mist;
                break;

            default:
                parsedProviderName = constructorName;
                break;
        }
        if ((provider as any).isParity) {
            parsedProviderName = Providers.Parity;
        } else if ((provider as any).isMetaMask) {
            parsedProviderName = Providers.Metamask;
        }
        return parsedProviderName;
    },
    getBackendBaseUrl(): string {
        return isDogfood() ? configs.BACKEND_BASE_STAGING_URL : configs.BACKEND_BASE_PROD_URL;
    },
    isDevelopment(): boolean {
        return configs.ENVIRONMENT === Environments.DEVELOPMENT;
    },
    isStaging(): boolean {
        return _.includes(window.location.href, configs.DOMAIN_STAGING);
    },
    isDogfood,
};
