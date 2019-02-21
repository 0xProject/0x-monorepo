import { fetchAsync } from '@0x/utils';

const TIMEOUT = 120000;

export interface EtherscanResponse {
    status: string;
    message: string;
    result: EtherscanTransactionResponse[];
}

export interface EtherscanTransactionResponse {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    transactionIndex: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceiptStatus: string;
    input: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    confirmations: string;
}

// tslint:disable:prefer-function-over-method
// ^ Keep consistency with other sources and help logical organization
export class EtherscanSource {

    public readonly _urlBase: string;

    constructor(apiKey: string, startBlock: number, endBlock: number) {
        this._urlBase = `http://api.etherscan.io/api?module=account&action=txlist&startblock=${startBlock}&endblock=${endBlock}&sort=desc&apikey=${apiKey}&address=`;
    }

    /**
     * Call Etherscan API and return result.
     */
    public async getEtherscanTransactionsForAddressAsync(address: string): Promise<EtherscanTransactionResponse[]> {
        const urlWithAddress = this._urlBase + address;
        const resp = await fetchAsync(urlWithAddress, {}, TIMEOUT);
        const respJson: EtherscanResponse = await resp.json();
        return respJson.result;
    }
}
