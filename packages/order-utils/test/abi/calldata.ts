import ethUtil = require('ethereumjs-util');
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

    constructor(name: string, signature: string, /*offsetInBytes: number,*/ relocatable: boolean, parent: CalldataBlock, dependency: CalldataBlock) {
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
        const pointer = dependencyOffset - parentOffset + parentHeaderSize;
        const pointerBuf = new Buffer(`0x${pointer.toString(16)}`);
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

    constructor(name: string, signature: string, /*offsetInBytes: number,*/ relocatable: boolean) {
        super(name, signature, /*offsetInBytes,*/ 0, 0, relocatable);
        this.members = [];
        this.header = undefined;
    }

    public setMembers(members: CalldataBlock[]) {
        let bodySizeInBytes = 0;
        _.each(members, (member: CalldataBlock) => {
            bodySizeInBytes += member.getSizeInBytes();
        });
        this.members = members;
        this.setBodySize(bodySizeInBytes);
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
    pop(): T | undefined {
        return this.store.shift();
    }
}

export class Calldata {
    private selector: string;
    private sizeInBytes: number;
    private root: CalldataBlock | undefined;

    constructor() {
        this.selector = '0x';
        this.sizeInBytes = 0;
        this.root = undefined;
    }

    public toHexString(): string {
        let selectorBuffer = ethUtil.toBuffer(this.selector);
        if (this.root === undefined) {
            throw new Error('expected root');
        }

        const blockQueue = new Queue<CalldataBlock>();
        blockQueue.push(this.root);

        // Assign locations in breadth-first manner
        let block: CalldataBlock | undefined;
        let offset = 0;
        while ((block = blockQueue.pop()) !== undefined) {
            block.setOffset(offset);
            if (block instanceof DependentCalldataBlock) {
                blockQueue.push(block.getDependency());
            } else if (block instanceof MemberCalldataBlock) {
                _.each(block.getMembers(), (member: CalldataBlock) => {
                    blockQueue.push(member);
                });
            }
        }

        // Fetch values using same technique
        const valueBufs: Buffer[] = [selectorBuffer];
        while ((block = blockQueue.pop()) !== undefined) {
            valueBufs.push(block.toBuffer());

            if (block instanceof DependentCalldataBlock) {
                blockQueue.push(block.getDependency());
            } else if (block instanceof MemberCalldataBlock) {
                _.each(block.getMembers(), (member: CalldataBlock) => {
                    blockQueue.push(member);
                });
            }
        }

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

    public setRoot(block: CalldataBlock) {
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