import * as _ from 'lodash';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import { Link } from 'react-router-dom';
import { Footer } from 'ts/components/footer';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { ScreenWidths, WebsitePaths } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { constants } from 'ts/utils/constants';
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

const boxContents: BoxContent[] = [
    {
        title: 'Trustless exchange',
        description:
            "Built on Ethereum's distributed network with no centralized \
                      point of failure and no down time, each trade is settled atomically \
                      and without counterparty risk.",
        imageUrl: '/images/landing/distributed_network.png',
        classNames: '',
    },
    {
        title: 'Shared liquidity',
        description:
            'By sharing a standard API, relayers can easily aggregate liquidity pools, \
                      creating network effects around liquidity that compound as more relayers come online.',
        imageUrl: '/images/landing/liquidity.png',
        classNames: 'mx-auto',
    },
    {
        title: 'Open source',
        description:
            '0x is open source, permissionless and free to use. Trade directly with a known \
                      counterparty for free or pay a relayer some ZRX tokens to access their liquidity \
                      pool.',
        imageUrl: '/images/landing/open_source.png',
        classNames: 'right',
    },
];

const relayersAndDappProjects: Project[] = [
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
        logoFileName: 'dydx.png',
        projectUrl: constants.PROJECT_URL_DYDX,
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
        logoFileName: 'status.png',
        projectUrl: constants.PROJECT_URL_STATUS,
    },
    {
        logoFileName: 'augur.png',
        projectUrl: constants.PROJECT_URL_AUGUR,
    },
    {
        logoFileName: 'anx.png',
        projectUrl: constants.PROJECT_URL_OPEN_ANX,
    },
    {
        logoFileName: 'auctus.png',
        projectUrl: constants.PROJECT_URL_AUCTUS,
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
        logoFileName: 'dydx.png',
        projectUrl: constants.PROJECT_URL_DYDX,
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
];

