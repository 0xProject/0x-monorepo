import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {bigNumberConfigs} from './bignumber_config';
import * as ethUtil from 'ethereumjs-util';
import contract = require('truffle-contract');
import * as Web3 from 'web3';
import findVersions = require('find-versions');
import compareVersions = require('compare-versions');
import {Web3Wrapper} from './web3_wrapper';
import {constants} from './utils/constants';
import {utils} from './utils/utils';
import {assert} from './utils/assert';
import {ExchangeWrapper} from './contract_wrappers/exchange_wrapper';
import {TokenRegistryWrapper} from './contract_wrappers/token_registry_wrapper';
import {EtherTokenWrapper} from './contract_wrappers/ether_token_wrapper';
import {ecSignatureSchema} from './schemas/ec_signature_schema';
import {TokenWrapper} from './contract_wrappers/token_wrapper';
import {ProxyWrapper} from './contract_wrappers/proxy_wrapper';
import {ECSignature, ZeroExError, Order, SignedOrder, Web3Provider} from './types';
import {orderSchema} from './schemas/order_schemas';

// Customize our BigNumber instances
bigNumberConfigs.configure();

/**
 * The ZeroEx class is the single entry-point into the 0x.js library. It contains all of the library's functionality
 * and all calls to the library should be made through a ZeroEx instance.
 */
export class ZeroEx {
    /**
     * When creating an order without a specified taker or feeRecipient you must supply the Solidity
     * address null type (as opposed to Javascripts `null`, `undefined` or empty string). We expose
     * this constant for your convenience.
     */
    public static NULL_ADDRESS = constants.NULL_ADDRESS;

