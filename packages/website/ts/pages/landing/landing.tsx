import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import { Link } from 'react-router-dom';
import { Footer } from 'ts/components/footer';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Deco, Key, Language, ScreenWidths, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

interface BoxContent {
    title: string;
    description: string;
    imageUrl: string;
    classNames: string;
}
interface AssetType {
    title: string;
    imageUrl: string;
    style?: React.CSSProperties;
}
interface UseCase {
    imageUrl: string;
    type: string;
    description: string;
    classNames: string;
    style?: React.CSSProperties;
    projectIconUrls: string[];
}
interface Project {
    logoFileName: string;
    projectUrl: string;
}

const THROTTLE_TIMEOUT = 100;
const WHATS_NEW_TITLE = '18 ideas for 0x relayers in 2018';
const WHATS_NEW_URL = 'https://blog.0xproject.com/18-ideas-for-0x-relayers-in-2018-80a1498b955f';

const relayersAndDappProjects: Project[] = [
    {
        logoFileName: 'ercdex.png',
        projectUrl: constants.PROJECT_URL_ERC_DEX,
    },
    {
        logoFileName: 'radar_relay.png',
        projectUrl: constants.PROJECT_URL_RADAR_RELAY,
    },
    {
        logoFileName: 'paradex.png',
        projectUrl: constants.PROJECT_URL_PARADEX,
    },
    {
        logoFileName: 'the_ocean.png',
        projectUrl: constants.PROJECT_URL_0CEAN,
    },
    {
        logoFileName: 'dydx.png',
        projectUrl: constants.PROJECT_URL_DYDX,
    },
    {
        logoFileName: 'ethfinex.png',
        projectUrl: constants.PROJECT_URL_ETHFINEX,
    },
    {
        logoFileName: 'melonport.png',
        projectUrl: constants.PROJECT_URL_MELONPORT,
    },
    {
        logoFileName: 'maker.png',
        projectUrl: constants.PROJECT_URL_MAKER,
    },
    {
        logoFileName: 'dharma.png',
        projectUrl: constants.PROJECT_URL_DHARMA,
    },
    {
        logoFileName: 'lendroid.png',
        projectUrl: constants.PROJECT_URL_LENDROID,
    },
    {
        logoFileName: 'district0x.png',
        projectUrl: constants.PROJECT_URL_DISTRICT_0X,
    },
    {
        logoFileName: 'aragon.png',
        projectUrl: constants.PROJECT_URL_ARAGON,
    },
    {
        logoFileName: 'blocknet.png',
        projectUrl: constants.PROJECT_URL_BLOCKNET,
    },
    {
        logoFileName: 'imtoken.png',
        projectUrl: constants.PROJECT_URL_IMTOKEN,
    },
    {
        logoFileName: 'augur.png',
        projectUrl: constants.PROJECT_URL_AUGUR,
    },
    {
        logoFileName: 'anx.png',
        projectUrl: constants.PROJECT_URL_OPEN_ANX,
    },
];

const relayerProjects: Project[] = [
    {
        logoFileName: 'ethfinex.png',
        projectUrl: constants.PROJECT_URL_ETHFINEX,
    },
    {
        logoFileName: 'radar_relay.png',
        projectUrl: constants.PROJECT_URL_RADAR_RELAY,
    },
    {
        logoFileName: 'paradex.png',
        projectUrl: constants.PROJECT_URL_PARADEX,
    },
    {
        logoFileName: 'the_ocean.png',
        projectUrl: constants.PROJECT_URL_0CEAN,
    },
    {
        logoFileName: 'amadeus.png',
        projectUrl: constants.PROJECT_URL_AMADEUS,
    },
    {
        logoFileName: 'ddex.png',
        projectUrl: constants.PROJECT_URL_DDEX,
    },
    {
        logoFileName: 'decent_ex.png',
        projectUrl: constants.PROJECT_URL_DECENT_EX,
    },
    {
        logoFileName: 'dextroid.png',
        projectUrl: constants.PROJECT_URL_DEXTROID,
    },
    {
        logoFileName: 'ercdex.png',
        projectUrl: constants.PROJECT_URL_ERC_DEX,
    },
    {
        logoFileName: 'open_relay.png',
        projectUrl: constants.PROJECT_URL_OPEN_RELAY,
    },
    {
        logoFileName: 'idt.png',
        projectUrl: constants.PROJECT_URL_IDT,
    },
    {
        logoFileName: 'imtoken.png',
        projectUrl: constants.PROJECT_URL_IMTOKEN,
    },
];

