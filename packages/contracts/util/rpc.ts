import 'isomorphic-fetch';

import * as truffleConf from '../truffle.js';

export class RPC {
    private host: string;
    private port: number;
    private id: number;
    constructor() {
        this.host = truffleConf.networks.development.host;
        this.port = truffleConf.networks.development.port;
        this.id = 0;
    }
    public async increaseTimeAsync(time: number) {
        const method = 'evm_increaseTime';
        const params = [time];
        const payload = this.toPayload(method, params);
        return this.sendAsync(payload);
    }
    public async mineBlockAsync() {
        const method = 'evm_mine';
        const payload = this.toPayload(method);
        return this.sendAsync(payload);
    }
    private toPayload(method: string, params: any[] = []) {
        const payload = JSON.stringify({
            id: this.id,
            method,
            params,
        });
        this.id++;
        return payload;
    }
    private async sendAsync(payload: string): Promise<any> {
        const opts = {
            method: 'POST',
            body: payload,
        };
        const response = await fetch(`http://${this.host}:${this.port}`, opts);
        const responsePayload = await response.json();
        return responsePayload;
    }
}
