import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import * as Constants from '../utils/constants';
import { Queue } from '../utils/queue';
import { EncodingRules } from '../utils/rules';

import { CalldataBlock } from './calldata_block';
import * as CalldataBlocks from './calldata_blocks';

export class Calldata {
    private readonly _rules: EncodingRules;
    private _selector: string;
    private _sizeInBytes: number;
    private _root: CalldataBlock | undefined;

    private static _createQueue(block: CalldataBlock): Queue<CalldataBlock> {
        const blockQueue = new Queue<CalldataBlock>();

        // Base Case
        if (!(block instanceof CalldataBlocks.MemberCalldataBlock)) {
            blockQueue.push(block);
            return blockQueue;
        }

        // This is a Member Block
        const memberBlock = block;
        _.eachRight(memberBlock.getMembers(), (member: CalldataBlock) => {
            if (member instanceof CalldataBlocks.MemberCalldataBlock) {
                blockQueue.mergeFront(Calldata._createQueue(member));
            } else {
                blockQueue.pushFront(member);
            }
        });

        // Children
        _.each(memberBlock.getMembers(), (member: CalldataBlock) => {
            if (member instanceof CalldataBlocks.DependentCalldataBlock && member.getAlias() === undefined) {
                const dependency = member.getDependency();
                if (dependency instanceof CalldataBlocks.MemberCalldataBlock) {
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
            if (block instanceof CalldataBlocks.DependentCalldataBlock) {
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
                value = ethUtil
                    .stripHexPrefix(
                        ethUtil.bufferToHex(
                            block.toBuffer().slice(evmWordStartIndex, Constants.EVM_WORD_WIDTH_IN_BYTES),
                        ),
                    )
                    .padEnd(valuePadding);
                if (block instanceof CalldataBlocks.MemberCalldataBlock) {
                    nameStr = `### ${prettyName.padEnd(namePadding)}`;
                    line = `\n${offsetStr}${value}${nameStr}`;
                } else {
                    nameStr = `    ${prettyName.padEnd(namePadding)}`;
                    line = `${offsetStr}${value}${nameStr}`;
                }
            }

            for (let j = Constants.EVM_WORD_WIDTH_IN_BYTES; j < size; j += Constants.EVM_WORD_WIDTH_IN_BYTES) {
                offsetStr = `0x${(offset + j).toString(Constants.HEX_BASE)}`.padEnd(offsetPadding);
                value = ethUtil
                    .stripHexPrefix(
                        ethUtil.bufferToHex(block.toBuffer().slice(j, j + Constants.EVM_WORD_WIDTH_IN_BYTES)),
                    )
                    .padEnd(valuePadding);
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
