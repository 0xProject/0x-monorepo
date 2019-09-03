import * as _ from 'lodash';
import * as React from 'react';

import { DocumentTitle } from 'ts/components/document_title';
import { SiteWrap } from 'ts/components/siteWrap';
import { FullscreenMessage } from 'ts/pages/fullscreen_message';
import { Dispatcher } from 'ts/redux/dispatcher';
import { documentConstants } from 'ts/utils/document_meta_constants';
import { Translate } from 'ts/utils/translate';

export interface NotFoundProps {
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
}

export const NotFound: React.FC<NotFoundProps> = () => (
    <SiteWrap isFullScreen={true}>
        <DocumentTitle {...documentConstants.LANDING} />

        <FullscreenMessage
            headerText={'404'}
            bodyText={"Hm... looks like we couldn't find what you are looking for."}
        />
    </SiteWrap>
);
