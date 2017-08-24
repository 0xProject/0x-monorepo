import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {assert} from '../utils/assert';
import {Token, TokenRegistryContract, TokenMetadata} from '../types';
import {constants} from '../utils/constants';
import {ContractWrapper} from './contract_wrapper';
import * as TokenRegistryArtifacts from '../artifacts/TokenRegistry.json';

/**
 * This class includes all the functionality related to interacting with the 0x Token Registry smart contract.
 */
export class TokenRegistryWrapper extends ContractWrapper {
    private _tokenRegistryContractIfExists?: TokenRegistryContract;
    constructor(web3Wrapper: Web3Wrapper) {
        super(web3Wrapper);
    }
    /**
     * Retrieves all the tokens currently listed in the Token Registry smart contract
     * @return  An array of objects that conform to the Token interface.
     */
    public async getTokensAsync(): Promise<Token[]> {
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();

        const addresses = await this.getTokenAddressesAsync();
        const tokenPromises: Array<Promise<Token|undefined>> = _.map(
            addresses,
            (address: string) => (this.getTokenIfExistsAsync(address)),
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
        const addresses = await tokenRegistryContract.getTokenAddresses.call();
        return addresses;
    }
    /**
     * Retrieves a token by address currently listed in the Token Registry smart contract
     * @return  An object that conforms to the Token interface or undefined if token not found.
     */
    public async getTokenIfExistsAsync(address: string): Promise<Token|undefined> {
        assert.isETHAddressHex('address', address);

        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const metadata = await tokenRegistryContract.getTokenMetaData.call(address);
        const token = this._getTokenByMetadata(metadata);
        return token;
    }
    public async getTokenAddressBySymbolIfExistsAsync(symbol: string): Promise<string|undefined> {
        assert.isString('symbol', symbol);
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const addressIfExists = await tokenRegistryContract.getTokenAddressBySymbol.call(symbol);
        if (addressIfExists === constants.NULL_ADDRESS) {
            return undefined;
        }
        return addressIfExists;
    }
    public async getTokenAddressByNameIfExistsAsync(name: string): Promise<string|undefined> {
        assert.isString('name', name);
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const addressIfExists = await tokenRegistryContract.getTokenAddressByName.call(name);
        if (addressIfExists === constants.NULL_ADDRESS) {
            return undefined;
        }
        return addressIfExists;
    }
    public async getTokenBySymbolIfExistsAsync(symbol: string): Promise<Token|undefined> {
        assert.isString('symbol', symbol);
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const metadata = await tokenRegistryContract.getTokenBySymbol.call(symbol);
        const token = this._getTokenByMetadata(metadata);
        return token;
    }
    public async getTokenByNameIfExistsAsync(name: string): Promise<Token|undefined> {
        assert.isString('name', name);
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const metadata = await tokenRegistryContract.getTokenByName.call(name);
        const token = this._getTokenByMetadata(metadata);
        return token;
    }
    private _getTokenByMetadata(metadata: TokenMetadata): Token|undefined {
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
    private _invalidateContractInstance(): void {
        delete this._tokenRegistryContractIfExists;
    }
    private async _getTokenRegistryContractAsync(): Promise<TokenRegistryContract> {
        if (!_.isUndefined(this._tokenRegistryContractIfExists)) {
            return this._tokenRegistryContractIfExists;
        }
        const contractInstance = await this._instantiateContractIfExistsAsync((TokenRegistryArtifacts as any));
        this._tokenRegistryContractIfExists = contractInstance as TokenRegistryContract;
        return this._tokenRegistryContractIfExists;
    }
}
