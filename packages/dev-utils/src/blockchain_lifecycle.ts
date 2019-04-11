import { logUtils } from '@0x/utils';
import { NodeType, Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

export class BlockchainLifecycle {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _snapshotIdsStack: number[];
    private _addresses: string[] = [];
    private _nodeType: NodeType | undefined;
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
                // HACK(albrow) It's possible that we applied a time offset but
                // the transaction we mined to put that time offset into the
                // blockchain was reverted. As a workaround, we mine a new dummy
                // block so that the latest block timestamp accounts for any
                // possible time offsets.
                await this._mineDummyBlockAsync();
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
        if (this._nodeType === undefined) {
            this._nodeType = await this._web3Wrapper.getNodeTypeAsync();
        }
        return this._nodeType;
    }
    // Sends a transaction that has no real effect on the state and waits for it
    // to be mined.
    private async _mineDummyBlockAsync(): Promise<void> {
        if (this._addresses.length === 0) {
            this._addresses = await this._web3Wrapper.getAvailableAddressesAsync();
            if (this._addresses.length === 0) {
                throw new Error('No accounts found');
            }
        }
        await this._web3Wrapper.awaitTransactionMinedAsync(
            await this._web3Wrapper.sendTransactionAsync({
                from: this._addresses[0],
                to: this._addresses[0],
                value: '0',
            }),
            0,
        );
    }
}
