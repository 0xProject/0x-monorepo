import * as bowser from 'bowser';

import { Browser, OperatingSystem } from '../types';

export const envUtil = {
    getBrowser(): Browser {
        if (bowser.chrome) {
            return Browser.Chrome;
        } else if (bowser.firefox) {
            return Browser.Firefox;
        } else if (bowser.opera) {
            return Browser.Opera;
        } else if (bowser.msedge) {
            return Browser.Edge;
        } else if (bowser.safari) {
            return Browser.Safari;
        } else {
            return Browser.Other;
        }
    },
    isMobileOperatingSystem(): boolean {
        return true;
    },
    getOperatingSystem(): OperatingSystem {
        return OperatingSystem.iOS;
        // if (bowser.android) {
        //     return OperatingSystem.Android;
        // } else if (bowser.ios) {
        //     return OperatingSystem.iOS;
        // } else if (bowser.mac) {
        //     return OperatingSystem.Mac;
        // } else if (bowser.windows) {
        //     return OperatingSystem.Windows;
        // } else if (bowser.windowsphone) {
        //     return OperatingSystem.WindowsPhone;
        // } else if (bowser.linux) {
        //     return OperatingSystem.Linux;
        // } else {
        //     return OperatingSystem.Other;
        // }
    },
};
