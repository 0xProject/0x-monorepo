import ethUtil = require('ethereumjs-util');
import CommunicationChatBubbleOutline from 'material-ui/SvgIcon';
var _ = require('lodash');

export interface DecodingRules {
    structsAsObjects: boolean;
}

export interface EncodingRules {
    optimize?: boolean;
    annotate?: boolean;
}

export abstract class CalldataBlock {
    private name: string;
    private signature: string;
    private offsetInBytes: number;
    private headerSizeInBytes: number;
    private bodySizeInBytes: number;
    private relocatable: boolean;
    private parentName: string;

    constructor(name: string, signature: string, parentName: string, /*offsetInBytes: number,*/ headerSizeInBytes: number, bodySizeInBytes: number, relocatable: boolean) {
        this.name = name;
        this.signature = signature;
        this.parentName = parentName;
        this.offsetInBytes = 0;
        this.headerSizeInBytes = headerSizeInBytes;
        this.bodySizeInBytes = bodySizeInBytes;
        this.relocatable = relocatable;
    }

    protected setHeaderSize(headerSizeInBytes: number) {
        this.headerSizeInBytes = headerSizeInBytes;
    }

    protected setBodySize(bodySizeInBytes: number) {
        this.bodySizeInBytes = bodySizeInBytes;
    }

    protected setName(name: string) {
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }

    public getParentName(): string {
        return this.parentName;
    }

    public getSignature(): string {
        return this.signature;
    }

    public isRelocatable(): boolean {
        return this.relocatable;
    }

    public getHeaderSizeInBytes(): number {
        return this.headerSizeInBytes;
    }

    public getBodySizeInBytes(): number {
        return this.bodySizeInBytes;
    }

    public getSizeInBytes(): number {
        return this.headerSizeInBytes + this.bodySizeInBytes;
    }

    public getOffsetInBytes(): number {
        return this.offsetInBytes;
    }

    public setOffset(offsetInBytes: number) {
        this.offsetInBytes = offsetInBytes;
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
    private payload: Buffer;

    constructor(name: string, signature: string, parentName: string, /*offsetInBytes: number,*/ relocatable: boolean, payload: Buffer) {
        const headerSizeInBytes = 0;
        const bodySizeInBytes = payload.byteLength;
        super(name, signature, parentName, headerSizeInBytes, bodySizeInBytes, relocatable);
        this.payload = payload;
    }

    public toBuffer(): Buffer {
        return this.payload;
    }

    public getRawData(): Buffer {
        return this.payload;
    }
}

export class DependentCalldataBlock extends CalldataBlock {
    public static DEPENDENT_PAYLOAD_SIZE_IN_BYTES = 32;
    public static RAW_DATA_START = new Buffer('<');
    public static RAW_DATA_END = new Buffer('>');
    private parent: CalldataBlock;
    private dependency: CalldataBlock;
    private aliasFor: CalldataBlock | undefined;

    constructor(name: string, signature: string, parentName: string, relocatable: boolean, dependency: CalldataBlock, parent: CalldataBlock) {
        const headerSizeInBytes = 0;
        const bodySizeInBytes = DependentCalldataBlock.DEPENDENT_PAYLOAD_SIZE_IN_BYTES;
        super(name, signature, parentName, headerSizeInBytes, bodySizeInBytes, relocatable);
        this.parent = parent;
        this.dependency = dependency;
        this.aliasFor = undefined;
    }

    public toBuffer(): Buffer {
        const destinationOffset = (this.aliasFor !== undefined) ? this.aliasFor.getOffsetInBytes() : this.dependency.getOffsetInBytes();
        const parentOffset = this.parent.getOffsetInBytes();
        const parentHeaderSize = this.parent.getHeaderSizeInBytes();
        const pointer: number = destinationOffset - (parentOffset + parentHeaderSize);
        const pointerBuf = ethUtil.toBuffer(`0x${pointer.toString(16)}`);
        const evmWordWidthInBytes = 32;
        const pointerBufPadded = ethUtil.setLengthLeft(pointerBuf, evmWordWidthInBytes);
        return pointerBufPadded;
    }

