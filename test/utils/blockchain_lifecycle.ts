import {RPC} from './rpc';

export class BlockchainLifecycle {
    private rpc: RPC;
    private snapshotId: number;
    constructor() {
        this.rpc = new RPC();
    }
    // TODO: In order to run these tests on an actual node, we should check if we are running against
    // TestRPC, if so, use snapshots, otherwise re-deploy contracts before every test
    public async startAsync(): Promise<void> {
        this.snapshotId = await this.rpc.takeSnapshotAsync();
    }
    public async revertAsync(): Promise<void> {
        const didRevert = await this.rpc.revertSnapshotAsync(this.snapshotId);
        if (!didRevert) {
            throw new Error(`Snapshot with id #${this.snapshotId} failed to revert`);
        }
    }
    public async waitUntilMinedAsync(txHash: string): Promise<void> {
        return undefined;
    }
}
