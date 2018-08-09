import * as _ from 'lodash';

export const localStorage = {
    doesExist(): boolean {
        return !!window.localStorage;
    },
    getItemIfExists(key: string): string {
        if (!localStorage.doesExist) {
            return undefined;
        }
        const item = window.localStorage.getItem(key);
        if (_.isNull(item) || item === 'undefined') {
            return '';
        }
        return item;
    },
    setItem(key: string, value: string): void {
        if (!localStorage.doesExist || _.isUndefined(value)) {
            return;
        }
        window.localStorage.setItem(key, value);
    },
    removeItem(key: string): void {
        if (!localStorage.doesExist) {
            return;
        }
        window.localStorage.removeItem(key);
    },
    getObject(key: string): object | undefined {
        const item = localStorage.getItemIfExists(key);
        if (item) {
            return JSON.parse(item);
        }
        return undefined;
    },
    setObject(key: string, value: object): void {
        localStorage.setItem(key, JSON.stringify(value));
    },
    getAllKeys(): string[] {
        if (!localStorage.doesExist) {
            return [];
        }
        return _.keys(window.localStorage);
    },
};
