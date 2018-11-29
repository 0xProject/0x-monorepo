import * as ethUtil from 'ethereumjs-util';

import * as Constants from '../../utils/constants';

import { CalldataBlock } from '../calldata_block';

export class Pointer extends CalldataBlock {
    public static readonly RAW_DATA_START = new Buffer('<');
    public static readonly RAW_DATA_END = new Buffer('>');
    private static readonly _DEPENDENT_PAYLOAD_SIZE_IN_BYTES = 32;
    private static readonly _EMPTY_HEADER_SIZE = 0;
    private readonly _parent: CalldataBlock;
    private readonly _dependency: CalldataBlock;
    private _aliasFor: CalldataBlock | undefined;

    constructor(name: string, signature: string, parentName: string, dependency: CalldataBlock, parent: CalldataBlock) {
        const headerSizeInBytes = Pointer._EMPTY_HEADER_SIZE;
        const bodySizeInBytes = Pointer._DEPENDENT_PAYLOAD_SIZE_IN_BYTES;
        super(name, signature, parentName, headerSizeInBytes, bodySizeInBytes);
        this._parent = parent;
        this._dependency = dependency;
        this._aliasFor = undefined;
    }

    public toBuffer(): Buffer {
        const destinationOffset =
            this._aliasFor !== undefined ? this._aliasFor.getOffsetInBytes() : this._dependency.getOffsetInBytes();
        const parentOffset = this._parent.getOffsetInBytes();
        const parentHeaderSize = this._parent.getHeaderSizeInBytes();
        const pointer: number = destinationOffset - (parentOffset + parentHeaderSize);
        const pointerHex = `0x${pointer.toString(Constants.HEX_BASE)}`;
        const pointerBuf = ethUtil.toBuffer(pointerHex);
        const pointerBufPadded = ethUtil.setLengthLeft(pointerBuf, Constants.EVM_WORD_WIDTH_IN_BYTES);
        return pointerBufPadded;
    }

    public getDependency(): CalldataBlock {
        return this._dependency;
    }

    public setAlias(block: CalldataBlock): void {
        this._aliasFor = block;
        this._setName(`${this.getName()} (alias for ${block.getName()})`);
    }

    public getAlias(): CalldataBlock | undefined {
        return this._aliasFor;
    }

    public getRawData(): Buffer {
        const dependencyRawData = this._dependency.getRawData();
        const rawDataComponents: Buffer[] = [];
        rawDataComponents.push(Pointer.RAW_DATA_START);
        rawDataComponents.push(dependencyRawData);
        rawDataComponents.push(Pointer.RAW_DATA_END);
        const rawData = Buffer.concat(rawDataComponents);
        return rawData;
    }
}
