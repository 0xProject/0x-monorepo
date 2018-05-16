import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as Web3 from 'web3';

enum NodeType {
    Geth = 'GETH',
    Ganache = 'GANACHE',
}

// These are unique identifiers contained in the response of the
// web3_clientVersion call.
const GETH_VERSION_ID = 'Geth';
const GANACHE_VERSION_ID = 'EthereumJS TestRPC';

export class BlockchainLifecycle {
    private _web3Wrapper: Web3Wrapper;
    private _snapshotIdsStack: number[];
    constructor(web3Wrapper: Web3Wrapper) {
        this._web3Wrapper = web3Wrapper;
        this._snapshotIdsStack = [];
    }
    public async startAsync(): Promise<void> {
        const nodeType = await this._getNodeTypeAsync();
        switch (nodeType) {
            case NodeType.Ganache:
                const snapshotId = await this._web3Wrapper.takeSnapshotAsync();
                this._snapshotIdsStack.push(snapshotId);
                break;
            case NodeType.Geth:
                const blockNumber = await this._web3Wrapper.getBlockNumberAsync();
                console.log(`block number for taking snapshot: ${blockNumber}`);
                this._snapshotIdsStack.push(blockNumber);
                break;
            default:
                throw new Error(`Unknown node type: ${nodeType}`);
        }
    }
    public async revertAsync(): Promise<void> {
        const nodeType = await this._getNodeTypeAsync();
        switch (nodeType) {
            case NodeType.Ganache:
                const snapshotId = this._snapshotIdsStack.pop() as number;
                const didRevert = await this._web3Wrapper.revertSnapshotAsync(snapshotId);
                if (!didRevert) {
                    throw new Error(`Snapshot with id #${snapshotId} failed to revert`);
                }
                break;
            case NodeType.Geth:
                const blockNumber = this._snapshotIdsStack.pop() as number;
                console.log(`block number for restoring snapshot: ${blockNumber}`);
                // Note: setHead will sometimes break the miner, so we need to
                // stop it first if it was running.
                const wasMining = await this._web3Wrapper.isMiningAsync();
                if (wasMining) {
                    await this._web3Wrapper.minerStopAsync();
                }
                await this._web3Wrapper.setHeadAsync(blockNumber);
                if (wasMining) {
                    await this._web3Wrapper.minerStartAsync();
                }
                break;
            default:
                throw new Error(`Unknown node type: ${nodeType}`);
        }
    }
    private async _getNodeTypeAsync(): Promise<NodeType> {
        const version = await this._web3Wrapper.getNodeVersionAsync();
        if (_.includes(version, GETH_VERSION_ID)) {
            return NodeType.Geth;
        } else if (_.includes(version, GANACHE_VERSION_ID)) {
            return NodeType.Ganache;
        } else {
            throw new Error(`Unknown client version: ${version}`);
        }
    }
}
