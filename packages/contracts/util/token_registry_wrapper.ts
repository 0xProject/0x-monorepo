import { ContractInstance, Token } from './types';

export class TokenRegWrapper {
    private _tokenReg: ContractInstance;
    constructor(tokenRegContractInstance: ContractInstance) {
        this._tokenReg = tokenRegContractInstance;
    }
    public addTokenAsync(token: Token, from: string) {
        const tx = this._tokenReg.addToken(
            token.address,
            token.name,
            token.symbol,
            token.decimals,
            token.ipfsHash,
            token.swarmHash,
            { from },
        );
        return tx;
    }
    public async getTokenMetaDataAsync(tokenAddress: string) {
        const data = await this._tokenReg.getTokenMetaData(tokenAddress);
        const token: Token = {
            address: data[0],
            name: data[1],
            symbol: data[2],
            decimals: data[3].toNumber(),
            ipfsHash: data[4],
            swarmHash: data[5],
        };
        return token;
    }
    public async getTokenByNameAsync(tokenName: string) {
        const data = await this._tokenReg.getTokenByName(tokenName);
        const token: Token = {
            address: data[0],
            name: data[1],
            symbol: data[2],
            decimals: data[3].toNumber(),
            ipfsHash: data[4],
            swarmHash: data[5],
        };
        return token;
    }
    public async getTokenBySymbolAsync(tokenSymbol: string) {
        const data = await this._tokenReg.getTokenBySymbol(tokenSymbol);
        const token: Token = {
            address: data[0],
            name: data[1],
            symbol: data[2],
            decimals: data[3].toNumber(),
            ipfsHash: data[4],
            swarmHash: data[5],
        };
        return token;
    }
}
