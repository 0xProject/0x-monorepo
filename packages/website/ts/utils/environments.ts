import * as _ from 'lodash';

import { Environments } from '../types';

import { domains } from './domains';

export const environments = {
    isDevelopment(): boolean {
        return _.includes(domains.DOMAINS_DEVELOPMENT, window.location.host);
    },
    isStaging(): boolean {
        return _.includes(window.location.href, domains.DOMAIN_STAGING);
    },
    isDogfood(): boolean {
        return _.includes(window.location.href, domains.DOMAIN_DOGFOOD);
    },
    isProduction(): boolean {
        return _.includes(window.location.href, domains.DOMAIN_PRODUCTION);
    },
    getEnvironment(): Environments {
        if (environments.isDogfood()) {
            return Environments.Dogfood;
        }
        if (environments.isDevelopment()) {
            return Environments.Development;
        }
        if (environments.isStaging()) {
            return Environments.Staging;
        }
        if (environments.isProduction()) {
            return Environments.Production;
        }
        return Environments.Unknown;
    },
};
