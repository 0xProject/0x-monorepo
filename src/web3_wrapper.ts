import * as _ from 'lodash';
import * as Web3 from 'web3';
import BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {ZeroExError, Artifact} from './types';
import {Contract} from './contract';

export class Web3Wrapper {
    private web3: Web3;
    private defaults: Partial<Web3.TxData>;
    private networkIdIfExists?: number;
    private jsonRpcRequestId: number;
    constructor(provider: Web3.Provider, defaults?: Partial<Web3.TxData>) {
        if (_.isUndefined((provider as any).sendAsync)) {
            // Web3@1.0 provider doesn't support synchronous http requests,
            // so it only has an async `send` method, instead of a `send` and `sendAsync` in web3@0.x.x`
            // We re-assign the send method so that Web3@1.0 providers work with 0x.js
            (provider as any).sendAsync = (provider as any).send;
        }
        this.web3 = new Web3();
        this.web3.setProvider(provider);
        this.defaults = defaults || {};
        this.jsonRpcRequestId = 0;
    }
    public setProvider(provider: Web3.Provider) {
        delete this.networkIdIfExists;
        this.web3.setProvider(provider);
    }
    public isAddress(address: string): boolean {
        return this.web3.isAddress(address);
    }
    public async isSenderAddressAvailableAsync(senderAddress: string): Promise<boolean> {
        const addresses = await this.getAvailableAddressesAsync();
        return _.includes(addresses, senderAddress);
    }
    public async getNodeVersionAsync(): Promise<string> {
        const nodeVersion = await promisify(this.web3.version.getNode)();
        return nodeVersion;
    }
    public async getTransactionReceiptAsync(txHash: string): Promise<Web3.TransactionReceipt> {
        const transactionReceipt = await promisify(this.web3.eth.getTransactionReceipt)(txHash);
        return transactionReceipt;
    }
    public getCurrentProvider(): Web3.Provider {
        return this.web3.currentProvider;
    }
    public async getNetworkIdIfExistsAsync(): Promise<number|undefined> {
        if (!_.isUndefined(this.networkIdIfExists)) {
          return this.networkIdIfExists;
        }

        try {
            const networkId = await this.getNetworkAsync();
            this.networkIdIfExists = Number(networkId);
            return this.networkIdIfExists;
        } catch (err) {
            return undefined;
        }
    }
    public async getContractInstanceFromArtifactAsync<A extends Web3.ContractInstance>(artifact: Artifact,
                                                                                       address?: string): Promise<A> {
        let contractAddress: string;
        if (_.isUndefined(address)) {
            const networkIdIfExists = await this.getNetworkIdIfExistsAsync();
            if (_.isUndefined(networkIdIfExists)) {
                throw new Error(ZeroExError.NoNetworkId);
            }
            if (_.isUndefined(artifact.networks[networkIdIfExists])) {
                throw new Error(ZeroExError.ContractNotDeployedOnNetwork);
            }
            contractAddress = artifact.networks[networkIdIfExists].address.toLowerCase();
        } else {
            contractAddress = address;
        }
        const doesContractExist = await this.doesContractExistAtAddressAsync(contractAddress);
        if (!doesContractExist) {
            throw new Error(ZeroExError.ContractDoesNotExist);
        }
        const contractInstance = this.getContractInstance<A>(
            artifact.abi, contractAddress,
        );
        return contractInstance;
    }
    public toWei(ethAmount: BigNumber): BigNumber {
        const balanceWei = this.web3.toWei(ethAmount, 'ether');
        return balanceWei;
    }
    public async getBalanceInWeiAsync(owner: string): Promise<BigNumber> {
        let balanceInWei = await promisify(this.web3.eth.getBalance)(owner);
        balanceInWei = new BigNumber(balanceInWei);
        return balanceInWei;
    }
    public async doesContractExistAtAddressAsync(address: string): Promise<boolean> {
        const code = await promisify(this.web3.eth.getCode)(address);
        // Regex matches 0x0, 0x00, 0x in order to accommodate poorly implemented clients
        const codeIsEmpty = /^0x0{0,40}$/i.test(code);
        return !codeIsEmpty;
    }
    public async signTransactionAsync(address: string, message: string): Promise<string> {
        const signData = await promisify(this.web3.eth.sign)(address, message);
        return signData;
    }
    public async getBlockAsync(blockParam: string|Web3.BlockParam): Promise<Web3.BlockWithoutTransactionData> {
        const block = await promisify(this.web3.eth.getBlock)(blockParam);
        return block;
    }
    public async getBlockTimestampAsync(blockParam: string|Web3.BlockParam): Promise<number> {
        const {timestamp} = await this.getBlockAsync(blockParam);
        return timestamp;
    }
    public async getAvailableAddressesAsync(): Promise<string[]> {
        const addresses: string[] = await promisify(this.web3.eth.getAccounts)();
        return addresses;
    }
    public async getLogsAsync(filter: Web3.FilterObject): Promise<Web3.LogEntry[]> {
        let fromBlock = filter.fromBlock;
        if (_.isNumber(fromBlock)) {
            fromBlock = this.web3.toHex(fromBlock);
        }
        let toBlock = filter.toBlock;
        if (_.isNumber(toBlock)) {
            toBlock = this.web3.toHex(toBlock);
        }
        const serializedFilter = {
            ...filter,
            fromBlock,
            toBlock,
        };
        const payload = {
            jsonrpc: '2.0',
            id: this.jsonRpcRequestId++,
            method: 'eth_getLogs',
            params: [serializedFilter],
        };
        const logs = await this.sendRawPayloadAsync(payload);
        return logs;
    }
    private getContractInstance<A extends Web3.ContractInstance>(abi: Web3.ContractAbi, address: string): A {
        const web3ContractInstance = this.web3.eth.contract(abi).at(address);
        const contractInstance = new Contract(web3ContractInstance, this.defaults) as any as A;
        return contractInstance;
    }
    private async getNetworkAsync(): Promise<number> {
        const networkId = await promisify(this.web3.version.getNetwork)();
        return networkId;
    }
    private async sendRawPayloadAsync(payload: Web3.JSONRPCRequestPayload): Promise<any> {
        const sendAsync = this.web3.currentProvider.sendAsync.bind(this.web3.currentProvider);
        const response = await promisify(sendAsync)(payload);
        const result = response.result;
        return result;
    }
}
