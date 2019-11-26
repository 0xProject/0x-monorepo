import * as _ from 'lodash';

/**
 * _.zip() that clips to the shortest array.
 */
export function shortZip<T1, T2>(a: T1[], b: T2[]): Array<[T1, T2]> {
    const minLength = Math.min(a.length, b.length);
    return _.zip(a.slice(0, minLength), b.slice(0, minLength)) as Array<[T1, T2]>;
}

/**
 * Replaces the keys in a deeply nested object. Adapted from https://stackoverflow.com/a/39126851
 */
export function replaceKeysDeep(obj: {}, mapKeys: (key: string) => string | void): _.Dictionary<{}> {
    return _.transform(obj, (result, value, key) => {
        const currentKey = mapKeys(key) || key;
        result[currentKey] = _.isObject(value) ? replaceKeysDeep(value, mapKeys) : value;
    });
}
