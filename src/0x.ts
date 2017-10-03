import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import * as Web3 from 'web3';
import * as abiDecoder from 'abi-decoder';
import {SchemaValidator, schemas} from '0x-json-schemas';
import {bigNumberConfigs} from './bignumber_config';
import * as ethUtil from 'ethereumjs-util';
import findVersions = require('find-versions');
import compareVersions = require('compare-versions');
import {Web3Wrapper} from './web3_wrapper';
import {constants} from './utils/constants';
import {utils} from './utils/utils';
import {signatureUtils} from './utils/signature_utils';
import {assert} from './utils/assert';
import {AbiDecoder} from './utils/abi_decoder';
import {intervalUtils} from './utils/interval_utils';
import {artifacts} from './artifacts';
import {ExchangeWrapper} from './contract_wrappers/exchange_wrapper';
import {TokenRegistryWrapper} from './contract_wrappers/token_registry_wrapper';
import {EtherTokenWrapper} from './contract_wrappers/ether_token_wrapper';
import {TokenWrapper} from './contract_wrappers/token_wrapper';
import {TokenTransferProxyWrapper} from './contract_wrappers/token_transfer_proxy_wrapper';
import {
    ECSignature,
    ZeroExError,
    Order,
    SignedOrder,
    Web3Provider,
    ZeroExConfig,
    TransactionReceipt,
    DecodedLogArgs,
    TransactionReceiptWithDecodedLogs,
    LogWithDecodedArgs,
    FilterObject,
    RawLog,
} from './types';
import {zeroExConfigSchema} from './schemas/zero_ex_config_schema';

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
    /**
     * An instance of the TokenTransferProxyWrapper class containing methods for interacting with the
     * tokenTransferProxy smart contract.
     */
    public proxy: TokenTransferProxyWrapper;
    private _web3Wrapper: Web3Wrapper;
    private _abiDecoder: AbiDecoder;
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
        assert.doesConformToSchema('signature', signature, schemas.ecSignatureSchema);
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
        const schemaValidator = new SchemaValidator();
        const isValidOrderHash = schemaValidator.validate(orderHash, schemas.orderHashSchema).valid;
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
     * Computes the orderHash for a supplied order.
     * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
     * @return  The resulting orderHash from hashing the supplied order.
     */
    public static getOrderHashHex(order: Order|SignedOrder): string {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        const orderHashHex = utils.getOrderHashHex(order);
        return orderHashHex;
    }
    /**
     * Instantiates a new ZeroEx instance that provides the public interface to the 0x.js library.
     * @param   provider    The Web3.js Provider instance you would like the 0x.js library to use for interacting with
     *                      the Ethereum network.
     * @param   config      The configuration object. Look up the type for the description.
     * @return  An instance of the 0x.js ZeroEx class.
     */
    constructor(provider: Web3Provider, config?: ZeroExConfig) {
        assert.isWeb3Provider('provider', provider);
        if (!_.isUndefined(config)) {
            assert.doesConformToSchema('config', config, zeroExConfigSchema);
        }
        if (_.isUndefined((provider as any).sendAsync)) {
            // Web3@1.0 provider doesn't support synchronous http requests,
            // so it only has an async `send` method, instead of a `send` and `sendAsync` in web3@0.x.x`
            // We re-assign the send method so that Web3@1.0 providers work with 0x.js
            (provider as any).sendAsync = (provider as any).send;
        }
        const artifactJSONs = _.values(artifacts);
        const abiArrays = _.map(artifactJSONs, artifact => artifact.abi);
        this._abiDecoder = new AbiDecoder(abiArrays);
        const gasPrice = _.isUndefined(config) ? undefined : config.gasPrice;
        const defaults = {
            gasPrice,
        };
        this._web3Wrapper = new Web3Wrapper(provider, defaults);
        this.token = new TokenWrapper(
            this._web3Wrapper,
            this._abiDecoder,
            this._getTokenTransferProxyAddressAsync.bind(this),
        );
        const exchageContractAddressIfExists = _.isUndefined(config) ? undefined : config.exchangeContractAddress;
        this.exchange = new ExchangeWrapper(this._web3Wrapper, this.token, exchageContractAddressIfExists);
        this.proxy = new TokenTransferProxyWrapper(
            this._web3Wrapper,
            this._getTokenTransferProxyAddressAsync.bind(this),
        );
        const tokenRegistryContractAddressIfExists = _.isUndefined(config) ?
                                                     undefined :
                                                     config.tokenRegistryContractAddress;
        this.tokenRegistry = new TokenRegistryWrapper(this._web3Wrapper, tokenRegistryContractAddressIfExists);
        const etherTokenContractAddressIfExists = _.isUndefined(config) ? undefined : config.etherTokenContractAddress;
        this.etherToken = new EtherTokenWrapper(this._web3Wrapper, this.token, etherTokenContractAddressIfExists);
    }
    /**
     * Sets a new web3 provider for 0x.js. Updating the provider will stop all
     * subscriptions so you will need to re-subscribe to all events relevant to your app after this call.
     * @param   provider    The Web3Provider you would like the 0x.js library to use from now on.
     */
    public async setProviderAsync(provider: Web3Provider) {
        this._web3Wrapper.setProvider(provider);
        await (this.exchange as any)._invalidateContractInstancesAsync();
        (this.tokenRegistry as any)._invalidateContractInstance();
        await (this.token as any)._invalidateContractInstancesAsync();
        (this.proxy as any)._invalidateContractInstance();
        (this.etherToken as any)._invalidateContractInstance();
    }
    /**
     * Get user Ethereum addresses available through the supplied web3 provider available for sending transactions.
     * @return  An array of available user Ethereum addresses.
     */
    public async getAvailableAddressesAsync(): Promise<string[]> {
        const availableAddresses = await this._web3Wrapper.getAvailableAddressesAsync();
        return availableAddresses;
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
        const isTestRpc = utils.isTestRpc(nodeVersion);
        if (isParityNode || isTestRpc) {
            // Parity and TestRpc nodes add the personalMessage prefix itself
            msgHashHex = orderHash;
        } else {
            const orderHashBuff = ethUtil.toBuffer(orderHash);
            const msgHashBuff = ethUtil.hashPersonalMessage(orderHashBuff);
            msgHashHex = ethUtil.bufferToHex(msgHashBuff);
        }

        const signature = await this._web3Wrapper.signTransactionAsync(signerAddress, msgHashHex);

        // HACK: There is no consensus on whether the signatureHex string should be formatted as
        // v + r + s OR r + s + v, and different clients (even different versions of the same client)
        // return the signature params in different orders. In order to support all client implementations,
        // we parse the signature in both ways, and evaluate if either one is a valid signature.
        const validVParamValues = [27, 28];
        const ecSignatureVRS = signatureUtils.parseSignatureHexAsVRS(signature);
        if (_.includes(validVParamValues, ecSignatureVRS.v)) {
            const isValidVRSSignature = ZeroEx.isValidSignature(orderHash, ecSignatureVRS, signerAddress);
            if (isValidVRSSignature) {
                return ecSignatureVRS;
            }
        }

        const ecSignatureRSV = signatureUtils.parseSignatureHexAsRSV(signature);
        if (_.includes(validVParamValues, ecSignatureRSV.v)) {
            const isValidRSVSignature = ZeroEx.isValidSignature(orderHash, ecSignatureRSV, signerAddress);
            if (isValidRSVSignature) {
                return ecSignatureRSV;
            }
        }

        throw new Error(ZeroExError.InvalidSignature);
    }
    /**
     * Waits for a transaction to be mined and returns the transaction receipt.
     * @param   txHash            Transaction hash
     * @param   pollingIntervalMs How often (in ms) should we check if the transaction is mined.
     * @return  Transaction receipt with decoded log args.
     */
    public async awaitTransactionMinedAsync(
        txHash: string, pollingIntervalMs: number = 1000): Promise<TransactionReceiptWithDecodedLogs> {
        const txReceiptPromise = new Promise(
            (resolve: (receipt: TransactionReceiptWithDecodedLogs) => void, reject) => {
            const intervalId = intervalUtils.setAsyncExcludingInterval(async () => {
                const transactionReceipt = await this._web3Wrapper.getTransactionReceiptAsync(txHash);
                if (!_.isNull(transactionReceipt)) {
                    intervalUtils.clearAsyncExcludingInterval(intervalId);
                    const tryToDecodeLogOrNoOp = this._abiDecoder.tryToDecodeLogOrNoOp.bind(this._abiDecoder);
                    const logsWithDecodedArgs = _.map(transactionReceipt.logs, tryToDecodeLogOrNoOp);
                    const transactionReceiptWithDecodedLogArgs: TransactionReceiptWithDecodedLogs = {
                        ...transactionReceipt,
                        logs: logsWithDecodedArgs,
                    };
                    resolve(transactionReceiptWithDecodedLogArgs);
                }
            }, pollingIntervalMs);
        });
        return txReceiptPromise;
    }
    /*
     * HACK: `TokenWrapper` needs a token transfer proxy address. `TokenTransferProxy` address is fetched from
     * an `ExchangeWrapper`. `ExchangeWrapper` needs `TokenWrapper` to validate orders, creating a dependency cycle.
     * In order to break this - we create this function here and pass it as a parameter to the `TokenWrapper`
     * and `ProxyWrapper`.
     */
    private async _getTokenTransferProxyAddressAsync(): Promise<string> {
        const tokenTransferProxyAddress = await (this.exchange as any)._getTokenTransferProxyAddressAsync();
        return tokenTransferProxyAddress;
    }
}
