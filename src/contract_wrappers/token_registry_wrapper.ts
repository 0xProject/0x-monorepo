import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {Token, TokenRegistryContract, TokenMetadata} from '../types';
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
        const tokenMetadataPromises: Array<Promise<TokenMetadata>> = _.map(
            addresses,
            (address: string) => (tokenRegistryContract.getTokenMetaData.call(address)),
        );
        const tokensMetadata = await Promise.all(tokenMetadataPromises);
        const tokens = _.map(tokensMetadata, metadata => {
            return {
                address: metadata[0],
                name: metadata[1],
                symbol: metadata[2],
                url: metadata[3],
                decimals: metadata[4].toNumber(),
            };
        });
        return tokens;
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
