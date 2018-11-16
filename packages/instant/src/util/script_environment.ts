import * as _ from 'lodash';

import { ENVIRONMENTS_TO_DOMAINS } from '../constants';
import { Environment } from '../types';

export type EnvironmentToDomain = { [key in Environment]: string[] };

export const scriptEnvironment = {
    // Attempts to figure out full URL of where this JS is being served from
    getFullScriptLocation: (): string | null => {
        const currentScript = document.currentScript;

        if (!currentScript) {
            return null;
        }

        const scriptSrc = currentScript.getAttribute('src');
        if (!scriptSrc) {
            return null;
        }

        try {
            const url = new URL(scriptSrc, window.location.href);
            return url.href;
        } catch {
            return null;
        }
    },
    urlToEnvironment: (url: string): Environment | undefined => {
        const allEnvironments = [
            Environment.Production,
            Environment.Staging,
            Environment.Dogfood,
            Environment.Development,
        ];
        for (const curEnvironment of allEnvironments) {
            const domains = ENVIRONMENTS_TO_DOMAINS[curEnvironment];
            if (_.some(domains, (domain: string) => url.includes(domain))) {
                return curEnvironment;
            }
        }
        return undefined;
    },
    getEnvironment: (defaltValue = Environment.Production): Environment => {
        const environmentFromLocation = scriptEnvironment.urlToEnvironment(window.location.href);
        if (environmentFromLocation) {
            return environmentFromLocation;
        }

        const scriptLocation = scriptEnvironment.getFullScriptLocation();
        if (scriptLocation) {
            const environmentFromScriptLocation = scriptEnvironment.urlToEnvironment(scriptLocation);
            if (environmentFromScriptLocation) {
                return environmentFromScriptLocation;
            }
        }

        return defaltValue;
    },
};
