import {RPC} from './rpc';

export class BlockchainLifecycle {
    private rpc: RPC;
    private snapshotIdsStack: number[];
    constructor() {
        this.rpc = new RPC();
        this.snapshotIdsStack = [];
    }
    // TODO: In order to run these tests on an actual node, we should check if we are running against
    // TestRPC, if so, use snapshots, otherwise re-deploy contracts before every test
    public async startAsync(): Promise<void> {
        const snapshotId = await this.rpc.takeSnapshotAsync();
        this.snapshotIdsStack.push(snapshotId);
    }
    public async revertAsync(): Promise<void> {
        const snapshotId = this.snapshotIdsStack.pop() as number;
        const didRevert = await this.rpc.revertSnapshotAsync(snapshotId);
        if (!didRevert) {
            throw new Error(`Snapshot with id #${snapshotId} failed to revert`);
        }
    }
}
