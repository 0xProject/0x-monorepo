import * as _ from 'lodash';

/**
 * _.zip() that clips to the shortest array.
 */
export function shortZip<T1, T2>(a: T1[], b: T2[]): Array<[T1, T2]> {
    const minLength = Math.min(a.length, b.length);
    return _.zip(a.slice(0, minLength), b.slice(0, minLength)) as Array<[T1, T2]>;
}
