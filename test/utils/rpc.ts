import * as ethUtil from 'ethereumjs-util';
import * as request from 'request-promise-native';
import {constants} from './constants';

export class RPC {
    private host: string;
    private port: number;
    private id: number;
    constructor() {
        this.host = constants.RPC_HOST;
        this.port = constants.RPC_PORT;
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
            uri: `http://${this.host}:${this.port}`,
            body: payload,
            headers: {
                'content-type': 'application/json'
            },
        };
        const bodyString = await request(opts);
        const body = JSON.parse(bodyString);
        return body.result;
    }
}
