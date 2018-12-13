import * as _ from 'lodash';

// Implements C3 Linearization as used in Solidity
// see: https://www.python.org/download/releases/2.3/mro/

/**
 * Produce an array such that each input array is a subarray of the result.
 * In other words, if the inputs specify lists sorted according to some partial
 * order produce a sorted list of all elements compatible.
 *
 * NOTE: merge(a.reverse(), b.reversed(), ...) = merge(a, b, ...).reversed()
 *       (or at least equal up to the implied partial order)
 *
 * @param ilists List of input lists.
 */
export function merge<T>(...ilists: T[][]): T[] {
    // Only consider non-empty lists
    const lists = ilists.filter(x => x.length > 0);
    if (lists.length === 0) {
        return [];
    }

    // The first item of each list are heads, the remainders are tails
    const heads = _.map(lists, ([head, ...tail]) => head);
    const tails = _.map(lists, ([head, ...tail]) => tail);

    // A good head is one that does not occur in any tail.
    const goodHead = heads.find(head => tails.every(tail => !tail.includes(head)));

    // If there is no  valid head the hierarchy can not be linearized.
    if (goodHead === undefined) {
        throw new Error('Hierarchy can not be linearized.');
    }

    // Remove the good head from the lists
    const newLists = _.map(lists, list => list.filter(elem => elem !== goodHead));

    // Prepend head to the linearization and repeat
    return [goodHead, ...merge(...newLists)];
}

/**
 * Given a final element and a parents function, compute the C3 linearization
 * of all ancestors of the final element.
 *
 * NOTE: Solidity has its ancestors in reverse order (base to most derived)
 *       compared to the Python C3 Linearization algorithm (most derived to
 *       base). This version uses the Solidity convention.
 *
 * NOTE: The nature of the algorithm makes it so that some cases where a
 *       linearization does exists, it is not found. The way merge picks
 *       an arbitrary solution adds additional constraints wich can lead
 *       to conflicts later on. It would be better if instead of recursion,
 *       a single large merge was done with all the constraints. But then
 *       it would no longer be C3 linearization.
 *
 * @param final The element to compute the linearization for.
 * @param parents A function mapping the ordered list of parents for a given element.
 */
export function linearize<T>(final: T, parents: (_: T) => T[]): T[] {
    // TODO(recmo): Memoization
    // TODO(recmo): Throw on cycles (instead of stack overflowing)
    const p = parents(final);
    const recurse = _.map(p, a => linearize<T>(a, parents));
    return [...merge(p, ...recurse), final];
}

/**
 * Asynchronous version of linearize. See linearize.
 */
export async function linearizeAsync<T>(final: T, parentsAsync: (_: T) => Promise<T[]>): Promise<T[]> {
    const p = await parentsAsync(final);
    const recurse = await Promise.all(_.map(p, async a => linearizeAsync<T>(a, parentsAsync)));
    return [...merge(p, ...recurse), final];
}
