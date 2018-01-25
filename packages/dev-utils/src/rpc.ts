import * as ethUtil from 'ethereumjs-util';
import * as request from 'request-promise-native';

export class RPC {
    private _url: string;
    private _id: number;
    constructor(url: string) {
        this._url = url;
        this._id = 0;
    }
    public async takeSnapshotAsync(): Promise<number> {
        const method = 'evm_snapshot';
        const params: any[] = [];
        const payload = this._toPayload(method, params);
        const snapshotIdHex = await this._sendAsync(payload);
        const snapshotId = ethUtil.bufferToInt(ethUtil.toBuffer(snapshotIdHex));
        return snapshotId;
    }
    public async revertSnapshotAsync(snapshotId: number): Promise<boolean> {
        const method = 'evm_revert';
        const params = [snapshotId];
        const payload = this._toPayload(method, params);
        const didRevert = await this._sendAsync(payload);
        return didRevert;
    }
    public async increaseTimeAsync(time: number) {
        const method = 'evm_increaseTime';
        const params = [time];
        const payload = this._toPayload(method, params);
        return this._sendAsync(payload);
    }
    public async mineBlockAsync(): Promise<void> {
        const method = 'evm_mine';
        const params: any[] = [];
        const payload = this._toPayload(method, params);
        await this._sendAsync(payload);
    }
    private _toPayload(method: string, params: any[] = []): string {
        const payload = JSON.stringify({
            id: this._id,
            method,
            params,
        });
        this._id += 1;
        return payload;
    }
    private async _sendAsync(payload: string): Promise<any> {
        const opts = {
            method: 'POST',
            uri: this._url,
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
