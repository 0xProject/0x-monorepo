import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { constants } from '../utils/constants';
import { Queue } from '../utils/queue';

export class RawCalldata {
    private static readonly _INITIAL_OFFSET = 0;
    private readonly _value: Buffer;
    private readonly _selector: string;
    private readonly _scopes: Queue<number>;
    private _offset: number;

    public constructor(value: string | Buffer, hasSelector: boolean = true) {
        // Sanity check
        if (typeof value === 'string' && !_.startsWith(value, '0x')) {
            throw new Error(`Expected raw calldata to start with '0x'`);
        }
        // Construct initial values
        this._value = ethUtil.toBuffer(value);
        this._selector = '0x';
        this._scopes = new Queue<number>();
        this._scopes.pushBack(RawCalldata._INITIAL_OFFSET);
        this._offset = RawCalldata._INITIAL_OFFSET;
        // If there's a selector then slice it
        if (hasSelector) {
            const selectorBuf = this._value.slice(constants.HEX_SELECTOR_LENGTH_IN_BYTES);
            this._value = this._value.slice(constants.HEX_SELECTOR_LENGTH_IN_BYTES);
            this._selector = ethUtil.bufferToHex(selectorBuf);
        }
    }

    public popBytes(lengthInBytes: number): Buffer {
        const popBegin = this._offset;
        const popEnd = popBegin + lengthInBytes;
        if (popEnd > this._value.byteLength) {
            throw new Error(`Tried to decode beyond the end of calldata`);
        }
        const value = this._value.slice(popBegin, popEnd);
        this.setOffset(popEnd);
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
        this._scopes.popFront();
    }

    public getOffset(): number {
        return this._offset;
    }

    public toAbsoluteOffset(relativeOffset: number): number {
        const scopeOffset = this._scopes.peekFront();
        if (scopeOffset === undefined) {
            throw new Error(`Tried to access undefined scope.`);
        }
        const absoluteOffset = relativeOffset + scopeOffset;
        return absoluteOffset;
    }

    public getSelector(): string {
        return this._selector;
    }

    public getSizeInBytes(): number {
        const sizeInBytes = this._value.byteLength;
        return sizeInBytes;
    }
}
