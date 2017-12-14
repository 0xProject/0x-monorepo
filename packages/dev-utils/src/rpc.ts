import * as ethUtil from 'ethereumjs-util';
import * as request from 'request-promise-native';

export class RPC {
    private url: string;
    private port: number;
    private id: number;
    constructor(url: string) {
        this.url = url;
        this.id = 0;
    }
    public async takeSnapshotAsync(): Promise<number> {
        const method = 'evm_snapshot';
        const params: any[] = [];
        const payload = this.toPayload(method, params);
        const snapshotIdHex = await this.sendAsync(payload);
        const snapshotId = ethUtil.bufferToInt(ethUtil.toBuffer(snapshotIdHex));
        return snapshotId;
    }
    public async revertSnapshotAsync(snapshotId: number): Promise<boolean> {
        const method = 'evm_revert';
        const params = [snapshotId];
        const payload = this.toPayload(method, params);
        const didRevert = await this.sendAsync(payload);
        return didRevert;
    }
    public async increaseTimeAsync(time: number) {
        const method = 'evm_increaseTime';
        const params = [time];
        const payload = this.toPayload(method, params);
        return this.sendAsync(payload);
    }
    public async mineBlockAsync(): Promise<void> {
        const method = 'evm_mine';
        const params: any[] = [];
        const payload = this.toPayload(method, params);
        await this.sendAsync(payload);
    }
    private toPayload(method: string, params: any[] = []): string {
        const payload = JSON.stringify({
            id: this.id,
            method,
            params,
        });
        this.id += 1;
        return payload;
    }
    private async sendAsync(payload: string): Promise<any> {
        const opts = {
            method: 'POST',
            uri: this.url,
            body: payload,
            headers: {
                'content-type': 'application/json',
            },
        };
        const bodyString = await request(opts);
        const body = JSON.parse(bodyString);
        return body.result;
    }
}