    /**
     * An instance of the ExchangeWrapper class containing methods for interacting with the 0x Exchange smart contract.
     */
    public exchange: ExchangeWrapper;
    /**
     * An instance of the TokenRegistryWrapper class containing methods for interacting with the 0x
     * TokenRegistry smart contract.
     */
    public tokenRegistry: TokenRegistryWrapper;
    /**
     * An instance of the TokenWrapper class containing methods for interacting with any ERC20 token smart contract.
     */
    public token: TokenWrapper;
    /**
     * An instance of the EtherTokenWrapper class containing methods for interacting with the
     * wrapped ETH ERC20 token smart contract.
     */
    public etherToken: EtherTokenWrapper;
    private _proxy: ProxyWrapper;
    private _web3Wrapper: Web3Wrapper;
    /**
     * Verifies that the elliptic curve signature `signature` was generated
     * by signing `data` with the private key corresponding to the `signerAddress` address.
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     An object containing the elliptic curve signature parameters.
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the signature is valid for the supplied signerAddress and data.
     */
    public static isValidSignature(data: string, signature: ECSignature, signerAddress: string): boolean {
        assert.isHexString('data', data);
        assert.doesConformToSchema('signature', signature, ecSignatureSchema);
        assert.isETHAddressHex('signerAddress', signerAddress);

        const dataBuff = ethUtil.toBuffer(data);
        const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
        try {
            const pubKey = ethUtil.ecrecover(
                msgHashBuff,
                signature.v,
                ethUtil.toBuffer(signature.r),
                ethUtil.toBuffer(signature.s));
            const retrievedAddress = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
            return retrievedAddress === signerAddress;
        } catch (err) {
            return false;
        }
    }
    /**
     * Generates a pseudo-random 256-bit salt.
     * The salt can be included in an 0x order, ensuring that the order generates a unique orderHash
     * and will not collide with other outstanding orders that are identical in all other parameters.
     * @return  A pseudo-random 256-bit number that can be used as a salt.
     */
    public static generatePseudoRandomSalt(): BigNumber.BigNumber {
        // BigNumber.random returns a pseudo-random number between 0 & 1 with a passed in number of decimal places.
        // Source: https://mikemcl.github.io/bignumber.js/#random
        const randomNumber = BigNumber.random(constants.MAX_DIGITS_IN_UNSIGNED_256_INT);
        const factor = new BigNumber(10).pow(constants.MAX_DIGITS_IN_UNSIGNED_256_INT - 1);
        const salt = randomNumber.times(factor).round();
        return salt;
    }
    /**
     * Checks if the supplied hex encoded order hash is valid.
     * Note: Valid means it has the expected format, not that an order with the orderHash exists.
     * Use this method when processing orderHashes submitted as user input.
     * @param   orderHash    Hex encoded orderHash.
     * @return  Whether the supplied orderHash has the expected format.
     */
    public static isValidOrderHash(orderHash: string): boolean {
        // Since this method can be called to check if any arbitrary string conforms to an orderHash's
        // format, we only assert that we were indeed passed a string.
        assert.isString('orderHash', orderHash);
        const isValidOrderHash = utils.isValidOrderHash(orderHash);
        return isValidOrderHash;
    }
    /**
     * A unit amount is defined as the amount of a token above the specified decimal places (integer part).
     * E.g: If a currency has 18 decimal places, 1e18 or one quintillion of the currency is equivalent
     * to 1 unit.
     * @param   amount      The amount in baseUnits that you would like converted to units.
     * @param   decimals    The number of decimal places the unit amount has.
     * @return  The amount in units.
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
     * @param   amount      The amount of units that you would like converted to baseUnits.
     * @param   decimals    The number of decimal places the unit amount has.
     * @return  The amount in baseUnits.
     */
    public static toBaseUnitAmount(amount: BigNumber.BigNumber, decimals: number): BigNumber.BigNumber {
        assert.isBigNumber('amount', amount);
        assert.isNumber('decimals', decimals);

        const unit = new BigNumber(10).pow(decimals);
        const baseUnitAmount = amount.times(unit);
        return baseUnitAmount;
    }
    /**
     * Instantiates a new ZeroEx instance that provides the public interface to the 0x.js library.
     * @param   provider    The Web3.js Provider instance you would like the 0x.js library to use for interacting with
     *                      the Ethereum network.
     * @return  An instance of the 0x.js ZeroEx class.
     */
    constructor(provider: Web3Provider) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this.token = new TokenWrapper(this._web3Wrapper);
        this._proxy = new ProxyWrapper(this._web3Wrapper);
        this.exchange = new ExchangeWrapper(this._web3Wrapper, this.token, this._proxy);
        this.tokenRegistry = new TokenRegistryWrapper(this._web3Wrapper);
        this.etherToken = new EtherTokenWrapper(this._web3Wrapper, this.token);
    }
    /**
     * Sets a new provider for the web3 instance used by 0x.js. Updating the provider will stop all
     * subscriptions so you will need to re-subscribe to all events relevant to your app after this call.
     * @param   provider    The Web3Provider you would like the 0x.js library to use from now on.
     */
    public async setProviderAsync(provider: Web3Provider) {
        this._web3Wrapper.setProvider(provider);
        await this.exchange.invalidateContractInstanceAsync();
        this.tokenRegistry.invalidateContractInstance();
        this.token.invalidateContractInstances();
        this._proxy.invalidateContractInstance();
    }
    /**
     * Get user Ethereum addresses available through the supplied web3 instance available for sending transactions.
     * @return  An array of available user Ethereum addresses.
     */
    public async getAvailableAddressesAsync(): Promise<string[]> {
        const availableAddresses = await this._web3Wrapper.getAvailableAddressesAsync();
        return availableAddresses;
    }
    /**
     * Computes the orderHash for a supplied order.
     * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
     * @return  The resulting orderHash from hashing the supplied order.
     */
    public getOrderHashHex(order: Order|SignedOrder): string {
        assert.doesConformToSchema('order', order, orderSchema);
        const orderHashHex = utils.getOrderHashHex(order, order.exchangeContractAddress);
        return orderHashHex;
    }
    /**
     * Signs an orderHash and returns it's elliptic curve signature.
     * This method currently supports TestRPC, Geth and Parity above and below V1.6.6
     * @param   orderHash       Hex encoded orderHash to sign.
     * @param   signerAddress   The hex encoded Ethereum address you wish to sign it with. This address
     *          must be available via the Web3.Provider supplied to 0x.js.
     * @return  An object containing the Elliptic curve signature parameters generated by signing the orderHash.
     */
    public async signOrderHashAsync(orderHash: string, signerAddress: string): Promise<ECSignature> {
        assert.isHexString('orderHash', orderHash);
        await assert.isSenderAddressAsync('signerAddress', signerAddress, this._web3Wrapper);

        let msgHashHex;
        const nodeVersion = await this._web3Wrapper.getNodeVersionAsync();
        const isParityNode = utils.isParityNode(nodeVersion);
        if (isParityNode) {
            // Parity node adds the personalMessage prefix itself
            msgHashHex = orderHash;
        } else {
            const orderHashBuff = ethUtil.toBuffer(orderHash);
            const msgHashBuff = ethUtil.hashPersonalMessage(orderHashBuff);
            msgHashHex = ethUtil.bufferToHex(msgHashBuff);
        }

        const signature = await this._web3Wrapper.signTransactionAsync(signerAddress, msgHashHex);

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
        const isValidSignature = ZeroEx.isValidSignature(orderHash, ecSignature, signerAddress);
        if (!isValidSignature) {
            throw new Error(ZeroExError.INVALID_SIGNATURE);
        }
        return ecSignature;
    }
}
