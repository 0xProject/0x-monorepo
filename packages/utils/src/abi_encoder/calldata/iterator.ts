/* tslint:disable max-classes-per-file */
import * as _ from 'lodash';

import { Queue } from '../utils/queue';

import * as CalldataBlocks from './blocks';
import { CalldataBlock } from './calldata_block';

/**
 * Iterator class for Calldata Blocks. Blocks follows the order
 * they should be put into calldata that is passed to he EVM.
 *
 * Example #1:
 * Let root = Set {
 *                  Blob{} A,
 *                  Pointer {
 *                      Blob{} a
 *                  } B,
 *                  Blob{} C
 *            }
 * It will iterate as follows: [A, B, C, B.a]
 *
 * Example #2:
 * Let root = Set {
 *                  Blob{} A,
 *                  Pointer {
 *                      Blob{} a
 *                      Pointer {
 *                          Blob{} b
 *                      }
 *                  } B,
 *                  Pointer {
 *                      Blob{} c
 *                  } C
 *            }
 * It will iterate as follows: [A, B, C, B.a, B.b, C.c]
 */
abstract class BaseIterator {
    protected readonly _root: CalldataBlock;
    protected readonly _queue: Queue<CalldataBlock>;

    private static _createQueue(block: CalldataBlock): Queue<CalldataBlock> {
        const queue = new Queue<CalldataBlock>();
        // Base case
        if (!(block instanceof CalldataBlocks.Set)) {
            queue.pushBack(block);
            return queue;
        }
        // This is a set; add members
        const set = block;
        _.eachRight(set.getMembers(), (member: CalldataBlock) => {
            queue.mergeFront(BaseIterator._createQueue(member));
        });
        // Add children
        _.each(set.getMembers(), (member: CalldataBlock) => {
            // Traverse child if it is a unique pointer.
            // A pointer that is an alias for another pointer is ignored.
            if (member instanceof CalldataBlocks.Pointer && member.getAlias() === undefined) {
                const dependency = member.getDependency();
                queue.mergeBack(BaseIterator._createQueue(dependency));
            }
        });
        // Put set block at the front of the queue
        queue.pushFront(set);
        return queue;
    }

    public constructor(root: CalldataBlock) {
        this._root = root;
        this._queue = BaseIterator._createQueue(root);
    }

    public abstract next(): CalldataBlock | undefined;
}

export class CalldataIterator extends BaseIterator {
    public constructor(root: CalldataBlock) {
        super(root);
    }

    public next(): CalldataBlock | undefined {
        return this._queue.popFront();
    }
}

export class ReverseCalldataIterator extends BaseIterator {
    public constructor(root: CalldataBlock) {
        super(root);
    }

    public next(): CalldataBlock | undefined {
        return this._queue.popBack();
    }
}
