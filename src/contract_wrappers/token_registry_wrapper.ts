import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
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

        const addresses = await tokenRegistryContract.getTokenAddresses.call();
        const tokenPromises: Array<Promise<Token|undefined>> = _.map(
            addresses,
            (address: string) => (this.getTokenMetadataIfExistsAsync(address)),
        );
        const tokens = await Promise.all(tokenPromises);
        return tokens as Token[];
    }
    /**
     * Retrieves a token by address currently listed in the Token Registry smart contract
     * @return  An object that conforms to the Token interface or undefined if token not found.
     */
    public async getTokenMetadataIfExistsAsync(address: string): Promise<Token|undefined> {
        const tokenRegistryContract = await this._getTokenRegistryContractAsync();
        const metadata = await tokenRegistryContract.getTokenMetaData.call(address);
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
