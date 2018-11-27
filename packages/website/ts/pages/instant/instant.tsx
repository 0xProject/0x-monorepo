import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';

import { Footer } from 'ts/components/footer';
import { MetaTags } from 'ts/components/meta_tags';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Container } from 'ts/components/ui/container';
import { Dispatcher } from 'ts/redux/dispatcher';
import { ScreenWidths } from 'ts/types';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

export interface InstantProps {
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
    screenWidth: ScreenWidths;
}

export interface InstantState {}

const THROTTLE_TIMEOUT = 100;
const DOCUMENT_TITLE = 'Instant';
const DOCUMENT_DESCRIPTION = 'Instant';

export class Instant extends React.Component<InstantProps, InstantState> {
    // TODO: consolidate this small screen scaffolding into one place (its being used in portal and docs as well)
    private readonly _throttledScreenWidthUpdate: () => void;
    public constructor(props: InstantProps) {
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
                    style={{ position: 'relative' }}
                    translate={this.props.translate}
                />
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </Container>
        );
    }
    private _updateScreenWidth(): void {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
}