export interface LandingProps {
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
}

interface LandingState {
    screenWidth: ScreenWidths;
}

export class Landing extends React.Component<LandingProps, LandingState> {
    private _throttledScreenWidthUpdate: () => void;
    constructor(props: LandingProps) {
        super(props);
        this.state = {
            screenWidth: utils.getScreenWidth(),
        };
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
        return (
            <div id="landing" className="clearfix" style={{ color: colors.grey500 }}>
                <DocumentTitle title="0x Protocol" />
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    isNightVersion={true}
                    style={{ backgroundColor: colors.heroGrey, position: 'relative' }}
                    translate={this.props.translate}
                />
                {this._renderHero()}
                {this._renderProjects(
                    relayersAndDappProjects,
                    this.props.translate.get(Key.ProjectsHeader, Deco.Upper),
                    colors.projectsGrey,
                    false,
                )}
                {this._renderTokenizationSection()}
                {this._renderProtocolSection()}
                {this._renderProjects(
                    relayerProjects,
                    this.props.translate.get(Key.RelayersHeader, Deco.Upper),
                    colors.heroGrey,
                    true,
                )}
                {this._renderInfoBoxes()}
                {this._renderBuildingBlocksSection()}
                {this._renderUseCases()}
                {this._renderCallToAction()}
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </div>
        );
    }
    private _renderHero(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const buttonLabelStyle: React.CSSProperties = {
            textTransform: 'none',
            fontSize: isSmallScreen ? 12 : 14,
            fontWeight: 400,
        };
        const lightButtonStyle: React.CSSProperties = {
            borderRadius: 6,
            border: '1px solid #D8D8D8',
            lineHeight: '33px',
            height: 38,
        };
        const left = 'col lg-col-7 md-col-7 col-12 lg-pl4 md-pl4 sm-pl0 sm-px3 sm-center';
        return (
            <div className="clearfix py4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="mx-auto max-width-4 clearfix">
                    {this._renderWhatsNew()}
                    <div className="lg-pt4 md-pt4 sm-pt2 lg-pb4 md-pb4 lg-my4 md-my4 sm-mt2 sm-mb4 clearfix">
                        <div className="col lg-col-5 md-col-5 col-12 sm-center">
                            <img src="/images/landing/hero_chip_image.png" height={isSmallScreen ? 300 : 395} />
                        </div>
                        <div className={left} style={{ color: colors.white, height: 390, lineHeight: '390px' }}>
                            <div
                                className="inline-block lg-align-middle md-align-middle sm-align-top"
                                style={{
                                    paddingLeft: isSmallScreen ? 0 : 12,
                                    lineHeight: '36px',
                                }}
                            >
                                <div
                                    className="sm-pb2"
                                    style={{
                                        fontFamily: 'Roboto Mono',
                                        fontSize: isSmallScreen ? 26 : 34,
                                    }}
                                >
                                    {this.props.translate.get(Key.TopHeader, Deco.Cap)}
                                </div>
                                <div
                                    className="pt2 h5 sm-mx-auto"
                                    style={{
                                        maxWidth: 446,
                                        fontFamily: 'Roboto Mono',
                                        lineHeight: 1.7,
                                        fontWeight: 300,
                                    }}
                                >
                                    {this.props.translate.get(Key.TopTagline)}
                                </div>
                                <div className="pt3 clearfix sm-mx-auto" style={{ maxWidth: 389 }}>
                                    <div className="lg-pr2 md-pr2 col col-6 sm-center">
                                        <Link to={WebsitePaths.ZeroExJs} className="text-decoration-none">
                                            <RaisedButton
                                                style={{ borderRadius: 6, minWidth: 157.36 }}
                                                buttonStyle={{ borderRadius: 6 }}
                                                labelStyle={buttonLabelStyle}
                                                label={this.props.translate.get(Key.BuildCallToAction, Deco.Cap)}
                                                onClick={_.noop}
                                            />
                                        </Link>
                                    </div>
                                    <div className="col col-6 sm-center">
                                        <a
                                            href={constants.URL_ZEROEX_CHAT}
                                            target="_blank"
                                            className="text-decoration-none"
                                        >
                                            <RaisedButton
                                                style={{ borderRadius: 6, minWidth: 150 }}
                                                buttonStyle={lightButtonStyle}
                                                labelColor="white"
                                                backgroundColor={colors.heroGrey}
                                                labelStyle={buttonLabelStyle}
                                                label={this.props.translate.get(Key.CommunityCallToAction, Deco.Cap)}
                                                onClick={_.noop}
                                            />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private _renderWhatsNew(): React.ReactNode {
        return (
            <div className="sm-center sm-px1">
                <a href={WHATS_NEW_URL} target="_blank" className="inline-block text-decoration-none">
                    <div className="flex sm-pl0 md-pl2 lg-pl0" style={{ fontFamily: 'Roboto Mono', fontWeight: 600 }}>
                        <div
                            className="mr1 px1"
                            style={{
                                backgroundColor: colors.lightTurquois,
                                borderRadius: 3,
                                color: colors.heroGrey,
                                height: 23,
                            }}
                        >
                            New
                        </div>
                        <div style={{ color: colors.darkGrey }}>{WHATS_NEW_TITLE}</div>
                    </div>
                </a>
            </div>
        );
    }
    private _renderProjects(
        projects: Project[],
        title: string,
        backgroundColor: string,
        isTitleCenter: boolean,
    ): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const projectList = _.map(projects, (project: Project, i: number) => {
            const isRelayersOnly = projects.length === 12;
            let colWidth: number;
            switch (this.state.screenWidth) {
                case ScreenWidths.Sm:
                    colWidth = 4;
                    break;

                case ScreenWidths.Md:
                    colWidth = 3;
                    break;

                case ScreenWidths.Lg:
                    colWidth = isRelayersOnly ? 2 : 2 - i % 2;
                    break;
            }
            return (
                <div key={`project-${project.logoFileName}`} className={`col col-${colWidth} center`}>
                    <div>
                        <a href={project.projectUrl} target="_blank" className="text-decoration-none">
                            <img
                                src={`/images/landing/project_logos/${project.logoFileName}`}
                                height={isSmallScreen ? 60 : 92}
                            />
                        </a>
                    </div>
                </div>
            );
        });
        const titleStyle: React.CSSProperties = {
            fontFamily: 'Roboto Mono',
            color: colors.grey,
            fontWeight: 300,
            letterSpacing: 3,
        };
        return (
            <div className={`clearfix py4 ${isTitleCenter && 'center'}`} style={{ backgroundColor }}>
                <div className="mx-auto max-width-4 clearfix sm-px3">
                    <div className="h4 pb3 lg-pl0 md-pl3 sm-pl2" style={titleStyle}>
                        {title}
                    </div>
                    <div className="clearfix">{projectList}</div>
                    <div
                        className="pt3 mx-auto center"
                        style={{
                            color: colors.landingLinkGrey,
                            fontFamily: 'Roboto Mono',
                            maxWidth: 300,
                            fontSize: 14,
                        }}
                    >
                        {this.props.translate.get(Key.FullListPrompt)}{' '}
                        <Link
                            to={`${WebsitePaths.Wiki}#List-of-Projects-Using-0x-Protocol`}
                            className="text-decoration-none underline"
                            style={{ color: colors.landingLinkGrey }}
                        >
                            {this.props.translate.get(Key.FullListLink)}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    private _renderTokenizationSection(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        return (
            <div className="clearfix lg-py4 md-py4 sm-pb4 sm-pt2" style={{ backgroundColor: colors.grey100 }}>
                <div className="mx-auto max-width-4 py4 clearfix">
                    {isSmallScreen && this._renderTokenCloud()}
                    <div
                        className="col lg-col-6 md-col-6 col-12 center"
                        style={{ color: colors.darkestGrey, height: 364, lineHeight: '364px' }}
                    >
                        <div
                            className="mx-auto inline-block lg-align-middle md-align-middle sm-align-top"
                            style={{ maxWidth: 385, lineHeight: '44px', textAlign: 'left' }}
                        >
                            <div className="lg-h1 md-h1 sm-h2 sm-center sm-pt3" style={{ fontFamily: 'Roboto Mono' }}>
                                {this.props.translate.get(Key.TokenizedSectionHeader, Deco.Cap)}
                            </div>
                            <div
                                className="pb2 lg-pt2 md-pt2 sm-pt3 sm-px3 h5 sm-center"
                                style={{ fontFamily: 'Roboto Mono', lineHeight: 1.7, maxWidth: 370 }}
                            >
                                {this.props.translate.get(Key.TokenizedSectionDescription, Deco.Cap)}
                            </div>
                            <div className="flex pt1 sm-px3">{this._renderAssetTypes()}</div>
                        </div>
                    </div>
                    {!isSmallScreen && this._renderTokenCloud()}
                </div>
            </div>
        );
    }
    private _renderProtocolSection(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        return (
            <div className="clearfix pt4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="mx-auto max-width-4 pt4 clearfix">
                    <div className="col lg-col-6 md-col-6 col-12 sm-center">
                        <img src="/images/landing/relayer_diagram.png" height={isSmallScreen ? 326 : 426} />
                    </div>
                    <div
                        className="col lg-col-6 md-col-6 col-12 lg-pr3 md-pr3 sm-mx-auto"
                        style={{
                            color: colors.beigeWhite,
                            maxWidth: isSmallScreen ? 'none' : 445,
                            height: 430,
                            lineHeight: '430px',
                        }}
                    >
                        <div
                            className="inline-block lg-align-middle md-align-middle sm-align-top"
                            style={{ lineHeight: '43px' }}
                        >
                            <div
                                className="lg-h1 md-h1 sm-h2 pb1 sm-pt3 sm-center"
                                style={{ fontFamily: 'Roboto Mono' }}
                            >
                                <div>{this.props.translate.get(Key.OffChainOrderRelay, Deco.Cap)}</div>
                                <div> {this.props.translate.get(Key.OonChainSettlement, Deco.Cap)}</div>
                            </div>
                            <div
                                className="pb2 pt2 h5 sm-center sm-px3 sm-mx-auto"
                                style={{
                                    fontFamily: 'Roboto Mono',
                                    lineHeight: 1.7,
                                    fontWeight: 300,
                                    maxWidth: 445,
                                }}
                            >
                                {this.props.translate.get(Key.OffChainOnChainDescription, Deco.Cap)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private _renderBuildingBlocksSection(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const descriptionStyle: React.CSSProperties = {
            fontFamily: 'Roboto Mono',
            lineHeight: isSmallScreen ? 1.5 : 2,
            fontWeight: 300,
            fontSize: 15,
            maxWidth: isSmallScreen ? 375 : 'none',
        };
        const callToActionStyle: React.CSSProperties = {
            fontFamily: 'Roboto Mono',
            fontSize: 15,
            fontWeight: 300,
            maxWidth: isSmallScreen ? 375 : 441,
        };
        return (
            <div className="clearfix lg-pt4 md-pt4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="mx-auto max-width-4 lg-pt4 md-pt4 lg-mb4 md-mb4 sm-mb2 clearfix">
                    {isSmallScreen && this._renderBlockChipImage()}
                    <div
                        className="col lg-col-6 md-col-6 col-12 lg-pr3 md-pr3 sm-px3"
                        style={{ color: colors.beigeWhite }}
                    >
                        <div
                            className="pb1 lg-pt4 md-pt4 sm-pt3 lg-h1 md-h1 sm-h2 sm-px3 sm-center"
                            style={{ fontFamily: 'Roboto Mono' }}
                        >
                            {this.props.translate.get(Key.BuildingBlockSectionHeader, Deco.Cap)}
                        </div>
                        <div className="pb3 pt2 sm-mx-auto sm-center" style={descriptionStyle}>
                            {this.props.translate.get(Key.BuildingBlockSectionDescription, Deco.Cap)}
                        </div>
                        <div className="sm-mx-auto sm-center" style={callToActionStyle}>
                            {this.props.translate.get(Key.DevToolsPrompt, Deco.Cap)}{' '}
                            <Link
                                to={WebsitePaths.ZeroExJs}
                                className="text-decoration-none underline"
                                style={{ color: colors.beigeWhite, fontFamily: 'Roboto Mono' }}
                            >
                                0x.js
                            </Link>{' '}
                            {this.props.translate.get(Key.And)}{' '}
                            <Link
                                to={WebsitePaths.SmartContracts}
                                className="text-decoration-none underline"
                                style={{ color: colors.beigeWhite, fontFamily: 'Roboto Mono' }}
                            >
                                {this.props.translate.get(Key.SmartContract)}
                            </Link>{' '}
                            {this.props.translate.get(Key.Docs)}
                        </div>
                    </div>
                    {!isSmallScreen && this._renderBlockChipImage()}
                </div>
            </div>
        );
    }
    private _renderBlockChipImage(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        return (
            <div className="col lg-col-6 md-col-6 col-12 sm-center">
                <img src="/images/landing/0x_chips.png" height={isSmallScreen ? 240 : 368} />
            </div>
        );
    }
    private _renderTokenCloud(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        return (
            <div className="col lg-col-6 md-col-6 col-12 center">
                <img src="/images/landing/tokenized_world.png" height={isSmallScreen ? 280 : 364.5} />
            </div>
        );
    }
    private _renderAssetTypes(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const assetTypes: AssetType[] = [
            {
                title: this.props.translate.get(Key.Currency, Deco.Cap),
                imageUrl: '/images/landing/currency.png',
            },
            {
                title: this.props.translate.get(Key.TraditionalAssets, Deco.Cap),
                imageUrl: '/images/landing/stocks.png',
                style: {
                    paddingLeft: isSmallScreen ? 41 : 56,
                    paddingRight: isSmallScreen ? 41 : 56,
                },
            },
            {
                title: this.props.translate.get(Key.DigitalGoods, Deco.Cap),
                imageUrl: '/images/landing/digital_goods.png',
            },
        ];
        const assets = _.map(assetTypes, (assetType: AssetType) => {
            const style = _.isUndefined(assetType.style) ? {} : assetType.style;
            return (
                <div key={`asset-${assetType.title}`} className="center" style={{ opacity: 0.8, ...style }}>
                    <div>
                        <img src={assetType.imageUrl} height="80" />
                    </div>
                    <div
                        style={{
                            fontFamily: 'Roboto Mono',
                            fontSize: 13.5,
                            fontWeight: 400,
                            color: colors.darkestGrey,
                            lineHeight: 1.4,
                        }}
                    >
                        {assetType.title}
                    </div>
                </div>
            );
        });
        return assets;
    }
    private _renderInfoBoxes(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const boxStyle: React.CSSProperties = {
            maxWidth: 253,
            height: 402,
            backgroundColor: colors.grey50,
            borderRadius: 5,
            padding: '10px 24px 24px',
        };
        const boxContents: BoxContent[] = [
            {
                title: this.props.translate.get(Key.BenefitOneTitle, Deco.Cap),
                description: this.props.translate.get(Key.BenefitOneDescription, Deco.Cap),
                imageUrl: '/images/landing/distributed_network.png',
                classNames: '',
            },
            {
                title: this.props.translate.get(Key.BenefitTwoTitle, Deco.Cap),
                description: this.props.translate.get(Key.BenefitTwoDescription, Deco.Cap),
                imageUrl: '/images/landing/liquidity.png',
                classNames: 'mx-auto',
            },
            {
                title: this.props.translate.get(Key.BenefitThreeTitle, Deco.Cap),
                description: this.props.translate.get(Key.BenefitThreeDescription, Deco.Cap),
                imageUrl: '/images/landing/open_source.png',
                classNames: 'right',
            },
        ];
        const boxes = _.map(boxContents, (boxContent: BoxContent) => {
            return (
                <div key={`box-${boxContent.title}`} className="col lg-col-4 md-col-4 col-12 sm-pb4">
                    <div className={`center sm-mx-auto ${!isSmallScreen && boxContent.classNames}`} style={boxStyle}>
                        <div>
                            <img src={boxContent.imageUrl} style={{ height: 210 }} />
                        </div>
                        <div className="h3" style={{ color: 'black', fontFamily: 'Roboto Mono' }}>
                            {boxContent.title}
                        </div>
                        <div className="pt2 pb2" style={{ fontFamily: 'Roboto Mono', fontSize: 14 }}>
                            {boxContent.description}
                        </div>
                    </div>
                </div>
            );
        });
        const titleStyle: React.CSSProperties = {
            fontFamily: 'Roboto Mono',
            color: colors.grey,
            fontWeight: 300,
            letterSpacing: 3,
        };
        return (
            <div className="clearfix" style={{ backgroundColor: colors.heroGrey }}>
                <div className="center pb3 pt4" style={titleStyle}>
                    {this.props.translate.get(Key.BenefitsHeader, Deco.Upper)}
                </div>
                <div className="mx-auto pb4 sm-mt2 clearfix" style={{ maxWidth: '60em' }}>
                    {boxes}
                </div>
            </div>
        );
    }
    private _renderUseCases(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;

        const useCases: UseCase[] = [
            {
                imageUrl: '/images/landing/governance_icon.png',
                type: this.props.translate.get(Key.DecentralizedGovernance, Deco.Upper),
                description: this.props.translate.get(Key.DecentralizedGovernanceDescription, Deco.Cap),
                projectIconUrls: ['/images/landing/aragon.png'],
                classNames: 'lg-px2 md-px2',
            },
            {
                imageUrl: '/images/landing/prediction_market_icon.png',
                type: this.props.translate.get(Key.PredictionMarkets, Deco.Upper),
                description: this.props.translate.get(Key.PredictionMarketsDescription, Deco.Cap),
                projectIconUrls: ['/images/landing/augur.png'],
                classNames: 'lg-px2 md-px2',
            },
            {
                imageUrl: '/images/landing/stable_tokens_icon.png',
                type: this.props.translate.get(Key.StableTokens, Deco.Upper),
                description: this.props.translate.get(Key.StableTokensDescription, Deco.Cap),
                projectIconUrls: ['/images/landing/maker.png'],
                classNames: 'lg-px2 md-px2',
            },
            {
                imageUrl: '/images/landing/loans_icon.png',
                type: this.props.translate.get(Key.DecentralizedLoans, Deco.Upper),
                description: this.props.translate.get(Key.DecentralizedLoansDescription, Deco.Cap),
                projectIconUrls: ['/images/landing/dharma.png', '/images/landing/lendroid.png'],
                classNames: 'lg-pr2 md-pr2 lg-col-6 md-col-6',
                style: {
                    width: 291,
                    float: 'right',
                    marginTop: !isSmallScreen ? 38 : 0,
                },
            },
            {
                imageUrl: '/images/landing/fund_management_icon.png',
                type: this.props.translate.get(Key.FundManagement, Deco.Upper),
                description: this.props.translate.get(Key.FundManagementDescription, Deco.Cap),
                projectIconUrls: ['/images/landing/melonport.png'],
                classNames: 'lg-pl2 md-pl2 lg-col-6 md-col-6',
                style: { width: 291, marginTop: !isSmallScreen ? 38 : 0 },
            },
        ];

        const cases = _.map(useCases, (useCase: UseCase) => {
            const style = _.isUndefined(useCase.style) || isSmallScreen ? {} : useCase.style;
            const useCaseBoxStyle = {
                color: colors.grey,
                border: `1px solid ${colors.grey750}`,
                borderRadius: 4,
                maxWidth: isSmallScreen ? 375 : 'none',
                ...style,
            };
            const typeStyle: React.CSSProperties = {
                color: colors.lightGrey,
                fontSize: 13,
                textTransform: 'uppercase',
                fontFamily: 'Roboto Mono',
                fontWeight: 300,
            };
            return (
                <div
                    key={`useCase-${useCase.type}`}
                    className={`col lg-col-4 md-col-4 col-12 sm-pt3 sm-px3 sm-pb3 ${useCase.classNames}`}
                >
                    <div className="relative p2 pb2 sm-mx-auto" style={useCaseBoxStyle}>
                        <div className="absolute center" style={{ top: -35, width: 'calc(100% - 32px)' }}>
                            <img src={useCase.imageUrl} style={{ height: 50 }} />
                        </div>
                        <div className="pt2 center" style={typeStyle}>
                            {useCase.type}
                        </div>
                        <div
                            className="pt2"
                            style={{
                                lineHeight: 1.5,
                                fontSize: 14,
                                overflow: 'hidden',
                                height: 104,
                            }}
                        >
                            {useCase.description}
                        </div>
                    </div>
                </div>
            );
        });
        return (
            <div className="clearfix pb4 lg-pt2 md-pt2 sm-pt4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="mx-auto pb4 pt3 mt1 sm-mt2 clearfix" style={{ maxWidth: '67em' }}>
                    {cases}
                </div>
            </div>
        );
    }
    private _renderCallToAction(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const buttonLabelStyle: React.CSSProperties = {
            textTransform: 'none',
            fontSize: 15,
            fontWeight: 400,
        };
        const lightButtonStyle: React.CSSProperties = {
            borderRadius: 6,
            border: `1px solid ${colors.grey500}`,
            lineHeight: '33px',
            height: 49,
        };
        const callToActionClassNames =
            'lg-pr3 md-pr3 lg-right-align md-right-align sm-center sm-px3 h4 lg-table-cell md-table-cell';
        return (
            <div className="clearfix pb4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="mx-auto max-width-4 pb4 mb3 clearfix center">
                    <div className="center inline-block" style={{ textAlign: 'left' }}>
                        <div
                            className={callToActionClassNames}
                            style={{
                                fontFamily: 'Roboto Mono',
                                color: colors.white,
                                lineHeight: isSmallScreen ? 1.7 : 3,
                            }}
                        >
                            {this.props.translate.get(Key.FinalCallToAction, Deco.Cap)}
                        </div>
                        <div className="sm-center sm-pt2 lg-table-cell md-table-cell">
                            <Link to={WebsitePaths.ZeroExJs} className="text-decoration-none">
                                <RaisedButton
                                    style={{ borderRadius: 6, minWidth: 150 }}
                                    buttonStyle={lightButtonStyle}
                                    labelColor={colors.white}
                                    backgroundColor={colors.heroGrey}
                                    labelStyle={buttonLabelStyle}
                                    label={this.props.translate.get(Key.BuildCallToAction, Deco.Cap)}
                                    onClick={_.noop}
                                />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private _updateScreenWidth(): void {
        const newScreenWidth = utils.getScreenWidth();
        if (newScreenWidth !== this.state.screenWidth) {
            this.setState({
                screenWidth: newScreenWidth,
            });
        }
    }
    private _onLanguageSelected(language: Language): void {
        this.props.dispatcher.updateSelectedLanguage(language);
    }
} // tslint:disable:max-file-line-count
