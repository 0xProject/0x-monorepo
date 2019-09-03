import * as React from 'react';

import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';
import { FullscreenMessage } from 'ts/pages/fullscreen_message';

export const PageNotFound: React.FC = () => (
    <DocsPageLayout title="404">
        <FullscreenMessage
            headerText={'Not found'}
            headerTextColor={'#000'}
            bodyText={"Hm... looks like we couldn't find what you are looking for."}
        />
    </DocsPageLayout>
);