    public getDependency(): CalldataBlock {
        return this.dependency;
    }

    public setAlias(block: CalldataBlock) {
        this.aliasFor = block;
        this.setName(`${this.getName()} (alias for ${block.getName()})`);
    }

    public getAlias(): CalldataBlock | undefined {
        return this.aliasFor;
    }

    public getRawData(): Buffer {
        const dependencyRawData = this.dependency.getRawData();
        const rawDataComponents: Buffer[] = [];
        rawDataComponents.push(DependentCalldataBlock.RAW_DATA_START);
        rawDataComponents.push(dependencyRawData);
        rawDataComponents.push(DependentCalldataBlock.RAW_DATA_END);
        const rawData = Buffer.concat(rawDataComponents);
        return rawData;
    }
}

export class MemberCalldataBlock extends CalldataBlock {
    private static DEPENDENT_PAYLOAD_SIZE_IN_BYTES = 32;
    private header: Buffer | undefined;
    private members: CalldataBlock[];
    private contiguous: boolean;

    constructor(name: string, signature: string, parentName: string, relocatable: boolean, contiguous: boolean) {
        super(name, signature, parentName, 0, 0, relocatable);
        this.members = [];
        this.header = undefined;
        this.contiguous = contiguous;
    }

    public getRawData(): Buffer {
        const rawDataComponents: Buffer[] = [];
        if (this.header !== undefined) {
            rawDataComponents.push(this.header);
        }
        _.each(this.members, (member: CalldataBlock) => {
            const memberBuffer = member.getRawData();
            rawDataComponents.push(memberBuffer);
        });

        const rawData = Buffer.concat(rawDataComponents);
        return rawData;
    }

    public setMembers(members: CalldataBlock[]) {
        let bodySizeInBytes = 0;
        _.each(members, (member: CalldataBlock) => {
            bodySizeInBytes += member.getSizeInBytes();
        });
        this.members = members;
        this.setBodySize(0);
    }

    public isContiguous(): boolean {
        return true;
    }

    public setHeader(header: Buffer) {
        this.setHeaderSize(header.byteLength);
        this.header = header;
    }

    public toBuffer(): Buffer {
        if (this.header !== undefined) return this.header;
        return new Buffer('');
    }

    public getMembers(): CalldataBlock[] {
        return this.members;
    }
}

class Queue<T> {
    private store: T[] = [];
    push(val: T) {
        this.store.push(val);
    }
    pushFront(val: T) {
        this.store.unshift(val);
    }
    pop(): T | undefined {
        return this.store.shift();
    }
    popBack(): T | undefined {
        if (this.store.length === 0) return undefined;
        const backElement = this.store.splice(-1, 1)[0];
        return backElement;
    }
    merge(q: Queue<T>) {
        this.store = this.store.concat(q.store);
    }
    mergeFront(q: Queue<T>) {
        this.store = q.store.concat(this.store);
    }
    getStore(): T[] {
        return this.store;
    }
    peek(): T | undefined {
        return this.store.length >= 0 ? this.store[0] : undefined;
    }
}

export class Calldata {
    private selector: string;
    private rules: EncodingRules;
    private sizeInBytes: number;
    private root: MemberCalldataBlock | undefined;

    constructor(rules: EncodingRules) {
        this.selector = '';
        this.rules = rules;
        this.sizeInBytes = 0;
        this.root = undefined;
    }

