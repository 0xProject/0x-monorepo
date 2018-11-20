import { CalldataBlock } from './calldata_block';

export class PayloadCalldataBlock extends CalldataBlock {
    private readonly _payload: Buffer;

    constructor(name: string, signature: string, parentName: string, payload: Buffer) {
        const headerSizeInBytes = 0;
        const bodySizeInBytes = payload.byteLength;
        super(name, signature, parentName, headerSizeInBytes, bodySizeInBytes);
        this._payload = payload;
    }

    public toBuffer(): Buffer {
        return this._payload;
    }

    public getRawData(): Buffer {
        return this._payload;
    }
}
