import * as BigNumber from 'bignumber.js';
import * as BN from 'bn.js';
import * as ethUtil from 'ethereumjs-util';
import * as ethABI from 'ethereumjs-abi';
import * as _ from 'lodash';
import {constants} from './utils/constants';
import {assert} from './utils/assert';
import {ECSignatureSchema} from './schemas/ec_signature_schema';
import {SolidityTypes} from './types';

/**
 * Elliptic Curve signature
 */
export interface ECSignature {
    v: number;
    r: string;
    s: string;
}

const MAX_DIGITS_IN_UNSIGNED_256_INT = 78;

export class ZeroEx {
    public static getOrderHash(exchangeContractAddr: string, makerAddr: string, takerAddr: string,
                               depositTokenAddr: string, receiveTokenAddr: string, feeRecipient: string,
                               depositAmt: BigNumber.BigNumber, receiveAmt: BigNumber.BigNumber,
                               makerFee: BigNumber.BigNumber, takerFee: BigNumber.BigNumber,
                               expiration: BigNumber.BigNumber, salt: BigNumber.BigNumber): string {
        takerAddr = takerAddr !== '' ? takerAddr : constants.NULL_ADDRESS;
        assert.isETHAddressHex('exchangeContractAddr', exchangeContractAddr);
        assert.isETHAddressHex('makerAddr', makerAddr);
        assert.isETHAddressHex('takerAddr', takerAddr);
        assert.isETHAddressHex('depositTokenAddr', depositTokenAddr);
        assert.isETHAddressHex('receiveTokenAddr', receiveTokenAddr);
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        assert.isBigNumber('depositAmt', depositAmt);
        assert.isBigNumber('receiveAmt', receiveAmt);
        assert.isBigNumber('makerFee', makerFee);
        assert.isBigNumber('takerFee', takerFee);
        assert.isBigNumber('expiration', expiration);
        assert.isBigNumber('salt', salt);
        const orderParts = [
            {value: exchangeContractAddr, type: SolidityTypes.address},
            {value: makerAddr, type: SolidityTypes.address},
            {value: takerAddr, type: SolidityTypes.address},
            {value: depositTokenAddr, type: SolidityTypes.address},
            {value: receiveTokenAddr, type: SolidityTypes.address},
            {value: feeRecipient, type: SolidityTypes.address},
            {value: new BN(depositAmt.toString(), 10), type: SolidityTypes.uint256},
            {value: new BN(receiveAmt.toString(), 10), type: SolidityTypes.uint256},
            {value: new BN(makerFee.toString(), 10), type: SolidityTypes.uint256},
            {value: new BN(takerFee.toString(), 10), type: SolidityTypes.uint256},
            {value: new BN(expiration.toString(), 10), type: SolidityTypes.uint256},
            {value: new BN(salt.toString(), 10), type: SolidityTypes.uint256},
        ];
        const hashBuff = ethABI.soliditySHA3(_.map(orderParts, 'type'), _.map(orderParts, 'value'));
        const buffHashHex = ethUtil.bufferToHex(hashBuff);
        return buffHashHex;
    }
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
}
