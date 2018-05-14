import * as Web3 from 'web3';

import { TokenRegistryContract } from '../src/contract_wrappers/generated/token_registry';

import { Token } from './types';

export class TokenRegWrapper {
    private _tokenReg: TokenRegistryContract;
    constructor(tokenRegContract: TokenRegistryContract) {
        this._tokenReg = tokenRegContract;
    }
    public async addTokenAsync(token: Token, from: string): Promise<string> {
        const tx = this._tokenReg.addToken.sendTransactionAsync(
            token.address as string,
            token.name,
            token.symbol,
            token.decimals,
            token.ipfsHash,
            token.swarmHash,
            { from },
        );
        return tx;
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
