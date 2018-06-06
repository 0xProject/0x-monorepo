import { uniqueVersionIds, Web3Wrapper } from '@0xproject/web3-wrapper';
import { includes } from 'lodash';
import * as Web3 from 'web3';

enum NodeType {
    Geth = 'GETH',
    Ganache = 'GANACHE',
}

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
                await this._web3Wrapper.setHeadAsync(blockNumber);
                break;
            default:
                throw new Error(`Unknown node type: ${nodeType}`);
        }
    }
    private async _getNodeTypeAsync(): Promise<NodeType> {
        const version = await this._web3Wrapper.getNodeVersionAsync();
        if (includes(version, uniqueVersionIds.geth)) {
            return NodeType.Geth;
        } else if (includes(version, uniqueVersionIds.ganache)) {
            return NodeType.Ganache;
        } else {
            throw new Error(`Unknown client version: ${version}`);
        }
    }
}
