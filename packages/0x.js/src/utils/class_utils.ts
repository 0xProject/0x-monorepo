import * as _ from 'lodash';

export const classUtils = {
    // This is usefull for classes that have nested methods. Nested methods don't get binded out of the box.
    bindAll(self: any, exclude: string[] = ['contructor'], thisArg?: any): void {
        for (const key of Object.getOwnPropertyNames(self)) {
            const val = self[key];
            if (!_.includes(exclude, key)) {
                if (_.isFunction(val)) {
                    self[key] = val.bind(thisArg || self);
                } else if (_.isObject(val)) {
                    classUtils.bindAll(val, exclude, self);
                }
            }
        }
        return self;
    },
};
