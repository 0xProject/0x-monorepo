import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';

import { TokenRegistryContract } from '../contract_wrappers/generated/token_registry';

import { Token } from './types';

import { constants } from './constants';

export class TokenRegWrapper {
    private _tokenReg: TokenRegistryContract;
    private _web3Wrapper: Web3Wrapper;
    constructor(tokenRegContract: TokenRegistryContract, provider: Provider) {
        this._tokenReg = tokenRegContract;
        this._web3Wrapper = new Web3Wrapper(provider);
    }
    public async addTokenAsync(token: Token, from: string): Promise<string> {
        const txHash = await this._tokenReg.addToken.sendTransactionAsync(
            token.address as string,
            token.name,
            token.symbol,
            token.decimals,
            token.ipfsHash,
            token.swarmHash,
            { from },
        );
        await this._web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        return txHash;
    }
    public async getTokenMetaDataAsync(tokenAddress: string): Promise<Token> {
        const data = await this._tokenReg.getTokenMetaData.callAsync(tokenAddress);
        const token: Token = {
            address: data[0],
            name: data[1],
            symbol: data[2],
            decimals: data[3],
            ipfsHash: data[4],
            swarmHash: data[5],
        };
        return token;
    }
    public async getTokenByNameAsync(tokenName: string): Promise<Token> {
        const data = await this._tokenReg.getTokenByName.callAsync(tokenName);
        const token: Token = {
            address: data[0],
            name: data[1],
            symbol: data[2],
            decimals: data[3],
            ipfsHash: data[4],
            swarmHash: data[5],
        };
        return token;
    }
    public async getTokenBySymbolAsync(tokenSymbol: string): Promise<Token> {
        const data = await this._tokenReg.getTokenBySymbol.callAsync(tokenSymbol);
        const token: Token = {
            address: data[0],
            name: data[1],
            symbol: data[2],
            decimals: data[3],
            ipfsHash: data[4],
            swarmHash: data[5],
        };
        return token;
    }
}
