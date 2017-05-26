import {RPC} from './rpc';

export class BlockchainClean {
    private rpc: RPC;
    private snapshotId: number;
    constructor() {
        this.rpc = new RPC();
    }
    // TODO: Check if running on TestRPC or on actual node, if actual node, re-deploy contracts instead
    public async setupAsync() {
        this.snapshotId = await this.rpc.takeSnapshotAsync();
    }
    public async restoreAsync() {
        const didRevert = await this.rpc.revertSnapshotAsync(this.snapshotId);
        if (!didRevert) {
            throw new Error(`Snapshot with id #${this.snapshotId} failed to revert`);
        }
    }
};
