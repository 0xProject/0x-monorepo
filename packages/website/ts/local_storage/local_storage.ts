import * as _ from 'lodash';

export const localStorage = {
    doesExist() {
        return !!window.localStorage;
    },
    getItemIfExists(key: string): string {
        if (!this.doesExist) {
            return undefined;
        }
        const item = window.localStorage.getItem(key);
        if (_.isNull(item) || item === 'undefined') {
            return '';
        }
        return item;
    },
    setItem(key: string, value: string) {
        if (!this.doesExist || _.isUndefined(value)) {
            return;
        }
        window.localStorage.setItem(key, value);
    },
    removeItem(key: string) {
        if (!this.doesExist) {
            return;
        }
        window.localStorage.removeItem(key);
    },
    getAllKeys(): string[] {
        if (!this.doesExist) {
            return [];
        }
        return _.keys(window.localStorage);
    },
};
