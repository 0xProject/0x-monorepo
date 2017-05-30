import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {Token, TokenRegistryContract} from '../types';
import {assert} from '../utils/assert';
import {ContractWrapper} from './contract_wrapper';
import * as TokenRegistryArtifacts from '../artifacts/TokenRegistry.json';

export class TokenRegistryWrapper extends ContractWrapper {
    constructor(web3Wrapper: Web3Wrapper) {
        super(web3Wrapper);
    }
    public async getTokensAsync(): Promise<Token[]> {
        const contractInstance = await this.instantiateContractIfExistsAsync((TokenRegistryArtifacts as any));
        const tokenRegistryContract = contractInstance as TokenRegistryContract;

        const addresses = await tokenRegistryContract.getTokenAddresses.call();
        const tokenMetadataPromises: Array<Promise<any[]>> = _.map(
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
}
