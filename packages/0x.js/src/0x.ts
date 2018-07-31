import { assert } from '@0xproject/assert';
import {
    ContractWrappers,
    ContractWrappersConfig,
    ERC20ProxyWrapper,
    ERC20TokenWrapper,
    ERC721ProxyWrapper,
    ERC721TokenWrapper,
    EtherTokenWrapper,
    ExchangeWrapper,
} from '@0xproject/contract-wrappers';
import {
    assetDataUtils,
    ecSignOrderHashAsync,
    generatePseudoRandomSalt,
    isValidSignatureAsync,
    orderHashUtils,
} from '@0xproject/order-utils';
// HACK: Since we export assetDataUtils from ZeroEx and it has AssetProxyId, ERC20AssetData and ERC721AssetData
// in it's public interface, we need to import these types here.
// tslint:disable-next-line:no-unused-variable
import {
    AssetProxyId,
    ERC20AssetData,
    ERC721AssetData,
    Order,
    SignedOrder,
    SignerProviderType,
} from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { constants } from './utils/constants';

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
     * An instance of the ERC20TokenWrapper class containing methods for interacting with any ERC20 token smart contract.
     */
    public erc20Token: ERC20TokenWrapper;
    /**
     * An instance of the ERC721TokenWrapper class containing methods for interacting with any ERC721 token smart contract.
     */
    public erc721Token: ERC721TokenWrapper;
    /**
     * An instance of the EtherTokenWrapper class containing methods for interacting with the
     * wrapped ETH ERC20 token smart contract.
     */
    public etherToken: EtherTokenWrapper;
    /**
     * An instance of the ERC20ProxyWrapper class containing methods for interacting with the
     * ERC20 proxy smart contract.
     */
    public erc20Proxy: ERC20ProxyWrapper;
    /**
     * An instance of the ERC721ProxyWrapper class containing methods for interacting with the
     * ERC721 proxy smart contract.
     */
    public erc721Proxy: ERC721ProxyWrapper;
    private readonly _contractWrappers: ContractWrappers;
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
     * Computes the orderHash for a supplied order.
     * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
     * @return  The resulting orderHash from hashing the supplied order.
     */
    public static getOrderHashHex(order: Order | SignedOrder): string {
        return orderHashUtils.getOrderHashHex(order);
    }
    /**
     * Checks if the supplied hex encoded order hash is valid.
     * Note: Valid means it has the expected format, not that an order with the orderHash exists.
     * Use this method when processing orderHashes submitted as user input.
     * @param   orderHash    Hex encoded orderHash.
     * @return  Whether the supplied orderHash has the expected format.
     */
    public static isValidOrderHash(orderHash: string): boolean {
        return orderHashUtils.isValidOrderHash(orderHash);
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
     * Encodes an ERC20 token address into a hex encoded assetData string, usable in the makerAssetData or
     * takerAssetData fields in a 0x order.
     * @param tokenAddress  The ERC20 token address to encode
     * @return The hex encoded assetData string
     */
    public static encodeERC20AssetData(tokenAddress: string): string {
        return assetDataUtils.encodeERC20AssetData(tokenAddress);
    }
    /**
     * Decodes an ERC20 assetData hex string into it's corresponding ERC20 tokenAddress & assetProxyId
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded tokenAddress & assetProxyId
     */
    public static decodeERC20AssetData(assetData: string): ERC20AssetData {
        return assetDataUtils.decodeERC20AssetData(assetData);
    }
    /**
     * Encodes an ERC721 token address into a hex encoded assetData string, usable in the makerAssetData or
     * takerAssetData fields in a 0x order.
     * @param tokenAddress  The ERC721 token address to encode
     * @param tokenId  The ERC721 tokenId to encode
     * @return The hex encoded assetData string
     */
    public static encodeERC721AssetData(tokenAddress: string, tokenId: BigNumber): string {
        return assetDataUtils.encodeERC721AssetData(tokenAddress, tokenId);
    }
    /**
     * Decodes an ERC721 assetData hex string into it's corresponding ERC721 tokenAddress, tokenId & assetProxyId
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded tokenAddress, tokenId & assetProxyId
     */
    public static decodeERC721AssetData(assetData: string): ERC721AssetData {
        return assetDataUtils.decodeERC721AssetData(assetData);
    }
    /**
     * Decode and return the assetProxyId from the assetData
     * @param assetData Hex encoded assetData string to decode
     * @return The assetProxyId
     */
    public static decodeAssetProxyId(assetData: string): AssetProxyId {
        return assetDataUtils.decodeAssetProxyId(assetData);
    }
    /**
     * Decode any assetData into it's corresponding assetData object
     * @param assetData Hex encoded assetData string to decode
     * @return Either a ERC20 or ERC721 assetData object
     */
    public static decodeAssetDataOrThrow(assetData: string): ERC20AssetData | ERC721AssetData {
        return assetDataUtils.decodeAssetDataOrThrow(assetData);
    }
    /**
     * Instantiates a new ZeroEx instance that provides the public interface to the 0x.js library.
     * @param   provider    The Provider instance you would like the 0x.js library to use for interacting with
     *                      the Ethereum network.
     * @param   config      The configuration object. Look up the type for the description.
     * @return  An instance of the 0x.js ZeroEx class.
     */
    constructor(provider: Provider, config: ContractWrappersConfig) {
        assert.isWeb3Provider('provider', provider);
        this._contractWrappers = new ContractWrappers(provider, config);

        this.erc20Proxy = this._contractWrappers.erc20Proxy;
        this.erc721Proxy = this._contractWrappers.erc721Proxy;
        this.erc20Token = this._contractWrappers.erc20Token;
        this.erc721Token = this._contractWrappers.erc721Token;
        this.exchange = this._contractWrappers.exchange;
        this.etherToken = this._contractWrappers.etherToken;
    }
    /**
     * Verifies that the provided signature is valid according to the 0x Protocol smart contracts
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     The hex encoded signature.
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the signature is valid for the supplied signerAddress and data.
     */
    public async isValidSignatureAsync(data: string, signature: string, signerAddress: string): Promise<boolean> {
        const isValid = await isValidSignatureAsync(
            this._contractWrappers.getProvider(),
            data,
            signature,
            signerAddress,
        );
        return isValid;
    }
    /**
     * Sets a new web3 provider for 0x.js. Updating the provider will stop all
     * subscriptions so you will need to re-subscribe to all events relevant to your app after this call.
     * @param   provider    The Web3Provider you would like the 0x.js library to use from now on.
     * @param   networkId   The id of the network your provider is connected to
     */
    public setProvider(provider: Provider, networkId: number): void {
        this._contractWrappers.setProvider(provider, networkId);
    }
    /**
     * Get the provider instance currently used by 0x.js
     * @return  Web3 provider instance
     */
    public getProvider(): Provider {
        return this._contractWrappers.getProvider();
    }
    /**
     * Get user Ethereum addresses available through the supplied web3 provider available for sending transactions.
     * @return  An array of available user Ethereum addresses.
     */
    public async getAvailableAddressesAsync(): Promise<string[]> {
        // Hack: Get Web3Wrapper from ContractWrappers
        const web3Wrapper: Web3Wrapper = (this._contractWrappers as any)._web3Wrapper;
        const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
        return availableAddresses;
    }
    /**
     * Signs an orderHash and returns it's elliptic curve signature.
     * This method currently supports TestRPC, Geth and Parity above and below V1.6.6
     * @param   orderHash       Hex encoded orderHash to sign.
     * @param   signerAddress   The hex encoded Ethereum address you wish to sign it with. This address
     *          must be available via the Provider supplied to 0x.js.
     * @param   SignerProviderType  The type of Signer Provider which implements `eth_sign`. E.g Metamask, Ledger, Trezor or EthSign.
     * @return  A hex encoded string of the Elliptic curve signature parameters generated by signing the orderHash and signature type.
     */
    public async ecSignOrderHashAsync(
        orderHash: string,
        signerAddress: string,
        signerProviderType: SignerProviderType,
    ): Promise<string> {
        const signature = await ecSignOrderHashAsync(
            this._contractWrappers.getProvider(),
            orderHash,
            signerAddress,
            signerProviderType,
        );
        return signature;
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
        pollingIntervalMs: number = 1000,
        timeoutMs?: number,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        // Hack: Get Web3Wrapper from ContractWrappers
        const web3Wrapper: Web3Wrapper = (this._contractWrappers as any)._web3Wrapper;
        const transactionReceiptWithDecodedLogs = await web3Wrapper.awaitTransactionMinedAsync(
            txHash,
            pollingIntervalMs,
            timeoutMs,
        );
        return transactionReceiptWithDecodedLogs;
    }
}
