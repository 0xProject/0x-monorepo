import * as ethUtil from 'ethereumjs-util';

import * as Constants from '../constants';
import { Queue } from '../utils/queue';

export class RawCalldata {
    private static readonly _INITIAL_OFFSET = 0;
    private readonly _value: Buffer;
    private readonly _selector: string;
    private readonly _scopes: Queue<number>;
    private _offset: number; // tracks current offset into raw calldata; used for parsing

    constructor(value: string | Buffer, hasSelectorPrefix: boolean = true) {
        if (typeof value === 'string' && !value.startsWith('0x')) {
            throw new Error(`Expected raw calldata to start with '0x'`);
        }
        const valueBuf = ethUtil.toBuffer(value);
        if (hasSelectorPrefix) {
            this._selector = ethUtil.bufferToHex(
                valueBuf.slice(Constants.HEX_SELECTOR_BYTE_OFFSET_IN_CALLDATA, Constants.HEX_SELECTOR_LENGTH_IN_BYTES),
            );
            this._value = valueBuf.slice(Constants.HEX_SELECTOR_LENGTH_IN_BYTES); // disregard selector
        } else {
            this._selector = '0x';
            this._value = valueBuf;
        }

        this._scopes = new Queue<number>();
        this._scopes.push(RawCalldata._INITIAL_OFFSET);
        this._offset = RawCalldata._INITIAL_OFFSET;
    }

    public popBytes(lengthInBytes: number): Buffer {
        const value = this._value.slice(this._offset, this._offset + lengthInBytes);
        this.setOffset(this._offset + lengthInBytes);
        return value;
    }

    public popWord(): Buffer {
        const wordInBytes = 32;
        return this.popBytes(wordInBytes);
    }

    public popWords(length: number): Buffer {
        const wordInBytes = 32;
        return this.popBytes(length * wordInBytes);
    }

    public readBytes(from: number, to: number): Buffer {
        const value = this._value.slice(from, to);
        return value;
    }

    public setOffset(offsetInBytes: number): void {
        this._offset = offsetInBytes;
    }

    public startScope(): void {
        this._scopes.pushFront(this._offset);
    }

    public endScope(): void {
        this._scopes.pop();
    }

    public getOffset(): number {
        return this._offset;
    }

    public toAbsoluteOffset(relativeOffset: number): number {
        const scopeOffset = this._scopes.peek();
        if (scopeOffset === undefined) {
            throw new Error(`Tried to access undefined scope.`);
        }
        const absoluteOffset = relativeOffset + scopeOffset;
        return absoluteOffset;
    }

    public getSelector(): string {
        return this._selector;
    }
}