import ethUtil = require('ethereumjs-util');
const _ = require('lodash');
import * as Constants from './constants';

export interface DecodingRules {
    structsAsObjects: boolean;
}

export interface EncodingRules {
    optimize?: boolean;
    annotate?: boolean;
}

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
        const hash = ethUtil.sha3(rawData);
        return hash;
    }

    public abstract toBuffer(): Buffer;
    public abstract getRawData(): Buffer;
}

export class PayloadCalldataBlock extends CalldataBlock {
    private readonly _payload: Buffer;

    constructor(
        name: string,
        signature: string,
        parentName: string,
        payload: Buffer,
    ) {
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

export class DependentCalldataBlock extends CalldataBlock {
    public static readonly RAW_DATA_START = new Buffer('<');
    public static readonly RAW_DATA_END = new Buffer('>');
    private static readonly _DEPENDENT_PAYLOAD_SIZE_IN_BYTES = 32;
    private static readonly _EMPTY_HEADER_SIZE = 0;
    private readonly _parent: CalldataBlock;
    private readonly _dependency: CalldataBlock;
    private _aliasFor: CalldataBlock | undefined;

    constructor(
        name: string,
        signature: string,
        parentName: string,
        dependency: CalldataBlock,
        parent: CalldataBlock,
    ) {
        const headerSizeInBytes = DependentCalldataBlock._EMPTY_HEADER_SIZE;
        const bodySizeInBytes = DependentCalldataBlock._DEPENDENT_PAYLOAD_SIZE_IN_BYTES;
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
        const pointerBuf = ethUtil.toBuffer(`0x${pointer.toString(Constants.HEX_BASE)}`);
        const evmWordWidthInBytes = 32;
        const pointerBufPadded = ethUtil.setLengthLeft(pointerBuf, evmWordWidthInBytes);
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
        rawDataComponents.push(DependentCalldataBlock.RAW_DATA_START);
        rawDataComponents.push(dependencyRawData);
        rawDataComponents.push(DependentCalldataBlock.RAW_DATA_END);
        const rawData = Buffer.concat(rawDataComponents);
        return rawData;
    }
}

export class MemberCalldataBlock extends CalldataBlock {
    private _header: Buffer | undefined;
    private _members: CalldataBlock[];

    constructor(name: string, signature: string, parentName: string) {
        super(name, signature, parentName, 0, 0);
        this._members = [];
        this._header = undefined;
    }

    public getRawData(): Buffer {
        const rawDataComponents: Buffer[] = [];
        if (this._header !== undefined) {
            rawDataComponents.push(this._header);
        }
        _.each(this._members, (member: CalldataBlock) => {
            const memberBuffer = member.getRawData();
            rawDataComponents.push(memberBuffer);
        });

        const rawData = Buffer.concat(rawDataComponents);
        return rawData;
    }

    public setMembers(members: CalldataBlock[]): void {
        this._members = members;
    }

    public setHeader(header: Buffer): void {
        this._setHeaderSize(header.byteLength);
        this._header = header;
    }

    public toBuffer(): Buffer {
        if (this._header !== undefined) {
            return this._header;
        }
        return new Buffer('');
    }

    public getMembers(): CalldataBlock[] {
        return this._members;
    }
}

class Queue<T> {
    private _store: T[] = [];
    public push(val: T): void {
        this._store.push(val);
    }
    public pushFront(val: T): void {
        this._store.unshift(val);
    }
    public pop(): T | undefined {
        return this._store.shift();
    }
    public popBack(): T | undefined {
        if (this._store.length === 0) {
            return undefined;
        }
        const backElement = this._store.splice(-1, 1)[0];
        return backElement;
    }
    public merge(q: Queue<T>): void {
        this._store = this._store.concat(q._store);
    }
    public mergeFront(q: Queue<T>): void {
        this._store = q._store.concat(this._store);
    }
    public getStore(): T[] {
        return this._store;
    }
    public peek(): T | undefined {
        return this._store.length >= 0 ? this._store[0] : undefined;
    }
}

export class Calldata {
    private readonly _rules: EncodingRules;
    private _selector: string;
    private _sizeInBytes: number;
    private _root: CalldataBlock | undefined;

    private static _createQueue(block: CalldataBlock): Queue<CalldataBlock> {
        const blockQueue = new Queue<CalldataBlock>();

        // Base Case
        if (!(block instanceof MemberCalldataBlock)) {
            blockQueue.push(block);
            return blockQueue;
        }

        // This is a Member Block
        const memberBlock = block;
        _.eachRight(memberBlock.getMembers(), (member: CalldataBlock) => {
            if (member instanceof MemberCalldataBlock) {
                blockQueue.mergeFront(Calldata._createQueue(member));
            } else {
                blockQueue.pushFront(member);
            }
        });

        // Children
        _.each(memberBlock.getMembers(), (member: CalldataBlock) => {
            if (member instanceof DependentCalldataBlock && member.getAlias() === undefined) {
                const dependency = member.getDependency();
                if (dependency instanceof MemberCalldataBlock) {
                    blockQueue.merge(Calldata._createQueue(dependency));
                } else {
                    blockQueue.push(dependency);
                }
            }
        });

        blockQueue.pushFront(memberBlock);
        return blockQueue;
    }

    public constructor(rules: EncodingRules) {
        this._rules = rules;
        this._selector = '';
        this._sizeInBytes = 0;
        this._root = undefined;
    }

    public optimize(): void {
        if (this._root === undefined) {
            throw new Error('expected root');
        }

        const blocksByHash: { [key: string]: CalldataBlock } = {};

        // 1. Create a queue of subtrees by hash
        // Note that they are ordered the same as
        const subtreeQueue = Calldata._createQueue(this._root);
        let block: CalldataBlock | undefined;
        for (block = subtreeQueue.popBack(); block !== undefined; block = subtreeQueue.popBack()) {
            if (block instanceof DependentCalldataBlock) {
                const dependencyBlockHashBuf = block.getDependency().computeHash();
                const dependencyBlockHash = ethUtil.bufferToHex(dependencyBlockHashBuf);
                if (dependencyBlockHash in blocksByHash) {
                    const blockWithSameHash = blocksByHash[dependencyBlockHash];
                    if (blockWithSameHash !== block.getDependency()) {
                        block.setAlias(blockWithSameHash);
                    }
                }
                continue;
            }

            const blockHashBuf = block.computeHash();
            const blockHash = ethUtil.bufferToHex(blockHashBuf);
            if (!(blockHash in blocksByHash)) {
                blocksByHash[blockHash] = block;
            }
        }
    }

    public toHexString(): string {
        if (this._root === undefined) {
            throw new Error('expected root');
        }

        if (this._rules.optimize) {
            this.optimize();
        }

        const offsetQueue = Calldata._createQueue(this._root);
        let block: CalldataBlock | undefined;
        let offset = 0;
        for (block = offsetQueue.pop(); block !== undefined; block = offsetQueue.pop()) {
            block.setOffset(offset);
            offset += block.getSizeInBytes();
        }

        const hexValue = this._rules.annotate ? this._generateAnnotatedHexString() : this._generateCondensedHexString();
        return hexValue;
    }

    public getSelectorHex(): string {
        return this._selector;
    }

    public getSizeInBytes(): number {
        return this._sizeInBytes;
    }

    public setRoot(block: CalldataBlock): void {
        this._root = block;
        this._sizeInBytes += block.getSizeInBytes();
    }

    public setSelector(selector: string): void {
        this._selector = selector.startsWith('0x') ? selector : `$0x${selector}`;
        if (this._selector.length !== Constants.HEX_SELECTOR_LENGTH_IN_CHARS) {
            throw new Error(`Invalid selector '${this._selector}'`);
        }
        this._sizeInBytes += Constants.HEX_SELECTOR_LENGTH_IN_BYTES; // @TODO: Used to be += 8. Bad?
    }

    private _generateAnnotatedHexString(): string {
        let hexValue = `${this._selector}`;
        if (this._root === undefined) {
            throw new Error('expected root');
        }

        const valueQueue = Calldata._createQueue(this._root);

        let block: CalldataBlock | undefined;
        let offset = 0;
        const functionBlock = valueQueue.peek();
        const functionName: string = functionBlock === undefined ? '' : functionBlock.getName();
        for (block = valueQueue.pop(); block !== undefined; block = valueQueue.pop()) {
            // Process each block 1 word at a time
            const size = block.getSizeInBytes();
            const name = block.getName();
            const parentName = block.getParentName();
            const prettyName = name.replace(`${parentName}.`, '').replace(`${functionName}.`, '');

            // Current offset
            let offsetStr = '';

            // If this block is empty then it's a newline
            const offsetPadding = 10;
            const valuePadding = 74;
            const namePadding = 80;
            const evmWordStartIndex = 0;
            const emptySize = 0;
            let value = '';
            let nameStr = '';
            let line = '';
            if (size === emptySize) {
                offsetStr = ' '.repeat(offsetPadding);
                value = ' '.repeat(valuePadding);
                nameStr = `### ${prettyName.padEnd(namePadding)}`;
                line = `\n${offsetStr}${value}${nameStr}`;
            } else {
                offsetStr = `0x${offset.toString(Constants.HEX_BASE)}`.padEnd(offsetPadding);
                value = ethUtil.stripHexPrefix(ethUtil.bufferToHex(block.toBuffer().slice(evmWordStartIndex, Constants.EVM_WORD_WIDTH_IN_BYTES))).padEnd(valuePadding);
                if (block instanceof MemberCalldataBlock) {
                    nameStr = `### ${prettyName.padEnd(namePadding)}`;
                    line = `\n${offsetStr}${value}${nameStr}`;
                } else {
                    nameStr = `    ${prettyName.padEnd(namePadding)}`;
                    line = `${offsetStr}${value}${nameStr}`;
                }
            }

            for (let j = Constants.EVM_WORD_WIDTH_IN_BYTES; j < size; j += Constants.EVM_WORD_WIDTH_IN_BYTES) {
                offsetStr = `0x${(offset + j).toString(Constants.HEX_BASE)}`.padEnd(offsetPadding);
                value = ethUtil.stripHexPrefix(ethUtil.bufferToHex(block.toBuffer().slice(j, j + Constants.EVM_WORD_WIDTH_IN_BYTES))).padEnd(valuePadding);
                nameStr = ' '.repeat(namePadding);
                line = `${line}\n${offsetStr}${value}${nameStr}`;
            }

            // Append to hex value
            hexValue = `${hexValue}\n${line}`;
            offset += size;
        }

        return hexValue;
    }

    private _generateCondensedHexString(): string {
        const selectorBuffer = ethUtil.toBuffer(this._selector);
        if (this._root === undefined) {
            throw new Error('expected root');
        }

        const valueQueue = Calldata._createQueue(this._root);
        const valueBufs: Buffer[] = [selectorBuffer];
        let block: CalldataBlock | undefined;
        for (block = valueQueue.pop(); block !== undefined; block = valueQueue.pop()) {
            valueBufs.push(block.toBuffer());
        }

        const combinedBuffers = Buffer.concat(valueBufs);
        const hexValue = ethUtil.bufferToHex(combinedBuffers);
        return hexValue;
    }
}

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
            this._selector = ethUtil.bufferToHex(valueBuf.slice(Constants.HEX_SELECTOR_BYTE_OFFSET_IN_CALLDATA, Constants.HEX_SELECTOR_LENGTH_IN_BYTES));
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
