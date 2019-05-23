import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { constants } from '../utils/constants';
import { EncodingRules } from '../utils/rules';

import { PointerCalldataBlock } from './blocks/pointer';
import { SetCalldataBlock } from './blocks/set';
import { CalldataBlock } from './calldata_block';
import { CalldataIterator, ReverseCalldataIterator } from './iterator';

export class Calldata {
    private readonly _rules: EncodingRules;
    private _selector: string;
    private _root: CalldataBlock | undefined;

    public constructor(rules: EncodingRules) {
        this._rules = rules;
        this._selector = '';
        this._root = undefined;
    }
    /**
     * Sets the root calldata block. This block usually corresponds to a Method.
     */
    public setRoot(block: CalldataBlock): void {
        this._root = block;
    }
    /**
     * Sets the selector to be prepended onto the calldata.
     * If the root block was created by a Method then a selector will likely be set.
     */
    public setSelector(selector: string): void {
        if (!_.startsWith(selector, '0x')) {
            throw new Error(`Expected selector to be hex. Missing prefix '0x'`);
        } else if (selector.length !== constants.HEX_SELECTOR_LENGTH_IN_CHARS) {
            throw new Error(`Invalid selector '${selector}'`);
        }
        this._selector = selector;
    }
    /**
     * Iterates through the calldata blocks, starting from the root block, to construct calldata as a hex string.
     * If the `optimize` flag is set then this calldata will be condensed, to save gas.
     * If the `annotate` flag is set then this will return human-readable calldata.
     * If the `annotate` flag is *not* set then this will return EVM-compatible calldata.
     */
    public toString(): string {
        // Sanity check: root block must be set
        if (this._root === undefined) {
            throw new Error('expected root');
        }
        // Optimize, if flag set
        if (this._rules.shouldOptimize) {
            this._optimize();
        }
        // Set offsets
        const iterator = new CalldataIterator(this._root);
        let offset = 0;
        for (const block of iterator) {
            block.setOffset(offset);
            offset += block.getSizeInBytes();
        }
        // Generate hex string
        const hexString = this._rules.shouldAnnotate
            ? this._toHumanReadableCallData()
            : this._toEvmCompatibeCallDataHex();
        return hexString;
    }
    /**
     * There are three types of calldata blocks: Blob, Set and Pointer.
     * Scenarios arise where distinct pointers resolve to identical values.
     * We optimize by keeping only one such instance of the identical value, and redirecting all pointers here.
     * We keep the last such duplicate value because pointers can only be positive (they cannot point backwards).
     *
     * Example #1:
     *  function f(string[], string[])
     *  f(["foo", "bar", "blitz"], ["foo", "bar", "blitz"])
     *  The array ["foo", "bar", "blitz"] will only be included in the calldata once.
     *
     * Example #2:
     *  function f(string[], string)
     *  f(["foo", "bar", "blitz"], "foo")
     *  The string "foo" will only be included in the calldata once.
     *
     * Example #3:
     *  function f((string, uint, bytes), string, uint, bytes)
     *  f(("foo", 5, "0x05"), "foo", 5, "0x05")
     *  The string "foo" and bytes "0x05" will only be included in the calldata once.
     *  The duplicate `uint 5` values cannot be optimized out because they are static values (no pointer points to them).
     *
     * @TODO #1:
     *   This optimization strategy handles blocks that are exact duplicates of one another.
     *   But what if some block is a combination of two other blocks? Or a subset of another block?
     *   This optimization problem is not much different from the current implemetation.
     *   Instead of tracking "observed" hashes, at each node we would simply do pattern-matching on the calldata.
     *   This strategy would be applied after assigning offsets to the tree, rather than before (as in this strategy).
     *   Note that one consequence of this strategy is pointers may resolve to offsets that are not word-aligned.
     *   This shouldn't be a problem but further investigation should be done.
     *
     * @TODO #2:
     *   To be done as a follow-up to @TODO #1.
     *   Since we optimize from the bottom-up, we could be affecting the outcome of a later potential optimization.
     *   For example, what if by removing one duplicate value we miss out on optimizing another block higher in the tree.
     *   To handle this case, at each node we can store a candidate optimization in a priority queue (sorted by calldata size).
     *   At the end of traversing the tree, the candidate at the front of the queue will be the most optimal output.
     *
     */
    private _optimize(): void {
        // Step 1/1 Create a reverse iterator (starts from the end of the calldata to the beginning)
        if (this._root === undefined) {
            throw new Error('expected root');
        }
        const iterator = new ReverseCalldataIterator(this._root);
        // Step 2/2 Iterate over each block, keeping track of which blocks have been seen and pruning redundant blocks.
        const blocksByHash: { [key: string]: CalldataBlock } = {};
        for (const block of iterator) {
            // If a block is a pointer and its value has already been observed, then update
            // the pointer to resolve to the existing value.
            if (block instanceof PointerCalldataBlock) {
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
            // This block has not been seen. Record its hash.
            const blockHashBuf = block.computeHash();
            const blockHash = ethUtil.bufferToHex(blockHashBuf);
            if (!(blockHash in blocksByHash)) {
                blocksByHash[blockHash] = block;
            }
        }
    }
    private _toEvmCompatibeCallDataHex(): string {
        // Sanity check: must have a root block.
        if (this._root === undefined) {
            throw new Error('expected root');
        }
        // Construct an array of buffers (one buffer for each block).
        const selectorBuffer = ethUtil.toBuffer(this._selector);
        const valueBufs: Buffer[] = [selectorBuffer];
        const iterator = new CalldataIterator(this._root);
        for (const block of iterator) {
            valueBufs.push(block.toBuffer());
        }
        // Create hex from buffer array.
        const combinedBuffers = Buffer.concat(valueBufs);
        const hexValue = ethUtil.bufferToHex(combinedBuffers);
        return hexValue;
    }
    /**
     * Returns human-readable calldata.
     *
     * Example:
     *   simpleFunction(string[], string[])
     *   strings = ["Hello", "World"]
     *   simpleFunction(strings, strings)
     *
     * Output:
     *   0xbb4f12e3
     *                                                                                      ### simpleFunction
     *   0x0       0000000000000000000000000000000000000000000000000000000000000040              ptr<array1> (alias for array2)
     *   0x20      0000000000000000000000000000000000000000000000000000000000000040              ptr<array2>
     *
     *   0x40      0000000000000000000000000000000000000000000000000000000000000002          ### array2
     *   0x60      0000000000000000000000000000000000000000000000000000000000000040              ptr<array2[0]>
     *   0x80      0000000000000000000000000000000000000000000000000000000000000080              ptr<array2[1]>
     *   0xa0      0000000000000000000000000000000000000000000000000000000000000005              array2[0]
     *   0xc0      48656c6c6f000000000000000000000000000000000000000000000000000000
     *   0xe0      0000000000000000000000000000000000000000000000000000000000000005              array2[1]
     *   0x100     576f726c64000000000000000000000000000000000000000000000000000000
     */
    private _toHumanReadableCallData(): string {
        // Sanity check: must have a root block.
        if (this._root === undefined) {
            throw new Error('expected root');
        }
        // Constants for constructing annotated string
        const offsetPadding = 10;
        const valuePadding = 74;
        const namePadding = 80;
        const evmWordStartIndex = 0;
        const emptySize = 0;
        // Construct annotated calldata
        let hexValue = `${this._selector}`;
        let offset = 0;
        const functionName: string = this._root.getName();
        const iterator = new CalldataIterator(this._root);
        for (const block of iterator) {
            // Process each block 1 word at a time
            const size = block.getSizeInBytes();
            const name = block.getName();
            const parentName = block.getParentName();
            const prettyName = name.replace(`${parentName}.`, '').replace(`${functionName}.`, '');
            // Resulting line will be <offsetStr><valueStr><nameStr>
            let offsetStr = '';
            let valueStr = '';
            let nameStr = '';
            let lineStr = '';
            if (size === emptySize) {
                // This is a Set block with no header.
                // For example, a tuple or an array with a defined length.
                offsetStr = ' '.repeat(offsetPadding);
                valueStr = ' '.repeat(valuePadding);
                nameStr = `### ${prettyName.padEnd(namePadding)}`;
                lineStr = `\n${offsetStr}${valueStr}${nameStr}`;
            } else {
                // This block has at least one word of value.
                offsetStr = `0x${offset.toString(constants.HEX_BASE)}`.padEnd(offsetPadding);
                valueStr = ethUtil
                    .stripHexPrefix(
                        ethUtil.bufferToHex(
                            block.toBuffer().slice(evmWordStartIndex, constants.EVM_WORD_WIDTH_IN_BYTES),
                        ),
                    )
                    .padEnd(valuePadding);
                if (block instanceof SetCalldataBlock) {
                    nameStr = `### ${prettyName.padEnd(namePadding)}`;
                    lineStr = `\n${offsetStr}${valueStr}${nameStr}`;
                } else {
                    nameStr = `    ${prettyName.padEnd(namePadding)}`;
                    lineStr = `${offsetStr}${valueStr}${nameStr}`;
                }
            }
            // This block has a value that is more than 1 word.
            for (let j = constants.EVM_WORD_WIDTH_IN_BYTES; j < size; j += constants.EVM_WORD_WIDTH_IN_BYTES) {
                offsetStr = `0x${(offset + j).toString(constants.HEX_BASE)}`.padEnd(offsetPadding);
                valueStr = ethUtil
                    .stripHexPrefix(
                        ethUtil.bufferToHex(block.toBuffer().slice(j, j + constants.EVM_WORD_WIDTH_IN_BYTES)),
                    )
                    .padEnd(valuePadding);
                nameStr = ' '.repeat(namePadding);
                lineStr = `${lineStr}\n${offsetStr}${valueStr}${nameStr}`;
            }
            // Append to hex value
            hexValue = `${hexValue}\n${lineStr}`;
            offset += size;
        }
        return hexValue;
    }
}
