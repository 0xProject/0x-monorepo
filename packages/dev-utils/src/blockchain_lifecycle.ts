import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as Web3 from 'web3';

export class BlockchainLifecycle {
    private _web3Wrapper: Web3Wrapper;
    private _snapshotIdsStack: number[];
    constructor(web3Orweb3Wrapper: Web3Wrapper | Web3) {
        this._web3Wrapper = (web3Orweb3Wrapper as Web3Wrapper).isZeroExWeb3Wrapper
            ? (web3Orweb3Wrapper as Web3Wrapper)
            : new Web3Wrapper((web3Orweb3Wrapper as Web3).currentProvider);
        this._snapshotIdsStack = [];
    }
    // TODO: In order to run these tests on an actual node, we should check if we are running against
    // TestRPC, if so, use snapshots, otherwise re-deploy contracts before every test
    public async startAsync(): Promise<void> {
        const snapshotId = await this._web3Wrapper.takeSnapshotAsync();
        this._snapshotIdsStack.push(snapshotId);
    }
    public async revertAsync(): Promise<void> {
        const snapshotId = this._snapshotIdsStack.pop() as number;
        const didRevert = await this._web3Wrapper.revertSnapshotAsync(snapshotId);
        if (!didRevert) {
            throw new Error(`Snapshot with id #${snapshotId} failed to revert`);
        }
    }
}
