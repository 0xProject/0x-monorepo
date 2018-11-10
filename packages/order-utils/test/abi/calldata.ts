import ethUtil = require('ethereumjs-util');
var _ = require('lodash');

export abstract class CalldataBlock {
    private name: string;
    private signature: string;
    private offsetInBytes: number;
    private headerSizeInBytes: number;
    private bodySizeInBytes: number;
    private relocatable: boolean;

    constructor(name: string, signature: string, offsetInBytes: number, headerSizeInBytes: number, bodySizeInBytes: number, relocatable: boolean) {
        this.name = name;
        this.signature = signature;
        this.offsetInBytes = offsetInBytes;
        this.headerSizeInBytes = headerSizeInBytes;
        this.bodySizeInBytes = bodySizeInBytes;
        this.relocatable = relocatable;
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

    public abstract toHexString(): string;
}

export class PayloadCalldataBlock extends CalldataBlock {
    private payload: Buffer;

    constructor(name: string, signature: string, offsetInBytes: number, relocatable: boolean, payload: Buffer) {
        const headerSizeInBytes = 0;
        const bodySizeInBytes = payload.byteLength;
        super(name, signature, offsetInBytes, headerSizeInBytes, bodySizeInBytes, relocatable);
        this.payload = payload;
    }

    public toHexString(): string {
        const payloadHex = ethUtil.bufferToHex(this.payload);
        return payloadHex;
    }
}

export class DependentCalldataBlock extends CalldataBlock {
    public static DEPENDENT_PAYLOAD_SIZE_IN_BYTES = 32;
    private parent: CalldataBlock;
    private dependency: CalldataBlock;

    constructor(name: string, signature: string, offsetInBytes: number, relocatable: boolean, parent: CalldataBlock, dependency: CalldataBlock) {
        const headerSizeInBytes = 0;
        const bodySizeInBytes = DependentCalldataBlock.DEPENDENT_PAYLOAD_SIZE_IN_BYTES;
        super(name, signature, offsetInBytes, headerSizeInBytes, bodySizeInBytes, relocatable);
        this.parent = parent;
        this.dependency = dependency;
    }

    public toHexString(): string {
        const dependencyOffset = this.dependency.getOffsetInBytes();
        const parentOffset = this.parent.getOffsetInBytes();
        const parentHeaderSize = this.parent.getHeaderSizeInBytes();
        const pointer = dependencyOffset - parentOffset + parentHeaderSize;
        const pointerBuf = new Buffer(`0x${pointer.toString(16)}`);
        const evmWordWidthInBytes = 32;
        const pointerBufPadded = ethUtil.setLengthLeft(pointerBuf, evmWordWidthInBytes);
        const pointerHex = ethUtil.bufferToHex(pointerBufPadded);
        return pointerHex;
    }
}

export class MemberCalldataBlock extends CalldataBlock {
    private static DEPENDENT_PAYLOAD_SIZE_IN_BYTES = 32;
    private header: Buffer | undefined;
    private members: CalldataBlock[];

    constructor(name: string, signature: string, offsetInBytes: number, relocatable: boolean, members: CalldataBlock[], header?: Buffer) {
        const headerSizeInBytes = (header === undefined) ? 0 : header.byteLength;
        let bodySizeInBytes = 0;
        _.each(members, (member: Memblock) => {
            bodySizeInBytes += member.getSizeInBytes();
        });

        super(name, signature, offsetInBytes, headerSizeInBytes, bodySizeInBytes, relocatable);
        this.members = members;
        this.header = header;
    }

    public toHexString(): string {
        let valueBuffers: Buffer[] = [];
        if (this.header !== undefined) valueBuffers.push(this.header);
        _.each(this.members, (member: CalldataBlock) => {
            const memberHexString = member.toHexString();
            const memberBuf = ethUtil.toBuffer(memberHexString);
            valueBuffers.push(memberBuf);
        });
        const combinedValueBufs = Buffer.concat(valueBuffers);
        const combinedValuesAsHex = ethUtil.bufferToHex(combinedValueBufs);
        return combinedValuesAsHex;
    }
}

export class Calldata {
    private selector: string;
    private sizeInBytes: number;
    private blocks: CalldataBlock[];

    constructor() {
        this.selector = '0x';
        this.sizeInBytes = 0;
        this.blocks = [];
    }

    public toHexString(): string {
        let calldataString = `${this.selector}`;
        _.each(this.blocks, (block: CalldataBlock) => {
            const blockAsHexString = block.toHexString();
            const blockAsHexWithoutPrefix = ethUtil.stripHexPrefix(blockAsHexString);
            calldataString += blockAsHexWithoutPrefix;
        });
        return calldataString;
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

    public pushBlock(block: CalldataBlock) {
        this.blocks.push(block);
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