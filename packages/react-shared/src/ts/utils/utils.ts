import * as _ from 'lodash';
import { scroller } from 'react-scroll';

import { constants } from './constants';

export const utils = {
    setUrlHash(anchorId: string) {
        window.location.hash = anchorId;
    },
    scrollToHash(hash: string, containerId: string): void {
        let finalHash = hash;
        if (_.isEmpty(hash)) {
            finalHash = constants.SCROLL_TOP_ID; // scroll to the top
        }

        scroller.scrollTo(finalHash, {
            duration: 0,
            offset: 0,
            containerId,
        });
    },
    getIdFromName(name: string) {
        const id = name.replace(/ /g, '-');
        return id;
    },
    getCurrentBaseUrl() {
        const port = window.location.port;
        const hasPort = !_.isUndefined(port);
        const baseUrl = `https://${window.location.hostname}${hasPort ? `:${port}` : ''}`;
        return baseUrl;
    },
};
