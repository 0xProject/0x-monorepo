import * as ethUtil from 'ethereumjs-util';

export abstract class CalldataBlock {
    private readonly _signature: string;
    private readonly _parentName: string;
    private _name: string;
    private _offsetInBytes: number;
    private _headerSizeInBytes: number;
    private _bodySizeInBytes: number;

    constructor(
        name: string,
        signature: string,
        parentName: string,
        headerSizeInBytes: number,
        bodySizeInBytes: number,
    ) {
        this._name = name;
        this._signature = signature;
        this._parentName = parentName;
        this._offsetInBytes = 0;
        this._headerSizeInBytes = headerSizeInBytes;
        this._bodySizeInBytes = bodySizeInBytes;
    }

    protected _setHeaderSize(headerSizeInBytes: number): void {
        this._headerSizeInBytes = headerSizeInBytes;
    }

    protected _setBodySize(bodySizeInBytes: number): void {
        this._bodySizeInBytes = bodySizeInBytes;
    }

    protected _setName(name: string): void {
        this._name = name;
    }

    public getName(): string {
        return this._name;
    }

    public getParentName(): string {
        return this._parentName;
    }

    public getSignature(): string {
        return this._signature;
    }
    public getHeaderSizeInBytes(): number {
        return this._headerSizeInBytes;
    }

    public getBodySizeInBytes(): number {
        return this._bodySizeInBytes;
    }

    public getSizeInBytes(): number {
        return this.getHeaderSizeInBytes() + this.getBodySizeInBytes();
    }

    public getOffsetInBytes(): number {
        return this._offsetInBytes;
    }

    public setOffset(offsetInBytes: number): void {
        this._offsetInBytes = offsetInBytes;
    }

    public computeHash(): Buffer {
        const rawData = this.getRawData();
        const hash = ethUtil.keccak256(rawData);
        return hash;
    }

    public abstract toBuffer(): Buffer;
    public abstract getRawData(): Buffer;
}
