import { CalldataBlock } from '../calldata_block';

export class BlobCalldataBlock extends CalldataBlock {
    private readonly _blob: Buffer;

    constructor(name: string, signature: string, parentName: string, blob: Buffer) {
        const headerSizeInBytes = 0;
        const bodySizeInBytes = blob.byteLength;
        super(name, signature, parentName, headerSizeInBytes, bodySizeInBytes);
        this._blob = blob;
    }

    public toBuffer(): Buffer {
        return this._blob;
    }

    public getRawData(): Buffer {
        return this._blob;
    }
}
