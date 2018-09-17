import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import { DocsContentTopBar } from 'ts/components/documentation/docs_content_top_bar';
import { DocsLogo } from 'ts/components/documentation/docs_logo';
import { Container } from 'ts/components/ui/container';
import { Dispatcher } from 'ts/redux/dispatcher';
import { ScreenWidths } from 'ts/types';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const THROTTLE_TIMEOUT = 100;

export interface HomeProps {
    location: Location;
    translate: Translate;
    screenWidth: ScreenWidths;
    dispatcher: Dispatcher;
}

export interface HomeState {}

export class Home extends React.Component<HomeProps, HomeState> {
    private readonly _throttledScreenWidthUpdate: () => void;
    constructor(props: HomeProps) {
        super(props);
        this._throttledScreenWidthUpdate = _.throttle(this._updateScreenWidth.bind(this), THROTTLE_TIMEOUT);
    }
    public componentDidMount(): void {
        window.addEventListener('resize', this._throttledScreenWidthUpdate);
        window.scrollTo(0, 0);
    }
    public componentWillUnmount(): void {
        window.removeEventListener('resize', this._throttledScreenWidthUpdate);
    }
    public render(): React.ReactNode {
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
        const mainContentPadding = isSmallScreen ? 0 : 50;
        return (
            <Container
                className="flex items-center"
                width="100%"
                background={`linear-gradient(to right, ${colors.grey100} 0%, ${colors.grey100} 50%, ${
                    colors.white
                } 50%, ${colors.white} 100%)`}
            >
                <DocumentTitle title="0x Docs Home" />
                <div className="flex mx-auto">
                    <Container
                        className="sm-hide xs-hide"
                        width={234}
                        paddingLeft={22}
                        paddingRight={22}
                        paddingTop={2}
                        backgroundColor={colors.grey100}
                        height="100vh"
                    >
                        <DocsLogo height={36} containerStyle={{ paddingTop: 28 }} />
                    </Container>
                    <Container
                        width={isSmallScreen ? '100vw' : 716}
                        paddingLeft={mainContentPadding}
                        paddingRight={mainContentPadding}
                        backgroundColor={colors.white}
                        height="100vh"
                    >
                        <DocsContentTopBar location={this.props.location} translate={this.props.translate} />
                        <div>
                            <h1 style={{ color: '#333333', fontSize: 30 }}>Start building on 0x</h1>
                        </div>
                    </Container>
                </div>
            </Container>
        );
    }
    private _updateScreenWidth(): void {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
}
