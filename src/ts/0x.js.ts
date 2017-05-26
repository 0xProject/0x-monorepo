import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import * as BN from 'bn.js';
import * as ethUtil from 'ethereumjs-util';
import contract = require('truffle-contract');
import * as Web3 from 'web3';
import * as ethABI from 'ethereumjs-abi';
import {Web3Wrapper} from './web3_wrapper';
import {constants} from './utils/constants';
import {assert} from './utils/assert';
import {ExchangeWrapper} from './contract_wrappers/exchange_wrapper';
import {ECSignatureSchema} from './schemas/ec_signature_schema';
import {SolidityTypes, ECSignature} from './types';

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
            {value: this.bigNumberToBN(valueM), type: SolidityTypes.uint256},
            {value: this.bigNumberToBN(valueT), type: SolidityTypes.uint256},
            {value: this.bigNumberToBN(makerFee), type: SolidityTypes.uint256},
            {value: this.bigNumberToBN(takerFee), type: SolidityTypes.uint256},
            {value: this.bigNumberToBN(expiration), type: SolidityTypes.uint256},
            {value: this.bigNumberToBN(salt), type: SolidityTypes.uint256},
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
        assert.doesConformToSchema('signature', signature, ECSignatureSchema);
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
    /**
     * Converts BigNumber instance to BN
     * The only we convert to BN is to remain compatible with `ethABI. soliditySHA3 ` that
     * expects values of Solidity type `uint` to be of type `BN`.
     * We do not use BN anywhere else in the codebase.
     */
    private static bigNumberToBN(value: BigNumber.BigNumber) {
        return new BN(value.toString(), 10);
    }
    constructor(web3: Web3) {
        this.web3Wrapper = new Web3Wrapper(web3);
        this.exchange = new ExchangeWrapper(this.web3Wrapper);
    }
}
