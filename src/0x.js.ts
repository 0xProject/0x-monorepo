import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import * as ethUtil from 'ethereumjs-util';
import contract = require('truffle-contract');
import * as Web3 from 'web3';
import * as ethABI from 'ethereumjs-abi';
import {Web3Wrapper} from './web3_wrapper';
import {constants} from './utils/constants';
import {utils} from './utils/utils';
import {assert} from './utils/assert';
import findVersions = require('find-versions');
import compareVersions = require('compare-versions');
import {ExchangeWrapper} from './contract_wrappers/exchange_wrapper';
import {ecSignatureSchema} from './schemas/ec_signature_schema';
import {SolidityTypes, ECSignature, ZeroExError} from './types';

const MAX_DIGITS_IN_UNSIGNED_256_INT = 78;

export class ZeroEx {
    public web3Wrapper: Web3Wrapper;
    public exchange: ExchangeWrapper;
    /**
     * Computes the orderHash given the order parameters and returns it as a hex encoded string.
     */
    public static getOrderHashHex(exchangeContractAddr: string, makerAddr: string, takerAddr: string,
                                  tokenMAddress: string, tokenTAddress: string, feeRecipient: string,
                                  valueM: BigNumber.BigNumber, valueT: BigNumber.BigNumber,
                                  makerFee: BigNumber.BigNumber, takerFee: BigNumber.BigNumber,
                                  expiration: BigNumber.BigNumber, salt: BigNumber.BigNumber): string {
        takerAddr = _.isEmpty(takerAddr) ? constants.NULL_ADDRESS : takerAddr ;
        assert.isETHAddressHex('exchangeContractAddr', exchangeContractAddr);
        assert.isETHAddressHex('makerAddr', makerAddr);
        assert.isETHAddressHex('takerAddr', takerAddr);
        assert.isETHAddressHex('tokenMAddress', tokenMAddress);
        assert.isETHAddressHex('tokenTAddress', tokenTAddress);
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        assert.isBigNumber('valueM', valueM);
        assert.isBigNumber('valueT', valueT);
        assert.isBigNumber('makerFee', makerFee);
        assert.isBigNumber('takerFee', takerFee);
        assert.isBigNumber('expiration', expiration);
        assert.isBigNumber('salt', salt);

        const orderParts = [
            {value: exchangeContractAddr, type: SolidityTypes.address},
            {value: makerAddr, type: SolidityTypes.address},
            {value: takerAddr, type: SolidityTypes.address},
            {value: tokenMAddress, type: SolidityTypes.address},
            {value: tokenTAddress, type: SolidityTypes.address},
            {value: feeRecipient, type: SolidityTypes.address},
            {value: utils.bigNumberToBN(valueM), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(valueT), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(makerFee), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(takerFee), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(expiration), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(salt), type: SolidityTypes.uint256},
        ];
        const types = _.map(orderParts, o => o.type);
        const values = _.map(orderParts, o => o.value);
        const hashBuff = ethABI.soliditySHA3(types, values);
        const hashHex = ethUtil.bufferToHex(hashBuff);
        return hashHex;
    }
    /**
     * Verifies that the elliptic curve signature `signature` was generated
     * by signing `data` with the private key corresponding to the `signerAddressHex` address.
     */
    public static isValidSignature(dataHex: string, signature: ECSignature, signerAddressHex: string): boolean {
        assert.isHexString('dataHex', dataHex);
        assert.doesConformToSchema('signature', signature, ecSignatureSchema);
        assert.isETHAddressHex('signerAddressHex', signerAddressHex);

        const dataBuff = ethUtil.toBuffer(dataHex);
        const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
        try {
            const pubKey = ethUtil.ecrecover(
                msgHashBuff,
                signature.v,
                ethUtil.toBuffer(signature.r),
                ethUtil.toBuffer(signature.s));
            const retrievedAddress = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
            return retrievedAddress === signerAddressHex;
        } catch (err) {
            return false;
        }
    }
    /**
     * Generates pseudo-random 256 bit salt.
     * The salt is used to ensure that the 0x order generated has a unique orderHash that does
     * not collide with any other outstanding orders.
     */
    public static generatePseudoRandomSalt(): BigNumber.BigNumber {
        // BigNumber.random returns a pseudo-random number between 0 & 1 with a passed in number of decimal places.
        // Source: https://mikemcl.github.io/bignumber.js/#random
        const randomNumber = BigNumber.random(MAX_DIGITS_IN_UNSIGNED_256_INT);
        const factor = new BigNumber(10).pow(MAX_DIGITS_IN_UNSIGNED_256_INT - 1);
        const salt = randomNumber.times(factor).round();
        return salt;
    }
    /** Checks if order hash is valid */
    public static isValidOrderHash(orderHash: string): boolean {
        assert.isString('orderHash', orderHash);
        const isValid = /^0x[0-9A-F]{64}$/i.test(orderHash);
        return isValid;
    }
    /**
     * A unit amount is defined as the amount of a token above the specified decimal places (integer part).
     * E.g: If a currency has 18 decimal places, 1e18 or one quintillion of the currency is equivalent
     * to 1 unit.
     */
    public static toUnitAmount(amount: BigNumber.BigNumber, decimals: number): BigNumber.BigNumber {
        assert.isBigNumber('amount', amount);
        assert.isNumber('decimals', decimals);

        const aUnit = new BigNumber(10).pow(decimals);
        const unit = amount.div(aUnit);
        return unit;
    }
    /**
     * A baseUnit is defined as the smallest denomination of a token. An amount expressed in baseUnits
     * is the amount expressed in the smallest denomination.
     * E.g: 1 unit of a token with 18 decimal places is expressed in baseUnits as 1000000000000000000
     */
    public static toBaseUnitAmount(amount: BigNumber.BigNumber, decimals: number): BigNumber.BigNumber {
        assert.isBigNumber('amount', amount);
        assert.isNumber('decimals', decimals);

        const unit = new BigNumber(10).pow(decimals);
        const baseUnitAmount = amount.times(unit);
        return baseUnitAmount;
    }
    constructor(web3: Web3) {
        this.web3Wrapper = new Web3Wrapper(web3);
        this.exchange = new ExchangeWrapper(this.web3Wrapper);
    }
    /**
     * Signs an orderHash and returns it's elliptic curve signature
     * This method currently supports TestRPC, Geth and Parity above and below V1.6.6
     */
    public async signOrderHashAsync(orderHashHex: string): Promise<ECSignature> {
        assert.isHexString('orderHashHex', orderHashHex);

        let msgHashHex;
        const nodeVersion = await this.web3Wrapper.getNodeVersionAsync();
        const isParityNode = utils.isParityNode(nodeVersion);
        if (isParityNode) {
            // Parity node adds the personalMessage prefix itself
            msgHashHex = orderHashHex;
        } else {
            const orderHashBuff = ethUtil.toBuffer(orderHashHex);
            const msgHashBuff = ethUtil.hashPersonalMessage(orderHashBuff);
            msgHashHex = ethUtil.bufferToHex(msgHashBuff);
        }

        const makerAddressIfExists = await this.web3Wrapper.getSenderAddressIfExistsAsync();
        if (_.isUndefined(makerAddressIfExists)) {
            throw new Error(ZeroExError.USER_HAS_NO_ASSOCIATED_ADDRESSES);
        }

        const signature = await this.web3Wrapper.signTransactionAsync(makerAddressIfExists, msgHashHex);

        let signatureData;
        const [nodeVersionNumber] = findVersions(nodeVersion);
        // Parity v1.6.6 and earlier returns the signatureData as vrs instead of rsv as Geth does
        // Later versions return rsv but for the time being we still want to support version < 1.6.6
        // Date: May 23rd 2017
        const latestParityVersionWithVRS = '1.6.6';
        const isVersionBeforeParityFix = compareVersions(nodeVersionNumber, latestParityVersionWithVRS) <= 0;
        if (isParityNode && isVersionBeforeParityFix) {
            const signatureBuffer = ethUtil.toBuffer(signature);
            let v = signatureBuffer[0];
            if (v < 27) {
                v += 27;
            }
            signatureData = {
                v,
                r: signatureBuffer.slice(1, 33),
                s: signatureBuffer.slice(33, 65),
            };
        } else {
            signatureData = ethUtil.fromRpcSig(signature);
        }

        const {v, r, s} = signatureData;
        const ecSignature: ECSignature = {
            v,
            r: ethUtil.bufferToHex(r),
            s: ethUtil.bufferToHex(s),
        };
        const isValidSignature = ZeroEx.isValidSignature(orderHashHex, ecSignature, makerAddressIfExists);
        if (!isValidSignature) {
            throw new Error(ZeroExError.INVALID_SIGNATURE);
        }
        return ecSignature;
    }
}
