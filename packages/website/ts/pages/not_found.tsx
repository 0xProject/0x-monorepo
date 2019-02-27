import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';

import { SiteWrap } from 'ts/components/siteWrap';
import { FullscreenMessage } from 'ts/pages/fullscreen_message';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Translate } from 'ts/utils/translate';

export interface NotFoundProps {
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
}

export class NotFound extends React.Component<NotFoundProps> {
    public render(): React.ReactNode {
        return (
            <SiteWrap isFullScreen={true}>
                <DocumentTitle title="404 Page Not Found" />

                <FullscreenMessage
                    headerText={'404'}
                    bodyText={"Hm... looks like we couldn't find what you are looking for."}
                />
            </SiteWrap>
        );
    }
}