export interface LandingProps {
    location: Location;
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
    public componentDidMount() {
        window.addEventListener('resize', this._throttledScreenWidthUpdate);
        window.scrollTo(0, 0);
    }
    public componentWillUnmount() {
        window.removeEventListener('resize', this._throttledScreenWidthUpdate);
    }
    public render() {
        return (
            <div id="landing" className="clearfix" style={{ color: colors.grey500 }}>
                <DocumentTitle title="0x Protocol" />
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    isNightVersion={true}
                    style={{ backgroundColor: colors.heroGrey, position: 'relative' }}
                />
                {this._renderHero()}
                {this._renderProjects(relayersAndDappProjects, 'Projects building on 0x', colors.projectsGrey, false)}
                {this._renderTokenizationSection()}
                {this._renderProtocolSection()}
                {this._renderProjects(relayerProjects, 'Relayers building on 0x', colors.heroGrey, true)}
                {this._renderInfoBoxes()}
                {this._renderBuildingBlocksSection()}
                {this._renderUseCases()}
                {this._renderCallToAction()}
                <Footer />
            </div>
        );
    }
    private _renderHero() {
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
        const left = 'col lg-col-7 md-col-7 col-12 lg-pt4 md-pt4 sm-pt0 mt1 lg-pl4 md-pl4 sm-pl0 sm-px3 sm-center';
        return (
            <div className="clearfix py4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="mx-auto max-width-4 clearfix">
                    <div className="lg-pt4 md-pt4 sm-pt2 lg-pb4 md-pb4 lg-my4 md-my4 sm-mt2 sm-mb4 clearfix">
                        <div className="col lg-col-5 md-col-5 col-12 sm-center">
                            <img src="/images/landing/hero_chip_image.png" height={isSmallScreen ? 300 : 395} />
                        </div>
                        <div className={left} style={{ color: colors.white }}>
                            <div style={{ paddingLeft: isSmallScreen ? 0 : 12 }}>
                                <div
                                    className="sm-pb2"
                                    style={{
                                        fontFamily: 'Roboto Mono',
                                        fontSize: isSmallScreen ? 26 : 34,
                                    }}
                                >
                                    Powering decentralized exchange
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
                                    0x is an open, permissionless protocol allowing for ERC20 tokens to be traded on the
                                    Ethereum blockchain.
                                </div>
                                <div className="pt3 clearfix sm-mx-auto" style={{ maxWidth: 342 }}>
                                    <div className="lg-pr2 md-pr2 col col-6 sm-center">
                                        <Link to={WebsitePaths.ZeroExJs} className="text-decoration-none">
                                            <RaisedButton
                                                style={{ borderRadius: 6, minWidth: 157.36 }}
                                                buttonStyle={{ borderRadius: 6 }}
                                                labelStyle={buttonLabelStyle}
                                                label="Build on 0x"
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
                                                label="Join the community"
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
    private _renderProjects(projects: Project[], title: string, backgroundColor: string, isTitleCenter: boolean) {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const isMediumScreen = this.state.screenWidth === ScreenWidths.Md;
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
            textTransform: 'uppercase',
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
                        view the{' '}
                        <Link
                            to={`${WebsitePaths.Wiki}#List-of-Projects-Using-0x-Protocol`}
                            className="text-decoration-none underline"
                            style={{ color: colors.landingLinkGrey }}
                        >
                            full list
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    private _renderTokenizationSection() {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        return (
            <div className="clearfix lg-py4 md-py4 sm-pb4 sm-pt2" style={{ backgroundColor: colors.grey100 }}>
                <div className="mx-auto max-width-4 py4 clearfix">
                    {isSmallScreen && this._renderTokenCloud()}
                    <div className="col lg-col-6 md-col-6 col-12" style={{ color: colors.darkestGrey }}>
                        <div className="mx-auto" style={{ maxWidth: 385, paddingTop: 7 }}>
                            <div className="lg-h1 md-h1 sm-h2 sm-center sm-pt3" style={{ fontFamily: 'Roboto Mono' }}>
                                The world's value is becoming tokenized
                            </div>
                            <div
                                className="pb2 lg-pt2 md-pt2 sm-pt3 sm-px3 h5 sm-center"
                                style={{ fontFamily: 'Roboto Mono', lineHeight: 1.7 }}
                            >
                                {isSmallScreen ? (
                                    <span>
                                        The Ethereum blockchain is an open, borderless financial system that represents
                                        a wide variety of assets as cryptographic tokens. In the future, most digital
                                        assets and goods will be tokenized.
                                    </span>
                                ) : (
                                    <div>
                                        <div>
                                            The Ethereum blockchain is an open, borderless financial system that
                                            represents
                                        </div>
                                        <div>
                                            a wide variety of assets as cryptographic tokens. In the future, most
                                            digital assets and goods will be tokenized.
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex pt1 sm-px3">{this._renderAssetTypes()}</div>
                        </div>
                    </div>
                    {!isSmallScreen && this._renderTokenCloud()}
                </div>
            </div>
        );
    }
    private _renderProtocolSection() {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        return (
            <div className="clearfix pt4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="mx-auto max-width-4 pt4 clearfix">
                    <div className="col lg-col-6 md-col-6 col-12 sm-center">
                        <img src="/images/landing/relayer_diagram.png" height={isSmallScreen ? 326 : 426} />
                    </div>
                    <div
                        className="col lg-col-6 md-col-6 col-12 lg-pr3 md-pr3 sm-mx-auto lg-pt4 md-pt4 lg-mt3 md-mt3"
                        style={{
                            color: colors.beigeWhite,
                            maxWidth: isSmallScreen ? 'none' : 445,
                        }}
                    >
                        <div className="lg-h1 md-h1 sm-h2 pb1 sm-pt3 sm-center" style={{ fontFamily: 'Roboto Mono' }}>
                            <div>Off-chain order relay</div>
                            <div>On-chain settlement</div>
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
                            In 0x protocol, orders are transported off-chain, massively reducing gas costs and
                            eliminating blockchain bloat. Relayers help broadcast orders and collect a fee each time
                            they facilitate a trade. Anyone can build a relayer.
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private _renderBuildingBlocksSection() {
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
                            A building block for dApps
                        </div>
                        <div className="pb3 pt2 sm-mx-auto sm-center" style={descriptionStyle}>
                            0x protocol is a pluggable building block for dApps that require exchange functionality.
                            Join the many developers that are already using 0x in their web applications and smart
                            contracts.
                        </div>
                        <div className="sm-mx-auto sm-center" style={callToActionStyle}>
                            Learn how in our{' '}
                            <Link
                                to={WebsitePaths.ZeroExJs}
                                className="text-decoration-none underline"
                                style={{ color: colors.beigeWhite, fontFamily: 'Roboto Mono' }}
                            >
                                0x.js
                            </Link>{' '}
                            and{' '}
                            <Link
                                to={WebsitePaths.SmartContracts}
                                className="text-decoration-none underline"
                                style={{ color: colors.beigeWhite, fontFamily: 'Roboto Mono' }}
                            >
                                smart contract
                            </Link>{' '}
                            docs
                        </div>
                    </div>
                    {!isSmallScreen && this._renderBlockChipImage()}
                </div>
            </div>
        );
    }
    private _renderBlockChipImage() {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        return (
            <div className="col lg-col-6 md-col-6 col-12 sm-center">
                <img src="/images/landing/0x_chips.png" height={isSmallScreen ? 240 : 368} />
            </div>
        );
    }
    private _renderTokenCloud() {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        return (
            <div className="col lg-col-6 md-col-6 col-12 center">
                <img src="/images/landing/tokenized_world.png" height={isSmallScreen ? 280 : 364.5} />
            </div>
        );
    }
    private _renderAssetTypes() {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const assetTypes: AssetType[] = [
            {
                title: 'Currency',
                imageUrl: '/images/landing/currency.png',
            },
            {
                title: 'Traditional assets',
                imageUrl: '/images/landing/stocks.png',
                style: {
                    paddingLeft: isSmallScreen ? 41 : 56,
                    paddingRight: isSmallScreen ? 41 : 56,
                },
            },
            {
                title: 'Digital goods',
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
                        }}
                    >
                        {assetType.title}
                    </div>
                </div>
            );
        });
        return assets;
    }
    private _renderInfoBoxes() {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const boxStyle: React.CSSProperties = {
            maxWidth: 252,
            height: 386,
            backgroundColor: colors.grey50,
            borderRadius: 5,
            padding: '10px 24px 24px',
        };
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
            textTransform: 'uppercase',
            fontWeight: 300,
            letterSpacing: 3,
        };
        return (
            <div className="clearfix" style={{ backgroundColor: colors.heroGrey }}>
                <div className="center pb3 pt4" style={titleStyle}>
                    Benefits of 0x
                </div>
                <div className="mx-auto pb4 sm-mt2 clearfix" style={{ maxWidth: '60em' }}>
                    {boxes}
                </div>
            </div>
        );
    }
    private _renderUseCases() {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;

        const useCases: UseCase[] = [
            {
                imageUrl: '/images/landing/governance_icon.png',
                type: 'Decentralized governance',
                description:
                    'Decentralized organizations use tokens to represent ownership and \
                              guide their governance logic. 0x allows decentralized organizations \
                              to seamlessly and safely trade ownership for startup capital.',
                projectIconUrls: ['/images/landing/aragon.png'],
                classNames: 'lg-px2 md-px2',
            },
            {
                imageUrl: '/images/landing/prediction_market_icon.png',
                type: 'Prediction markets',
                description:
                    'Decentralized prediction market platforms generate sets of tokens that \
                              represent a financial stake in the outcomes of real-world events. 0x allows \
                              these tokens to be instantly tradable.',
                projectIconUrls: ['/images/landing/augur.png'],
                classNames: 'lg-px2 md-px2',
            },
            {
                imageUrl: '/images/landing/stable_tokens_icon.png',
                type: 'Stable tokens',
                description:
                    'Novel economic constructs such as stable coins require efficient, liquid \
                              markets to succeed. 0x will facilitate the underlying economic mechanisms \
                              that allow these tokens to remain stable.',
                projectIconUrls: ['/images/landing/maker.png'],
                classNames: 'lg-px2 md-px2',
            },
            {
                imageUrl: '/images/landing/loans_icon.png',
                type: 'Decentralized loans',
                description:
                    'Efficient lending requires liquid markets where investors can buy and re-sell loans. \
                              0x enables an ecosystem of lenders to self-organize and efficiently determine \
                              market prices for all outstanding loans.',
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
                type: 'Fund management',
                description:
                    'Decentralized fund management limits fund managers to investing in pre-agreed \
                              upon asset classes. Embedding 0x into fund management smart contracts enables \
                              them to enforce these security constraints.',
                projectIconUrls: ['/images/landing/melonport.png'],
                classNames: 'lg-pl2 md-pl2 lg-col-6 md-col-6',
                style: { width: 291, marginTop: !isSmallScreen ? 38 : 0 },
            },
        ];

        const cases = _.map(useCases, (useCase: UseCase) => {
            const style = _.isUndefined(useCase.style) || isSmallScreen ? {} : useCase.style;
            const useCaseBoxStyle = {
                color: colors.grey,
                border: '1px solid #565656',
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
    private _renderCallToAction() {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const buttonLabelStyle: React.CSSProperties = {
            textTransform: 'none',
            fontSize: 15,
            fontWeight: 400,
        };
        const lightButtonStyle: React.CSSProperties = {
            borderRadius: 6,
            border: '1px solid #a0a0a0',
            lineHeight: '33px',
            height: 49,
        };
        const callToActionClassNames =
            'col lg-col-8 md-col-8 col-12 lg-pr3 md-pr3 \
                                        lg-right-align md-right-align sm-center sm-px3 h4';
        return (
            <div className="clearfix pb4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="mx-auto max-width-4 pb4 mb3 clearfix">
                    <div
                        className={callToActionClassNames}
                        style={{
                            fontFamily: 'Roboto Mono',
                            color: colors.white,
                            lineHeight: isSmallScreen ? 1.7 : 3,
                        }}
                    >
                        Get started on building the decentralized future
                    </div>
                    <div className="col lg-col-4 md-col-4 col-12 sm-center sm-pt2">
                        <Link to={WebsitePaths.ZeroExJs} className="text-decoration-none">
                            <RaisedButton
                                style={{ borderRadius: 6, minWidth: 150 }}
                                buttonStyle={lightButtonStyle}
                                labelColor={colors.white}
                                backgroundColor={colors.heroGrey}
                                labelStyle={buttonLabelStyle}
                                label="Build on 0x"
                                onClick={_.noop}
                            />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    private _updateScreenWidth() {
        const newScreenWidth = utils.getScreenWidth();
        if (newScreenWidth !== this.state.screenWidth) {
            this.setState({
                screenWidth: newScreenWidth,
            });
        }
    }
} // tslint:disable:max-file-line-count
