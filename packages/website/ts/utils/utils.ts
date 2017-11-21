import * as _ from 'lodash';
import {
    SideToAssetToken,
    SignatureData,
    Order,
    Side,
    TokenByAddress,
    OrderParty,
    ScreenWidths,
    EtherscanLinkSuffixes,
    Token,
    Networks,
} from 'ts/types';
import * as moment from 'moment';
import isMobile = require('is-mobile');
import * as u2f from 'ts/vendor/u2f_api';
import deepEqual = require('deep-equal');
import ethUtil = require('ethereumjs-util');
import BigNumber from 'bignumber.js';
import {constants} from 'ts/utils/constants';

const LG_MIN_EM = 64;
const MD_MIN_EM = 52;

export const utils = {
    assert(condition: boolean, message: string) {
        if (!condition) {
            throw new Error(message);
        }
    },
    spawnSwitchErr(name: string, value: any) {
        return new Error(`Unexpected switch value: ${value} encountered for ${name}`);
    },
    isNumeric(n: string) {
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
    generateOrder(networkId: number, exchangeContract: string, sideToAssetToken: SideToAssetToken,
                  orderExpiryTimestamp: BigNumber, orderTakerAddress: string, orderMakerAddress: string,
                  makerFee: BigNumber, takerFee: BigNumber, feeRecipient: string,
                  signatureData: SignatureData, tokenByAddress: TokenByAddress, orderSalt: BigNumber): Order {
        const makerToken = tokenByAddress[sideToAssetToken[Side.deposit].address];
        const takerToken = tokenByAddress[sideToAssetToken[Side.receive].address];
        const order = {
            maker: {
                address: orderMakerAddress,
                token: {
                    name: makerToken.name,
                    symbol: makerToken.symbol,
                    decimals: makerToken.decimals,
                    address: makerToken.address,
                },
                amount: sideToAssetToken[Side.deposit].amount.toString(),
                feeAmount: makerFee.toString(),
            },
            taker: {
                address: orderTakerAddress,
                token: {
                    name: takerToken.name,
                    symbol: takerToken.symbol,
                    decimals: takerToken.decimals,
                    address: takerToken.address,
                },
                amount: sideToAssetToken[Side.receive].amount.toString(),
                feeAmount: takerFee.toString(),
            },
            expiration: orderExpiryTimestamp.toString(),
            feeRecipient,
            salt: orderSalt.toString(),
            signature: signatureData,
            exchangeContract,
            networkId,
        };
        return order;
    },
    consoleLog(message: string) {
        /* tslint:disable */
        console.log(message);
        /* tslint:enable */
    },
    sleepAsync(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    deepEqual(actual: any, expected: any, opts?: {strict: boolean}) {
        return deepEqual(actual, expected, opts);
    },
    getColSize(items: number) {
        const bassCssGridSize = 12; // Source: http://basscss.com/#basscss-grid
        const colSize = 12 / items;
        if (!_.isInteger(colSize)) {
            throw new Error('Number of cols must be divisible by 12');
        }
        return colSize;
    },
    getScreenWidth() {
        const documentEl = document.documentElement;
        const body = document.getElementsByTagName('body')[0];
        const widthInPx = window.innerWidth || documentEl.clientWidth || body.clientWidth;
        const bodyStyles: any = window.getComputedStyle(document.querySelector('body'));
        const widthInEm = widthInPx / parseFloat(bodyStyles['font-size']);

        // This logic mirrors the CSS media queries in BassCSS for the `lg-`, `md-` and `sm-` CSS
        // class prefixes. Do not edit these.
        if (widthInEm > LG_MIN_EM) {
            return ScreenWidths.LG;
        } else if (widthInEm > MD_MIN_EM) {
            return ScreenWidths.MD;
        } else {
            return ScreenWidths.SM;
        }
    },
    isUserOnMobile(): boolean {
        const isUserOnMobile = isMobile();
        return isUserOnMobile;
    },
    getEtherScanLinkIfExists(addressOrTxHash: string, networkId: number, suffix: EtherscanLinkSuffixes): string {
        const networkName = constants.networkNameById[networkId];
        if (_.isUndefined(networkName)) {
            return undefined;
        }
        const etherScanPrefix = networkName === Networks.mainnet ? '' : `${networkName.toLowerCase()}.`;
        return `https://${etherScanPrefix}etherscan.io/${suffix}/${addressOrTxHash}`;
    },
    setUrlHash(anchorId: string) {
        window.location.hash = anchorId;
    },
    async isU2FSupportedAsync(): Promise<boolean> {
        const w = (window as any);
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
    didUserDenyWeb3Request(errMsg: string) {
        const metamaskDenialErrMsg = 'User denied message';
        const paritySignerDenialErrMsg = 'Request has been rejected';
        const ledgerDenialErrMsg = 'Invalid status 6985';
        const isUserDeniedErrMsg = _.includes(errMsg, metamaskDenialErrMsg) ||
                                   _.includes(errMsg, paritySignerDenialErrMsg) ||
                                   _.includes(errMsg, ledgerDenialErrMsg);
        return isUserDeniedErrMsg;
    },
    getCurrentEnvironment() {
        switch (location.host) {
            case constants.DEVELOPMENT_DOMAIN:
                return 'development';
            case constants.STAGING_DOMAIN:
                return 'staging';
            case constants.PRODUCTION_DOMAIN:
                return 'production';
            default:
                return 'production';
        }
    },
    getIdFromName(name: string) {
        const id = name.replace(/ /g, '-');
        return id;
    },
    getAddressBeginAndEnd(address: string): string {
        const truncatedAddress = `${address.substring(0, 6)}...${address.substr(-4)}`; // 0x3d5a...b287
        return truncatedAddress;
    },
    hasUniqueNameAndSymbol(tokens: Token[], token: Token) {
        if (token.isRegistered) {
            return true; // Since it's registered, it is the canonical token
        }
        const registeredTokens = _.filter(tokens, t => t.isRegistered);
        const tokenWithSameNameIfExists = _.find(registeredTokens, {name: token.name});
        const isUniqueName = _.isUndefined(tokenWithSameNameIfExists);
        const tokenWithSameSymbolIfExists = _.find(registeredTokens, {name: token.symbol});
        const isUniqueSymbol = _.isUndefined(tokenWithSameSymbolIfExists);
        return isUniqueName && isUniqueSymbol;
    },
};
