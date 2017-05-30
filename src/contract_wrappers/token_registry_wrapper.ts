import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {Token, TokenRegistryContract, TokenMetadata} from '../types';
import {assert} from '../utils/assert';
import {ContractWrapper} from './contract_wrapper';
import * as TokenRegistryArtifacts from '../artifacts/TokenRegistry.json';

export class TokenRegistryWrapper extends ContractWrapper {
    private tokenRegistryContractIfExists?: TokenRegistryContract;
    constructor(web3Wrapper: Web3Wrapper) {
        super(web3Wrapper);
    }
    public invalidateContractInstance(): void {
        delete this.tokenRegistryContractIfExists;
    }
    public async getTokensAsync(): Promise<Token[]> {
        const tokenRegistryContract = await this.getTokenRegistryContractAsync();

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
    private async getTokenRegistryContractAsync(): Promise<TokenRegistryContract> {
        if (!_.isUndefined(this.tokenRegistryContractIfExists)) {
            return this.tokenRegistryContractIfExists;
        }
        const contractInstance = await this.instantiateContractIfExistsAsync((TokenRegistryArtifacts as any));
        this.tokenRegistryContractIfExists = contractInstance as TokenRegistryContract;
        return this.tokenRegistryContractIfExists;
    }
}
