import * as fetch from 'node-fetch';
import * as Web3 from 'web3';
import * as _ from 'lodash';
import * as abi from 'ethereumjs-abi';
import {BlockAndLogStreamer} from 'ethereumjs-blockstream';
import {Web3Wrapper} from './web3_wrapper';
import {contractAbi} from './etherdelta';

const MONITORING_INTERVAL_MS = 1000;
const CONTRACT_ADDRESS = '0x8d12a197cb00d4747a1fe03395095ce2a5cc6819';

// tslint:disable:no-console

export class TxPoolMonitor {
    private _txPoolWatchIntervalId: number;
    private _blockWatchIntervalId: number;
    private _web3Wrapper: Web3Wrapper;
    private _state = [] as any as {[hash: string]: Web3.Transaction};
    private _typesBySignatureHash: {[signatureHash: string]: string[]};
    private _signatureBySignatureHash: {[signatureHash: string]: string};
    constructor(web3Wrapper: Web3Wrapper) {
        this._web3Wrapper = web3Wrapper;
        this._typesBySignatureHash = {};
        this._signatureBySignatureHash = {};
        for (const functionAbi of _.filter(contractAbi, {type: 'function', constant: false})) {
            const types = _.map(functionAbi.inputs, input => input.type);
            const humanReadableTypes = _.map(functionAbi.inputs, input => `${input.type} ${input.name}`);
            const signature = functionAbi.name + '(' + types.join(',') + ')';
            const humanReadableSignature = functionAbi.name + '(' + humanReadableTypes.join(',') + ')';
            const signatureHash = this._web3Wrapper.sha3(signature).substr(0, 10);
            this._typesBySignatureHash[signatureHash] = types;
            this._signatureBySignatureHash[signatureHash] = humanReadableSignature;
        }
    }
    public watch() {
        this.watchBlocks();
        this.watchMempool();
    }
    private watchBlocks(): void {
        const config = {};
        const blockAndLogStreamer = new BlockAndLogStreamer(
            this._web3Wrapper.getBlockByHashAsync.bind(this._web3Wrapper),
            _.noop as any,
            config,
        );
        const getLatestBlock = this._web3Wrapper.getLatestBlockAsync.bind(this._web3Wrapper);
        const onBlockAddedSubscriptionToken = blockAndLogStreamer.subscribeToOnBlockAdded(
            this.onBlockAdded.bind(this));
        const onBlockRemovedSubscriptionToken = blockAndLogStreamer.subscribeToOnBlockRemoved(
            this.onBlockRemoved.bind(this));
        this._blockWatchIntervalId = setInterval(async () => {
            blockAndLogStreamer.reconcileNewBlock(await getLatestBlock());
        }, MONITORING_INTERVAL_MS);
    }
    private async onBlockAdded(block: any): Promise<void> {
        console.log('Block added');
        for (const tx of block.transactions) {
            if (tx.to !== CONTRACT_ADDRESS) {
                continue;
            }
            if (_.isUndefined(this._state[tx.hash])) {
                console.log(`Out of a mempool - https://etherscan.io/tx/${tx.hash}`);
            } else {
                console.log(`Mempool + https://etherscan.io/tx/${tx.hash}`);
                delete this._state[tx.hash];
            }
        }
    }
    private async onBlockRemoved(block: any): Promise<void> {
        console.log('Block removed');
        for (const tx of block.transactions) {
            if (tx.to !== CONTRACT_ADDRESS) {
                continue;
            }
            if (_.isUndefined(this._state[tx.hash])) {
                console.log(`Adding back to the mempool - https://etherscan.io/tx/${tx.hash}`);
                this._state[tx.hash] = tx;
            } else {
                console.log(`Removed transaction that was already in the mempool  https://etherscan.io/tx/${tx.hash}`);
            }
        }
    }
    private watchMempool(): void {
        this._txPoolWatchIntervalId = setInterval(this.stepAsync.bind(this), MONITORING_INTERVAL_MS);
    }
    private async stepAsync(): Promise<void> {
        let txs = await this._web3Wrapper.getTxPoolContentAsync();
        txs = _.filter(txs, tx => tx.to === CONTRACT_ADDRESS);
        const mempoolByHash = _.groupBy(txs, 'hash');
        for (const tx of txs) {
            if (_.isUndefined(this._state[tx.hash])) {
                this._state[tx.hash] = tx;
                this.printTxDetails(tx);
            }
        }
    }
    private printTxDetails(tx: Web3.Transaction): void {
        console.log(`Received new transaction https://etherscan.io/tx/${tx.hash}`);
        const input = tx.input;
        const signatureHash = input.substr(0, 10);
        const params = input.substr(10);
        const types = this._typesBySignatureHash[signatureHash];
        console.log(this._signatureBySignatureHash[signatureHash]);
        // Split in chunks by 64 characters
        const args = params.match(/.{1,64}/g);
        _.map(args, (arg, i) => {
            const type = types[i];
            if (type === 'address') {
                console.log('0x' + arg.substr(24));
            } else {
                console.log(this._web3Wrapper.toBigNumber('0x' + arg));
            }
        });
    }
}
