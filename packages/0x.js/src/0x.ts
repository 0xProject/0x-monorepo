import { schemas, SchemaValidator } from '@0xproject/json-schemas';
import {
    generatePseudoRandomSalt,
    getOrderHashHex,
    isValidOrderHash,
    isValidSignature,
    signOrderHashAsync,
} from '@0xproject/order-utils';
import { ECSignature, Order, Provider, SignedOrder, TransactionReceiptWithDecodedLogs } from '@0xproject/types';
import { AbiDecoder, BigNumber, intervalUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { EtherTokenWrapper } from './contract_wrappers/ether_token_wrapper';
import { ExchangeWrapper } from './contract_wrappers/exchange_wrapper';
import { TokenRegistryWrapper } from './contract_wrappers/token_registry_wrapper';
import { TokenTransferProxyWrapper } from './contract_wrappers/token_transfer_proxy_wrapper';
import { TokenWrapper } from './contract_wrappers/token_wrapper';
import { OrderStateWatcher } from './order_watcher/order_state_watcher';
import { zeroExConfigSchema } from './schemas/zero_ex_config_schema';
import { zeroExPrivateNetworkConfigSchema } from './schemas/zero_ex_private_network_config_schema';
import { zeroExPublicNetworkConfigSchema } from './schemas/zero_ex_public_network_config_schema';
import { OrderStateWatcherConfig, ZeroExConfig, ZeroExError } from './types';
import { assert } from './utils/assert';
import { constants } from './utils/constants';
import { decorators } from './utils/decorators';
import { utils } from './utils/utils';

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
    /**
     * Generates a pseudo-random 256-bit salt.
     * The salt can be included in a 0x order, ensuring that the order generates a unique orderHash
     * and will not collide with other outstanding orders that are identical in all other parameters.
     * @return  A pseudo-random 256-bit number that can be used as a salt.
     */
    public static generatePseudoRandomSalt(): BigNumber {
        return generatePseudoRandomSalt();
    }
    /**
     * Verifies that the elliptic curve signature `signature` was generated
     * by signing `data` with the private key corresponding to the `signerAddress` address.
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     An object containing the elliptic curve signature parameters.
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the signature is valid for the supplied signerAddress and data.
     */
    public static isValidSignature(data: string, signature: ECSignature, signerAddress: string): boolean {
        return isValidSignature(data, signature, signerAddress);
    }
    /**
     * Computes the orderHash for a supplied order.
     * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
     * @return  The resulting orderHash from hashing the supplied order.
     */
    public static getOrderHashHex(order: Order | SignedOrder): string {
        return getOrderHashHex(order);
    }
    /**
     * Checks if the supplied hex encoded order hash is valid.
     * Note: Valid means it has the expected format, not that an order with the orderHash exists.
     * Use this method when processing orderHashes submitted as user input.
     * @param   orderHash    Hex encoded orderHash.
     * @return  Whether the supplied orderHash has the expected format.
     */
    public static isValidOrderHash(orderHash: string): boolean {
        return isValidOrderHash(orderHash);
    }
    /**
     * A unit amount is defined as the amount of a token above the specified decimal places (integer part).
     * E.g: If a currency has 18 decimal places, 1e18 or one quintillion of the currency is equivalent
     * to 1 unit.
     * @param   amount      The amount in baseUnits that you would like converted to units.
     * @param   decimals    The number of decimal places the unit amount has.
     * @return  The amount in units.
     */
    public static toUnitAmount(amount: BigNumber, decimals: number): BigNumber {
        assert.isValidBaseUnitAmount('amount', amount);
        assert.isNumber('decimals', decimals);
        const unitAmount = Web3Wrapper.toUnitAmount(amount, decimals);
        return unitAmount;
    }
    /**
     * A baseUnit is defined as the smallest denomination of a token. An amount expressed in baseUnits
     * is the amount expressed in the smallest denomination.
     * E.g: 1 unit of a token with 18 decimal places is expressed in baseUnits as 1000000000000000000
     * @param   amount      The amount of units that you would like converted to baseUnits.
     * @param   decimals    The number of decimal places the unit amount has.
     * @return  The amount in baseUnits.
     */
    public static toBaseUnitAmount(amount: BigNumber, decimals: number): BigNumber {
        assert.isBigNumber('amount', amount);
        assert.isNumber('decimals', decimals);
        const baseUnitAmount = Web3Wrapper.toBaseUnitAmount(amount, decimals);
        return baseUnitAmount;
    }
    /**
     * Instantiates a new ZeroEx instance that provides the public interface to the 0x.js library.
     * @param   provider    The Provider instance you would like the 0x.js library to use for interacting with
     *                      the Ethereum network.
     * @param   config      The configuration object. Look up the type for the description.
     * @return  An instance of the 0x.js ZeroEx class.
     */
    constructor(provider: Provider, config: ZeroExConfig) {
        assert.isWeb3Provider('provider', provider);
        assert.doesConformToSchema('config', config, zeroExConfigSchema, [
            zeroExPrivateNetworkConfigSchema,
            zeroExPublicNetworkConfigSchema,
        ]);
        const artifactJSONs = _.values(artifacts);
        const abiArrays = _.map(artifactJSONs, artifact => artifact.abi);
        const txDefaults = {
            gasPrice: config.gasPrice,
        };
        this._web3Wrapper = new Web3Wrapper(provider, txDefaults);
        _.forEach(abiArrays, abi => {
            this._web3Wrapper.abiDecoder.addABI(abi);
        });
        this.proxy = new TokenTransferProxyWrapper(
            this._web3Wrapper,
            config.networkId,
            config.tokenTransferProxyContractAddress,
        );
        this.token = new TokenWrapper(this._web3Wrapper, config.networkId, this.proxy);
        this.exchange = new ExchangeWrapper(
            this._web3Wrapper,
            config.networkId,
            this.token,
            config.exchangeContractAddress,
            config.zrxContractAddress,
        );
        this.tokenRegistry = new TokenRegistryWrapper(
            this._web3Wrapper,
            config.networkId,
            config.tokenRegistryContractAddress,
        );
        this.etherToken = new EtherTokenWrapper(this._web3Wrapper, config.networkId, this.token);
    }
    /**
     * Sets a new web3 provider for 0x.js. Updating the provider will stop all
     * subscriptions so you will need to re-subscribe to all events relevant to your app after this call.
     * @param   provider    The Web3Provider you would like the 0x.js library to use from now on.
     * @param   networkId   The id of the network your provider is connected to
     */
    public setProvider(provider: Provider, networkId: number): void {
        this._web3Wrapper.setProvider(provider);
        (this.exchange as any)._invalidateContractInstances();
        (this.exchange as any)._setNetworkId(networkId);
        (this.tokenRegistry as any)._invalidateContractInstance();
        (this.tokenRegistry as any)._setNetworkId(networkId);
        (this.token as any)._invalidateContractInstances();
        (this.token as any)._setNetworkId(networkId);
        (this.proxy as any)._invalidateContractInstance();
        (this.proxy as any)._setNetworkId(networkId);
        (this.etherToken as any)._invalidateContractInstance();
        (this.etherToken as any)._setNetworkId(networkId);
    }
    /**
     * Get the provider instance currently used by 0x.js
     * @return  Web3 provider instance
     */
    public getProvider(): Provider {
        return this._web3Wrapper.getProvider();
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
     *          must be available via the Provider supplied to 0x.js.
     * @param   shouldAddPersonalMessagePrefix  Some signers add the personal message prefix `\x19Ethereum Signed Message`
     *          themselves (e.g Parity Signer, Ledger, TestRPC) and others expect it to already be done by the client
     *          (e.g Metamask). Depending on which signer this request is going to, decide on whether to add the prefix
     *          before sending the request.
     * @return  An object containing the Elliptic curve signature parameters generated by signing the orderHash.
     */
    public async signOrderHashAsync(
        orderHash: string,
        signerAddress: string,
        shouldAddPersonalMessagePrefix: boolean,
    ): Promise<ECSignature> {
        return signOrderHashAsync(
            this._web3Wrapper.getProvider(),
            orderHash,
            signerAddress,
            shouldAddPersonalMessagePrefix,
        );
    }
    /**
     * Waits for a transaction to be mined and returns the transaction receipt.
     * @param   txHash            Transaction hash
     * @param   pollingIntervalMs How often (in ms) should we check if the transaction is mined.
     * @param   timeoutMs         How long (in ms) to poll for transaction mined until aborting.
     * @return  Transaction receipt with decoded log args.
     */
    public async awaitTransactionMinedAsync(
        txHash: string,
        pollingIntervalMs = 1000,
        timeoutMs?: number,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const transactionReceiptWithDecodedLogs = await this._web3Wrapper.awaitTransactionMinedAsync(
            txHash,
            pollingIntervalMs,
            timeoutMs,
        );
        return transactionReceiptWithDecodedLogs;
    }
    /**
     * Instantiates and returns a new OrderStateWatcher instance.
     * Defaults to watching the pending state.
     * @param   config      The configuration object. Look up the type for the description.
     * @return  An instance of the 0x.js OrderStateWatcher class.
     */
    public createOrderStateWatcher(config?: OrderStateWatcherConfig) {
        return new OrderStateWatcher(this._web3Wrapper, this.token, this.exchange, config);
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
