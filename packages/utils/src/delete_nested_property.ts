// WARNING: mutates the object!
export function deleteNestedProperty(obj: any, propPath: string): void {
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
}