    private createQueue(memberBlock: MemberCalldataBlock): Queue<CalldataBlock> {
        const blockQueue = new Queue<CalldataBlock>();
        _.eachRight(memberBlock.getMembers(), (member: CalldataBlock) => {
            if (member instanceof MemberCalldataBlock) {
                blockQueue.mergeFront(this.createQueue(member));
            } else {
                blockQueue.pushFront(member);
            }
        });

        // Children
        _.each(memberBlock.getMembers(), (member: CalldataBlock) => {
            if (member instanceof DependentCalldataBlock && member.getAlias() === undefined) {
                let dependency = member.getDependency();
                if (dependency instanceof MemberCalldataBlock) {
                    blockQueue.merge(this.createQueue(dependency));
                } else {
                    blockQueue.push(dependency);
                }
            }
        });

        blockQueue.pushFront(memberBlock);
        return blockQueue;
    }

    private generateAnnotatedHexString(): string {
        let hexValue = `${this.selector}`;
        if (this.root === undefined) {
            throw new Error('expected root');
        }

        const valueQueue = this.createQueue(this.root);

        let block: CalldataBlock | undefined;
        let offset = 0;
        const functionBlock = valueQueue.peek();
        let functionName: string = functionBlock === undefined ? '' : functionBlock.getName();
        while ((block = valueQueue.pop()) !== undefined) {
            // Set f

            // Process each block 1 word at a time
            const size = block.getSizeInBytes();
            const name = block.getName();
            const parentName = block.getParentName();
            console.log('*'.repeat(50), parentName, ' vs ', name);

            //const ancestrialNamesOffset = name.startsWith('ptr<') ? 4 : 0;
            //const parentOffset = name.lastIndexOf(parentName);
            const prettyName = name.replace(`${parentName}.`, '').replace(`${functionName}.`, '');//.replace(`${parentName}[`, '[');
            const signature = block.getSignature();

            // Current offset
            let offsetStr = '';

            // If this block is empty then it's a newline
            let value = '';
            let nameStr = '';
            let line = '';
            if (size === 0) {
                offsetStr = ' '.repeat(10);
                value = ' '.repeat(74);
                nameStr = `### ${prettyName.padEnd(80)}`;
                line = `\n${offsetStr}${value}${nameStr}`;
            } else {
                offsetStr = `0x${offset.toString(16)}`.padEnd(10, ' ');
                value = ethUtil.stripHexPrefix(ethUtil.bufferToHex(block.toBuffer().slice(0, 32))).padEnd(74);
                if (block instanceof MemberCalldataBlock) {
                    nameStr = `### ${prettyName.padEnd(80)}`;
                    line = `\n${offsetStr}${value}${nameStr}`;
                } else {
                    nameStr = `    ${prettyName.padEnd(80)}`;
                    line = `${offsetStr}${value}${nameStr}`;
                }
            }

            for (let j = 32; j < size; j += 32) {
                offsetStr = `0x${(offset + j).toString(16)}`.padEnd(10, ' ');
                value = ethUtil.stripHexPrefix(ethUtil.bufferToHex(block.toBuffer().slice(j, j + 32))).padEnd(74);
                nameStr = ' '.repeat(40);

                line = `${line}\n${offsetStr}${value}${nameStr}`;
            }

            // Append to hex value
            hexValue = `${hexValue}\n${line}`;
            offset += size;
        }

        return hexValue;
    }

    private generateCondensedHexString(): string {
        let selectorBuffer = ethUtil.toBuffer(this.selector);
        if (this.root === undefined) {
            throw new Error('expected root');
        }

        const valueQueue = this.createQueue(this.root);
        const valueBufs: Buffer[] = [selectorBuffer];
        let block: CalldataBlock | undefined;
        while ((block = valueQueue.pop()) !== undefined) {
            valueBufs.push(block.toBuffer());
        }

        const combinedBuffers = Buffer.concat(valueBufs);
        const hexValue = ethUtil.bufferToHex(combinedBuffers);
        return hexValue;
    }

