import * as BigNumber from 'bignumber.js';
import * as ethUtil from 'ethereumjs-util';
import Web3 from 'web3';
import {assert} from './utils/assert';
import {Web3Wrapper} from './web3_wrapper';
import {ExchangeWrapper} from './contract_wrappers/exchange_wrapper';
import contract = require('truffle-contract');
import {ECSignatureSchema} from './schemas/ec_signature_schema';
import {ECSignature} from './types';

const MAX_DIGITS_IN_UNSIGNED_256_INT = 78;

export class ZeroEx {
    public web3Wrapper: Web3Wrapper;
    public exchange: ExchangeWrapper;
    /**
     * Verifies that the elliptic curve signature `signature` was generated
     * by signing `data` with the private key corresponding to the `signerAddressHex` address.
     */
    public static isValidSignature(dataHex: string, signature: ECSignature, signerAddressHex: string): boolean {
        assert.isHexString('dataHex', dataHex);
        assert.doesConformToSchema('signature', signature, ECSignatureSchema);
        assert.isETHAddressHex('signerAddressHex', signerAddressHex);

        const dataBuff = ethUtil.toBuffer(dataHex);
        const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
        try {
            const pubKey = ethUtil.ecrecover(msgHashBuff,
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
    /*
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
    /*
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
}
