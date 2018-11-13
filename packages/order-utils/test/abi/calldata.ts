import ethUtil = require('ethereumjs-util');
import CommunicationChatBubbleOutline from 'material-ui/SvgIcon';
var _ = require('lodash');

export abstract class CalldataBlock {
    private name: string;
    private signature: string;
    private offsetInBytes: number;
    private headerSizeInBytes: number;
    private bodySizeInBytes: number;
    private relocatable: boolean;

    constructor(name: string, signature: string, /*offsetInBytes: number,*/ headerSizeInBytes: number, bodySizeInBytes: number, relocatable: boolean) {
        this.name = name;
        this.signature = signature;
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

    public getName(): string {
        return this.name;
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

    public abstract toBuffer(): Buffer;
}

export class PayloadCalldataBlock extends CalldataBlock {
    private payload: Buffer;

    constructor(name: string, signature: string, /*offsetInBytes: number,*/ relocatable: boolean, payload: Buffer) {
        const headerSizeInBytes = 0;
        const bodySizeInBytes = payload.byteLength;
        super(name, signature, /*offsetInBytes,*/ headerSizeInBytes, bodySizeInBytes, relocatable);
        this.payload = payload;
    }

    public toBuffer(): Buffer {
        return this.payload;
    }
}

export class DependentCalldataBlock extends CalldataBlock {
    public static DEPENDENT_PAYLOAD_SIZE_IN_BYTES = 32;
    private parent: CalldataBlock;
    private dependency: CalldataBlock;

    constructor(name: string, signature: string, /*offsetInBytes: number,*/ relocatable: boolean, dependency: CalldataBlock, parent: CalldataBlock) {
        const headerSizeInBytes = 0;
        const bodySizeInBytes = DependentCalldataBlock.DEPENDENT_PAYLOAD_SIZE_IN_BYTES;
        super(name, signature, /*offsetInBytes,*/ headerSizeInBytes, bodySizeInBytes, relocatable);
        this.parent = parent;
        this.dependency = dependency;
    }

    public toBuffer(): Buffer {
        const dependencyOffset = this.dependency.getOffsetInBytes();
        const parentOffset = this.parent.getOffsetInBytes();
        const parentHeaderSize = this.parent.getHeaderSizeInBytes();
        const pointer: number = dependencyOffset - (parentOffset + parentHeaderSize);
        const pointerBuf = ethUtil.toBuffer(`0x${pointer.toString(16)}`);
        const evmWordWidthInBytes = 32;
        const pointerBufPadded = ethUtil.setLengthLeft(pointerBuf, evmWordWidthInBytes);
        return pointerBufPadded;
    }

    public getDependency(): CalldataBlock {
        return this.dependency;
    }
}

export class MemberCalldataBlock extends CalldataBlock {
    private static DEPENDENT_PAYLOAD_SIZE_IN_BYTES = 32;
    private header: Buffer | undefined;
    private members: CalldataBlock[];
    private contiguous: boolean;

    constructor(name: string, signature: string, /*offsetInBytes: number,*/ relocatable: boolean, contiguous: boolean) {
        super(name, signature, /*offsetInBytes,*/ 0, 0, relocatable);
        this.members = [];
        this.header = undefined;
        this.contiguous = contiguous;
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
    private sizeInBytes: number;
    private root: MemberCalldataBlock | undefined;

    constructor() {
        this.selector = '0x';
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
            if (member instanceof DependentCalldataBlock) {
                const dependency = member.getDependency();
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

    /*

    // Basic optimize method that prunes duplicate branches of the tree
    // Notes:
    //      1. Pruning is at the calldata block level, so it is independent of type
    //      2. 
    private optimize(blocks: CalldataBlock[]) {
        // Build hash table of blocks
        const blockLookupTable: { [key: string]: string } = {};
        _.each(blocks, (block: CalldataBlock) => {
            if (blocks instanceof DependentCalldataBlock === false) {

                return;
            }

            const leavesHash = block.hashLeaves();
            if (leavesHash in blockLookupTable) {

            }
        })
    }*/

    public toHexString(optimize: boolean = false): string {
        let selectorBuffer = ethUtil.toBuffer(this.selector);
        if (this.root === undefined) {
            throw new Error('expected root');
        }

        const offsetQueue = this.createQueue(this.root);
        let block: CalldataBlock | undefined;
        let offset = 0;
        while ((block = offsetQueue.pop()) !== undefined) {
            block.setOffset(offset);
            offset += block.getSizeInBytes();
        }

        const valueQueue = this.createQueue(this.root);
        const valueBufs: Buffer[] = [selectorBuffer];
        while ((block = valueQueue.pop()) !== undefined) {
            valueBufs.push(block.toBuffer());
        }

        // if (optimize) this.optimize(valueQueue.getStore());

        const combinedBuffers = Buffer.concat(valueBufs);
        const hexValue = ethUtil.bufferToHex(combinedBuffers);
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