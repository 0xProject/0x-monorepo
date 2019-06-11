/* Deletes deeply nested properties from an object. MUTATES the object
 * @param obj the object to be operated on
 * @param propPath the full dot-separated path to the property to delete, e.g. 'animals.mammals.dog.name'
 * returns void
 */
export const deleteNestedProperty = (obj: any, propPath: string): void => {
    if (!obj || !propPath) {
        return;
    }

    const propPathParts = propPath.split('.');

    let _obj = obj;
    for (let i = 0; i < propPathParts.length - 1; i++) {
        _obj = _obj[propPathParts[i]];

        if (typeof _obj === 'undefined') {
            return;
        }
    }

    while (propPathParts.length > 0) {
        delete _obj[propPathParts.pop() as string];
    }
};
