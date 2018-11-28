import { utils as sharedUtils } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';

import { Footer } from 'ts/components/footer';
import { MetaTags } from 'ts/components/meta_tags';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Container } from 'ts/components/ui/container';
import { Configurator } from 'ts/pages/instant/configurator';
import { Features } from 'ts/pages/instant/features';
import { Introducing0xInstant } from 'ts/pages/instant/introducing_0x_instant';
import { NeedMore } from 'ts/pages/instant/need_more';
import { Screenshots } from 'ts/pages/instant/screenshots';
import { Dispatcher } from 'ts/redux/dispatcher';
import { colors } from 'ts/style/colors';
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

const CONFIGURATOR_HASH = 'configure';
const THROTTLE_TIMEOUT = 100;
const DOCUMENT_TITLE = '0x Instant';
const DOCUMENT_DESCRIPTION = '0x Instant';

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
                    style={{ backgroundColor: colors.instantPrimaryBackground, position: 'relative' }}
                    translate={this.props.translate}
                    isNightVersion={true}
                />
                <Container backgroundColor={colors.instantPrimaryBackground} />
                <Introducing0xInstant screenWidth={this.props.screenWidth} onCTAClick={this._onHeaderCTAClick} />
                <Screenshots screenWidth={this.props.screenWidth} />
                <Features screenWidth={this.props.screenWidth} />
                {!this._isSmallScreen() && <Configurator hash={CONFIGURATOR_HASH} />}
                <NeedMore screenWidth={this.props.screenWidth} />
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </Container>
        );
    }
    private readonly _onHeaderCTAClick = () => {
        if (this._isSmallScreen()) {
            utils.openUrl(`${utils.getCurrentBaseUrl()}/wiki#About`);
        } else {
            this._scrollToConfigurator();
        }
    };
    private _isSmallScreen(): boolean {
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
        return isSmallScreen;
    }
    private _scrollToConfigurator(): void {
        sharedUtils.setUrlHash(CONFIGURATOR_HASH);
        sharedUtils.scrollToHash(CONFIGURATOR_HASH, '');
    }
    private _updateScreenWidth(): void {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
}
