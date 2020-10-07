const IS_LOCAL_PUBLISH = process.env.IS_LOCAL_PUBLISH === 'true';
const DIST_TAG = process.env.DIST_TAG || '';
const LOCAL_NPM_REGISTRY_URL = 'http://localhost:4873';
const REMOTE_NPM_REGISTRY_URL = 'https://registry.npmjs.org/';

export const configs = {
    IS_LOCAL_PUBLISH,
    DIST_TAG,
    NPM_REGISTRY_URL: IS_LOCAL_PUBLISH ? LOCAL_NPM_REGISTRY_URL : REMOTE_NPM_REGISTRY_URL,
    DOCKER_HUB_ORG: '0xorg',
};
