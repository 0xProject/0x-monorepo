import { colors, utils as sharedUtils } from '@0xproject/react-shared';
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

export interface JobsState {}

const OPEN_POSITIONS_HASH = 'positions';

export class Jobs extends React.Component<JobsProps, JobsState> {
    public componentDidMount(): void {
        window.scrollTo(0, 0);
    }
    public render(): React.ReactNode {
        return (
            <div>
                <DocumentTitle title="Jobs" />
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    style={{ backgroundColor: colors.white, position: 'relative' }}
                    translate={this.props.translate}
                />
                <Join0x onCallToActionClick={this._onJoin0xCallToActionClick.bind(this)} />
                <Mission />
                <PhotoRail />
                <Values />
                <Benefits />
                <Teams />
                <OpenPositions hash={OPEN_POSITIONS_HASH} />
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </div>
        );
    }
    private _onJoin0xCallToActionClick(): void {
        sharedUtils.setUrlHash(OPEN_POSITIONS_HASH);
    }
}
