import { colors, utils as sharedUtils } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';

import { Footer } from 'ts/components/footer';
import { MetaTags } from 'ts/components/meta_tags';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Container } from 'ts/components/ui/container';
import { Benefits } from 'ts/pages/jobs/benefits';
import { Join0x } from 'ts/pages/jobs/join_0x';
import { Mission } from 'ts/pages/jobs/mission';
import { OpenPositions } from 'ts/pages/jobs/open_positions';
import { Dispatcher } from 'ts/redux/dispatcher';
import { ScreenWidths } from 'ts/types';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const OPEN_POSITIONS_HASH = 'positions';
const THROTTLE_TIMEOUT = 100;
const DOCUMENT_TITLE = 'Careers at 0x';
const DOCUMENT_DESCRIPTION = 'Join 0x in creating a tokenized world where all value can flow freely';

export interface JobsProps {
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
    screenWidth: ScreenWidths;
}

export interface JobsState {}

export class Jobs extends React.Component<JobsProps, JobsState> {
    // TODO: consolidate this small screen scaffolding into one place (its being used in portal and docs as well)
    private readonly _throttledScreenWidthUpdate: () => void;
    public constructor(props: JobsProps) {
        super(props);
        this._throttledScreenWidthUpdate = _.throttle(this._updateScreenWidth.bind(this), THROTTLE_TIMEOUT);
    }
    public componentDidMount(): void {
        window.addEventListener('resize', this._throttledScreenWidthUpdate);
        window.scrollTo(0, 0);
    }
    public render(): React.ReactNode {
        return (
            <Container overflowX="hidden">
                <MetaTags title={DOCUMENT_TITLE} description={DOCUMENT_DESCRIPTION} />
                <DocumentTitle title={DOCUMENT_TITLE} />
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    style={{ backgroundColor: colors.white, position: 'relative' }}
                    translate={this.props.translate}
                />
                <Join0x onCallToActionClick={this._onJoin0xCallToActionClick.bind(this)} />
                <Mission screenWidth={this.props.screenWidth} />
                <Benefits screenWidth={this.props.screenWidth} />
                <OpenPositions hash={OPEN_POSITIONS_HASH} screenWidth={this.props.screenWidth} />
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </Container>
        );
    }
    private _onJoin0xCallToActionClick(): void {
        sharedUtils.setUrlHash(OPEN_POSITIONS_HASH);
        sharedUtils.scrollToHash(OPEN_POSITIONS_HASH, '');
    }
    private _updateScreenWidth(): void {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
}
