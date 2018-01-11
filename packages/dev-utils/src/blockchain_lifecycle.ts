import { RPC } from './rpc';

export class BlockchainLifecycle {
    private _rpc: RPC;
    private _snapshotIdsStack: number[];
    constructor(url: string) {
        this._rpc = new RPC(url);
        this._snapshotIdsStack = [];
    }
    // TODO: In order to run these tests on an actual node, we should check if we are running against
    // TestRPC, if so, use snapshots, otherwise re-deploy contracts before every test
    public async startAsync(): Promise<void> {
        const snapshotId = await this._rpc.takeSnapshotAsync();
        this._snapshotIdsStack.push(snapshotId);
    }
    public async revertAsync(): Promise<void> {
        const snapshotId = this._snapshotIdsStack.pop() as number;
        const didRevert = await this._rpc.revertSnapshotAsync(snapshotId);
        if (!didRevert) {
            throw new Error(`Snapshot with id #${snapshotId} failed to revert`);
        }
    }
}
