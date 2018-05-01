import { colors } from '@0xproject/react-shared';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';

import { Footer } from 'ts/components/footer';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Benefits } from 'ts/pages/jobs/benefits';
import { Join0x } from 'ts/pages/jobs/join_0x';
import { Mission } from 'ts/pages/jobs/mission';
import { OpenPositions } from 'ts/pages/jobs/open_positions';
import { PhotoRail } from 'ts/pages/jobs/photo_rail';
import { Teams } from 'ts/pages/jobs/teams';
import { Values } from 'ts/pages/jobs/values';
import { Dispatcher } from 'ts/redux/dispatcher';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

export interface JobsProps {
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
}

export const Jobs: React.StatelessComponent<JobsProps> = props => {
    return (
        <div>
            <DocumentTitle title="Jobs" />
            <TopBar
                blockchainIsLoaded={false}
                location={props.location}
                style={{ backgroundColor: colors.white, position: 'relative' }}
                translate={props.translate}
            />
            <Join0x />
            <Mission />
            <PhotoRail />
            <Values />
            <Benefits />
            <Teams />
            <OpenPositions />
            <Footer translate={props.translate} dispatcher={props.dispatcher} />
        </div>
    );
};
