import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { Token, TokenMetadata } from '../types';
import { assert } from '../utils/assert';
import { constants } from '../utils/constants';

import { ContractWrapper } from './contract_wrapper';
import { TokenRegistryContract } from './generated/token_registry';

/**
 * This class includes all the functionality related to interacting with the 0x Token Registry smart contract.
 */
export class TokenRegistryWrapper extends ContractWrapper {
    private _tokenRegistryContractIfExists?: TokenRegistryContract;
    private _contractAddressIfExists?: string;
    private static _createTokenFromMetadata(metadata: TokenMetadata): Token | undefined {
        if (metadata[0] === constants.NULL_ADDRESS) {
            return undefined;
        }
        const token = {
            address: metadata[0],
            name: metadata[1],
            symbol: metadata[2],
            decimals: metadata[3].toNumber(),
        };
        return token;
    }
    constructor(web3Wrapper: Web3Wrapper, networkId: number, contractAddressIfExists?: string) {
        super(web3Wrapper, networkId);
        this._contractAddressIfExists = contractAddressIfExists;
    }
    /**
     * Retrieves all the tokens currently listed in the Token Registry smart contract
     * @return  An array of objects that conform to the Token interface.
     */
    public async getTokensAsync(): Promise<Token[]> {
        const addresses = await this.getTokenAddressesAsync();
        const tokenPromises: Array<Promise<Token | undefined>> = _.map(addresses, async (address: string) =>
            this.getTokenIfExistsAsync(address),
        );
        const tokens = await Promise.all(tokenPromises);
        return tokens as Token[];
    }
    /**
     * Retrieves all the addresses of the tokens currently listed in the Token Registry smart contract
     * @return  An array of token addresses.
     */
    public async getTokenAddressesAsync(): Promise<string[]> {
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const addresses = await tokenRegistryContract.getTokenAddresses.callAsync();
        return addresses;
    }
    /**
     * Retrieves a token by address currently listed in the Token Registry smart contract
     * @return  An object that conforms to the Token interface or undefined if token not found.
     */
    public async getTokenIfExistsAsync(address: string): Promise<Token | undefined> {
        assert.isETHAddressHex('address', address);

        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const metadata = await tokenRegistryContract.getTokenMetaData.callAsync(address);
        const token = TokenRegistryWrapper._createTokenFromMetadata(metadata);
        return token;
    }
    public async getTokenAddressBySymbolIfExistsAsync(symbol: string): Promise<string | undefined> {
        assert.isString('symbol', symbol);
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const addressIfExists = await tokenRegistryContract.getTokenAddressBySymbol.callAsync(symbol);
        if (addressIfExists === constants.NULL_ADDRESS) {
            return undefined;
        }
        return addressIfExists;
    }
    public async getTokenAddressByNameIfExistsAsync(name: string): Promise<string | undefined> {
        assert.isString('name', name);
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const addressIfExists = await tokenRegistryContract.getTokenAddressByName.callAsync(name);
        if (addressIfExists === constants.NULL_ADDRESS) {
            return undefined;
        }
        return addressIfExists;
    }
    public async getTokenBySymbolIfExistsAsync(symbol: string): Promise<Token | undefined> {
        assert.isString('symbol', symbol);
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const metadata = await tokenRegistryContract.getTokenBySymbol.callAsync(symbol);
        const token = TokenRegistryWrapper._createTokenFromMetadata(metadata);
        return token;
    }
    public async getTokenByNameIfExistsAsync(name: string): Promise<Token | undefined> {
        assert.isString('name', name);
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const metadata = await tokenRegistryContract.getTokenByName.callAsync(name);
        const token = TokenRegistryWrapper._createTokenFromMetadata(metadata);
        return token;
    }
    /**
     * Retrieves the Ethereum address of the TokenRegistry contract deployed on the network
     * that the user-passed web3 provider is connected to.
     * @returns The Ethereum address of the TokenRegistry contract being used.
     */
    public getContractAddress(): string {
        const contractAddress = this._getContractAddress(
            artifacts.TokenRegistryArtifact,
            this._contractAddressIfExists,
        );
        return contractAddress;
    }
    private _invalidateContractInstance(): void {
        delete this._tokenRegistryContractIfExists;
    }
    private async _getTokenRegistryContractAsync(): Promise<TokenRegistryContract> {
        if (!_.isUndefined(this._tokenRegistryContractIfExists)) {
            return this._tokenRegistryContractIfExists;
        }
        const web3ContractInstance = await this._instantiateContractIfExistsAsync(
            artifacts.TokenRegistryArtifact,
            this._contractAddressIfExists,
        );
        const contractInstance = new TokenRegistryContract(
            web3ContractInstance,
            this._web3Wrapper.getContractDefaults(),
        );
        this._tokenRegistryContractIfExists = contractInstance;
        return this._tokenRegistryContractIfExists;
    }
}
