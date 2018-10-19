import { colors, Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import { Footer } from 'ts/components/footer';
import { SubscribeForm } from 'ts/components/forms/subscribe_form';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { CallToAction } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { Image } from 'ts/components/ui/image';
import { Text } from 'ts/components/ui/text';
import { TypedText } from 'ts/components/ui/typed_text';
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
    maxWidth: number;
}
interface UseCase {
    imageUrl: string;
    type: string;
    description: string;
    classNames: string;
    style?: React.CSSProperties;
}
interface Project {
    logoFileName: string;
    projectUrl: string;
}

const THROTTLE_TIMEOUT = 100;
const WHATS_NEW_TITLE = '0x Protocol v2 is Live!';
const WHATS_NEW_URL = 'https://blog.0xproject.com/0x-protocol-v2-0-is-live-183aac180149';
const TITLE_STYLE: React.CSSProperties = {
    fontFamily: 'Roboto Mono',
    color: colors.grey,
    fontWeight: 300,
    letterSpacing: 3,
};
const ROTATING_LIST = [
    'tokens',
    'game items',
    'digital art',
    'futures',
    'stocks',
    'derivatives',
    'loans',
    'cats',
    'everything',
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
    private readonly _throttledScreenWidthUpdate: () => void;
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
                    relayerProjects,
                    this.props.translate.get(Key.RelayersHeader, Deco.Upper),
                    colors.projectsGrey,
                    true,
                )}
                {this._renderInfoBoxes()}
                {this._renderTokenizationSection()}
                {this._renderUseCases()}
                {this._renderCallToAction()}
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </div>
        );
    }
    private _renderHero(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const left = 'col lg-col-6 md-col-6 col-12 lg-pl4 md-pl4 sm-pl0 sm-px3 sm-center';
        const flexClassName = isSmallScreen
            ? 'flex items-center flex-column justify-center'
            : 'flex items-center justify-center';
        return (
            <div className="clearfix py4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="mx-auto max-width-4 clearfix">
                    {this._renderWhatsNew()}
                    <div className={`${flexClassName} lg-pt4 md-pt4 sm-pt2 lg-pb4 md-pb4 lg-mt4 md-mt4 sm-mt2 sm-mb4`}>
                        <Container marginTop="30px" marginBottom="30px" marginLeft="15px" marginRight="15px">
                            <Image src="/images/landing/0x_homepage.svg" maxWidth="100%" height="auto" />
                        </Container>
                        <div className={left} style={{ color: colors.white, height: 390, lineHeight: '390px' }}>
                            <div
                                className="inline-block lg-align-middle md-align-middle sm-align-top"
                                style={{
                                    paddingLeft: isSmallScreen ? 0 : 12,
                                    lineHeight: '36px',
                                }}
                            >
                                <Text
                                    className="sm-pb2"
                                    fontFamily="Roboto"
                                    display="inline-block"
                                    fontColor={colors.grey300}
                                    fontWeight={500}
                                    lineHeight="1.3em"
                                    fontSize={isSmallScreen ? '28px' : '36px'}
                                >
                                    {this.props.translate.get(Key.TopHeader, Deco.Cap)}
                                    {this.props.translate.getLanguage() === Language.English && (
                                        <React.Fragment>
                                            {' '}
                                            for{' '}
                                            <TypedText
                                                fontFamily="Roboto"
                                                display="inline-block"
                                                fontColor={colors.white}
                                                fontWeight={700}
                                                lineHeight="1.3em"
                                                fontSize={isSmallScreen ? '28px' : '36px'}
                                                textList={ROTATING_LIST}
                                                shouldRepeat={true}
                                            />
                                        </React.Fragment>
                                    )}
                                </Text>
                                <Container
                                    className={`pt3 flex clearfix sm-mx-auto ${isSmallScreen ? 'justify-center' : ''}`}
                                >
                                    <Container paddingRight="20px">
                                        <Link to={WebsitePaths.Docs}>
                                            <CallToAction type="light">
                                                {this.props.translate.get(Key.BuildCallToAction, Deco.Cap)}
                                            </CallToAction>
                                        </Link>
                                    </Container>
                                    <div>
                                        <Link to={WebsitePaths.Portal}>
                                            <CallToAction>
                                                {this.props.translate.get(Key.TradeCallToAction, Deco.Cap)}
                                            </CallToAction>
                                        </Link>
                                    </div>
                                </Container>
                            </div>
                        </div>
                    </div>
                </div>
                {this.props.translate.getLanguage() === Language.English && <SubscribeForm />}
            </div>
        );
    }
    private _renderWhatsNew(): React.ReactNode {
        return (
            <div className="sm-center sm-px1">
                <a href={WHATS_NEW_URL} target="_blank" className="inline-block text-decoration-none">
                    <div className="flex items-center sm-pl0 md-pl2 lg-pl0">
                        <Container
                            paddingTop="3px"
                            paddingLeft="8px"
                            paddingBottom="3px"
                            paddingRight="8px"
                            backgroundColor={colors.white}
                            borderRadius={6}
                        >
                            <Text fontSize="14px" fontWeight={500} fontColor={colors.heroGrey}>
                                New
                            </Text>
                        </Container>
                        <Container marginLeft="12px">
                            <Text fontSize="16px" fontWeight={500} fontColor={colors.grey300}>
                                {WHATS_NEW_TITLE}
                            </Text>
                        </Container>
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

                default:
                    throw new Error(`Encountered unknown ScreenWidths value: ${this.state.screenWidth}`);
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
        return (
            <div className={`clearfix py4 ${isTitleCenter && 'center'}`} style={{ backgroundColor }}>
                <div className="mx-auto max-width-4 clearfix sm-px3">
                    <div className="h4 pb3 lg-pl0 md-pl3 sm-pl2" style={TITLE_STYLE}>
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
                        <Link to={WebsitePaths.Portal} textDecoration="underline" fontColor={colors.landingLinkGrey}>
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
                            <div className="flex pt1 sm-px3">{this._renderMissionAndValuesButton()}</div>
                        </div>
                    </div>
                    {!isSmallScreen && this._renderTokenCloud()}
                </div>
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
    private _renderMissionAndValuesButton(): React.ReactNode {
        return (
            <a
                href={constants.URL_MISSION_AND_VALUES_BLOG_POST}
                target="_blank"
                className="inline-block text-decoration-none"
            >
                <CallToAction>{this.props.translate.get(Key.OurMissionAndValues, Deco.CapWords)}</CallToAction>
            </a>
        );
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
                maxWidth: 160,
            },
            {
                title: this.props.translate.get(Key.BenefitTwoTitle, Deco.Cap),
                description: this.props.translate.get(Key.BenefitTwoDescription, Deco.Cap),
                imageUrl: '/images/landing/liquidity.png',
                classNames: 'mx-auto',
                maxWidth: 160,
            },
            {
                title: this.props.translate.get(Key.BenefitThreeTitle, Deco.Cap),
                description: this.props.translate.get(Key.BenefitThreeDescription, Deco.Cap),
                imageUrl: '/images/landing/exchange_everywhere.png',
                classNames: 'right',
                maxWidth: 130,
            },
        ];
        const boxes = _.map(boxContents, (boxContent: BoxContent) => {
            return (
                <div key={`box-${boxContent.title}`} className="col lg-col-4 md-col-4 col-12 sm-pb4">
                    <div className={`center sm-mx-auto ${!isSmallScreen && boxContent.classNames}`} style={boxStyle}>
                        <Container className="flex items-center" height="210px">
                            <img
                                className="mx-auto"
                                src={boxContent.imageUrl}
                                style={{ height: 'auto', maxWidth: boxContent.maxWidth }}
                            />
                        </Container>
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
        return (
            <div className="clearfix" style={{ backgroundColor: colors.heroGrey }}>
                <div className="center pb3 pt4" style={TITLE_STYLE}>
                    {this.props.translate.get(Key.BenefitsHeader, Deco.Upper)}
                </div>
                <div className="mx-auto pb4 sm-mt2 clearfix" style={{ maxWidth: '60em' }}>
                    {boxes}
                </div>
            </div>
        );
    }
    private _getUseCases(): UseCase[] {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const isEnglish = this.props.translate.getLanguage() === Language.English;
        if (isEnglish) {
            return [
                {
                    imageUrl: '/images/landing/governance_icon.png',
                    type: this.props.translate.get(Key.GamingAndCollectables, Deco.Upper),
                    description: this.props.translate.get(Key.GamingAndCollectablesDescription, Deco.Cap),
                    classNames: 'lg-px2 md-px2',
                },
                {
                    imageUrl: '/images/landing/prediction_market_icon.png',
                    type: this.props.translate.get(Key.PredictionMarkets, Deco.Upper),
                    description: this.props.translate.get(Key.PredictionMarketsDescription, Deco.Cap),
                    classNames: 'lg-px2 md-px2',
                },
                {
                    imageUrl: '/images/landing/fund_management_icon.png',
                    type: this.props.translate.get(Key.OrderBooks, Deco.Upper),
                    description: this.props.translate.get(Key.OrderBooksDescription, Deco.Cap),
                    classNames: 'lg-px2 md-px2',
                },
                {
                    imageUrl: '/images/landing/loans_icon.png',
                    type: this.props.translate.get(Key.DecentralizedLoans, Deco.Upper),
                    description: this.props.translate.get(Key.DecentralizedLoansDescription, Deco.Cap),
                    classNames: 'lg-pr2 md-pr2 lg-col-6 md-col-6',
                    style: {
                        width: 291,
                        float: 'right',
                        marginTop: !isSmallScreen ? 38 : 0,
                    },
                },
                {
                    imageUrl: '/images/landing/stable_tokens_icon.png',
                    type: this.props.translate.get(Key.StableTokens, Deco.Upper),
                    description: this.props.translate.get(Key.StableTokensDescription, Deco.Cap),
                    classNames: 'lg-pl2 md-pl2 lg-col-6 md-col-6',
                    style: { width: 291, marginTop: !isSmallScreen ? 38 : 0 },
                },
            ];
        } else {
            return [
                {
                    imageUrl: '/images/landing/governance_icon.png',
                    type: this.props.translate.get(Key.DecentralizedGovernance, Deco.Upper),
                    description: this.props.translate.get(Key.DecentralizedGovernanceDescription, Deco.Cap),
                    classNames: 'lg-px2 md-px2',
                },
                {
                    imageUrl: '/images/landing/prediction_market_icon.png',
                    type: this.props.translate.get(Key.PredictionMarkets, Deco.Upper),
                    description: this.props.translate.get(Key.PredictionMarketsDescription, Deco.Cap),
                    classNames: 'lg-px2 md-px2',
                },
                {
                    imageUrl: '/images/landing/stable_tokens_icon.png',
                    type: this.props.translate.get(Key.StableTokens, Deco.Upper),
                    description: this.props.translate.get(Key.StableTokensDescription, Deco.Cap),
                    classNames: 'lg-px2 md-px2',
                },
                {
                    imageUrl: '/images/landing/loans_icon.png',
                    type: this.props.translate.get(Key.DecentralizedLoans, Deco.Upper),
                    description: this.props.translate.get(Key.DecentralizedLoansDescription, Deco.Cap),
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
                    classNames: 'lg-pl2 md-pl2 lg-col-6 md-col-6',
                    style: { width: 291, marginTop: !isSmallScreen ? 38 : 0 },
                },
            ];
        }
    }
    private _renderUseCases(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
        const useCases = this._getUseCases();
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
                                height: 124,
                            }}
                        >
                            {useCase.description}
                        </div>
                    </div>
                </div>
            );
        });
        return (
            <div className="clearfix py4" style={{ backgroundColor: colors.heroGrey }}>
                <div className="center h4 pb3 lg-pl0 md-pl3 sm-pl2" style={TITLE_STYLE}>
                    {this.props.translate.get(Key.UseCasesHeader, Deco.Upper)}
                </div>
                <div className="mx-auto pb4 pt3 mt1 sm-mt2 clearfix" style={{ maxWidth: '67em' }}>
                    {cases}
                </div>
            </div>
        );
    }
    private _renderCallToAction(): React.ReactNode {
        const isSmallScreen = this.state.screenWidth === ScreenWidths.Sm;
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
                            <Link to={WebsitePaths.Docs}>
                                <CallToAction fontSize="15px">
                                    {this.props.translate.get(Key.BuildCallToAction, Deco.Cap)}
                                </CallToAction>
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
} // tslint:disable:max-file-line-count