    public optimize() {
        if (this.root === undefined) {
            throw new Error('expected root');
        }

        const blocksByHash: { [key: string]: CalldataBlock } = {};

        // 1. Create a queue of subtrees by hash
        // Note that they are ordered the same as 
        const subtreeQueue = this.createQueue(this.root);
        let block: CalldataBlock | undefined;
        console.log('*'.repeat(100), ' OPTIMIZING ', '*'.repeat(100));
        while ((block = subtreeQueue.popBack()) !== undefined) {
            console.log(block.getName());
            if (block instanceof DependentCalldataBlock) {
                const blockHashBuf = block.getDependency().computeHash();
                const blockHash = ethUtil.bufferToHex(blockHashBuf);
                if (blockHash in blocksByHash) {
                    const blockWithSameHash = blocksByHash[blockHash];
                    if (blockWithSameHash !== block.getDependency()) {
                        block.setAlias(blockWithSameHash);
                    }
                }
                continue;
            }

            const blockHashBuf = block.computeHash();
            const blockHash = ethUtil.bufferToHex(blockHashBuf);
            if (blockHash in blocksByHash === false) {
                blocksByHash[blockHash] = block;
            }
        }
        console.log('*'.repeat(100), ' FINISHED OPTIMIZING ', '*'.repeat(100));
    }

    public toHexString(): string {
        if (this.root === undefined) {
            throw new Error('expected root');
        }

        if (this.rules.optimize) this.optimize();

        const offsetQueue = this.createQueue(this.root);
        let block: CalldataBlock | undefined;
        let offset = 0;
        while ((block = offsetQueue.pop()) !== undefined) {
            block.setOffset(offset);
            offset += block.getSizeInBytes();
        }

        const hexValue = this.rules.annotate ? this.generateAnnotatedHexString() : this.generateCondensedHexString();
        return hexValue;
    }

    public getSelectorHex(): string {
        return this.selector;
    }

    public getSizeInBytes(): number {
        return this.sizeInBytes;
    }

    public toAnnotatedString(): string {
        return "";
    }

    public setRoot(block: MemberCalldataBlock) {
        this.root = block;
        this.sizeInBytes += block.getSizeInBytes();
    }

    public setSelector(selector: string) {
        // Ensure we have a 0x prefix
        if (selector.startsWith('0x')) {
            this.selector = selector;
        } else {
            this.selector = `$0x${selector}`;
        }

        // The selector must be 10 characters: '0x' followed by 4 bytes (two hex chars per byte)
        if (this.selector.length !== 10) {
            throw new Error(`Invalid selector '${this.selector}'`);
        }
        this.sizeInBytes += 8;
    }
}

export class RawCalldata {
    private value: Buffer;
    private offset: number; // tracks current offset into raw calldata; used for parsing
    private selector: string;
    private scopes: Queue<number>;

    constructor(value: string | Buffer) {
        if (typeof value === 'string' && !value.startsWith('0x')) {
            throw new Error(`Expected raw calldata to start with '0x'`);
        }
        const valueBuf = ethUtil.toBuffer(value);
        this.selector = ethUtil.bufferToHex(valueBuf.slice(0, 4));
        this.value = valueBuf.slice(4); // disregard selector
        this.offset = 0;
        this.scopes = new Queue<number>();
        this.scopes.push(0);
    }

    public popBytes(lengthInBytes: number): Buffer {
        const value = this.value.slice(this.offset, this.offset + lengthInBytes);
        this.setOffset(this.offset + lengthInBytes);
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
        const value = this.value.slice(from, to);
        return value;
    }

    public setOffset(offsetInBytes: number) {
        this.offset = offsetInBytes;
        console.log('0'.repeat(100), this.offset);
    }

    public startScope() {
        this.scopes.pushFront(this.offset);
    }

    public endScope() {
        this.scopes.pop();
    }

    public getOffset(): number {
        return this.offset;
    }

    public toAbsoluteOffset(relativeOffset: number) {
        const scopeOffset = this.scopes.peek();
        if (scopeOffset === undefined) {
            throw new Error(`Tried to access undefined scope.`);
        }
        const absoluteOffset = relativeOffset + scopeOffset;
        return absoluteOffset;
    }

    public getSelector(): string {
        return this.selector;
    }
}