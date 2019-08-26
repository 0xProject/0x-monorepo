import { Link } from 'ts/components/documentation/shared/link';

import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';
import { colors } from 'ts/style/colors';

import { Dispatcher } from 'ts/redux/dispatcher';
import { ALink, Deco, Key, Language, WebsiteLegacyPaths, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

const ICON_DIMENSION = 16;

const languageToMenuTitle = {
    [Language.English]: 'English',
    [Language.Russian]: 'Русский',
    [Language.Spanish]: 'Español',
    [Language.Korean]: '한국어',
    [Language.Chinese]: '中文',
};

export interface FooterProps {
    translate: Translate;
    dispatcher: Dispatcher;
    backgroundColor?: string;
}

interface FooterState {
    selectedLanguage: Language;
}

export class Footer extends React.Component<FooterProps, FooterState> {
    public static defaultProps = {
        backgroundColor: colors.darkerGrey,
    };
    constructor(props: FooterProps) {
        super(props);
        this.state = {
            selectedLanguage: props.translate.getLanguage(),
        };
    }
    public render(): React.ReactNode {
        const sectionNameToLinks: ObjectMap<ALink[]> = {
            [Key.Documentation]: [
                {
                    title: 'Developer Home',
                    to: WebsitePaths.Docs,
                },
                {
                    title: '0x.js',
                    to: WebsiteLegacyPaths.ZeroExJs,
                },
                {
                    title: this.props.translate.get(Key.SmartContracts, Deco.Cap),
                    to: WebsitePaths.SmartContracts,
                },
                {
                    title: this.props.translate.get(Key.Connect, Deco.Cap),
                    to: WebsiteLegacyPaths.Connect,
                },
                {
                    title: this.props.translate.get(Key.Whitepaper, Deco.Cap),
                    to: WebsitePaths.Whitepaper,
                    shouldOpenInNewTab: true,
                },
                {
                    title: this.props.translate.get(Key.Wiki, Deco.Cap),
                    to: WebsitePaths.Wiki,
                },
            ],
            [Key.Community]: [
                {
                    title: this.props.translate.get(Key.Discord, Deco.Cap),
                    to: constants.URL_ZEROEX_CHAT,
                    shouldOpenInNewTab: true,
                },
                {
                    title: this.props.translate.get(Key.Blog, Deco.Cap),
                    to: constants.URL_BLOG,
                    shouldOpenInNewTab: true,
                },
                {
                    title: 'Twitter',
                    to: constants.URL_TWITTER,
                    shouldOpenInNewTab: true,
                },
                {
                    title: 'Reddit',
                    to: constants.URL_REDDIT,
                    shouldOpenInNewTab: true,
                },
                {
                    title: this.props.translate.get(Key.Forum, Deco.Cap),
                    to: constants.URL_DISCOURSE_FORUM,
                    shouldOpenInNewTab: true,
                },
            ],
            [Key.Organization]: [
                {
                    title: this.props.translate.get(Key.About, Deco.Cap),
                    to: WebsitePaths.About,
                },
                {
                    title: this.props.translate.get(Key.Careers, Deco.Cap),
                    to: WebsitePaths.Careers,
                },
                {
                    title: this.props.translate.get(Key.Contact, Deco.Cap),
                    to: 'mailto:team@0x.org',
                    shouldOpenInNewTab: true,
                },
            ],
        };
        const languageMenuItems = _.map(languageToMenuTitle, (menuTitle: string, language: Language) => {
            return <MenuItem key={menuTitle} value={language} primaryText={menuTitle} />;
        });
        return (
            <div className="relative pb4 pt2" style={{ backgroundColor: this.props.backgroundColor }}>
                <div className="mx-auto max-width-4 md-px2 lg-px0 py4 clearfix" style={{ color: colors.white }}>
                    <div className="col lg-col-4 md-col-4 col-12 left">
                        <div className="sm-mx-auto" style={{ width: 148 }}>
                            <div>
                                <img src="/images/protocol_logo_white.png" height="30" />
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: colors.grey,
                                    paddingLeft: 37,
                                    paddingTop: 2,
                                }}
                            >
                                © ZeroEx, Intl.
                            </div>
                            <div className="pt4 center">
                                <DropDownMenu
                                    labelStyle={{ color: colors.white }}
                                    value={this.state.selectedLanguage}
                                    onChange={this._updateLanguage.bind(this)}
                                >
                                    {languageMenuItems}
                                </DropDownMenu>
                            </div>
                        </div>
                    </div>
                    <div className="col lg-col-8 md-col-8 col-12 lg-pl4 md-pl4">
                        <div className="col lg-col-4 md-col-4 col-12">
                            <div className="lg-right md-right sm-center">
                                {this._renderHeader(Key.Documentation)}
                                {_.map(sectionNameToLinks[Key.Documentation], this._renderMenuItem.bind(this))}
                            </div>
                        </div>
                        <div className="col lg-col-4 md-col-4 col-12 lg-pr2 md-pr2">
                            <div className="lg-right md-right sm-center">
                                {this._renderHeader(Key.Community)}
                                {_.map(sectionNameToLinks[Key.Community], this._renderMenuItem.bind(this))}
                            </div>
                        </div>
                        <div className="col lg-col-4 md-col-4 col-12">
                            <div className="lg-right md-right sm-center">
                                {this._renderHeader(Key.Organization)}
                                {_.map(sectionNameToLinks[Key.Organization], this._renderMenuItem.bind(this))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private _renderIcon(fileName: string): React.ReactNode {
        return (
            <div style={{ height: ICON_DIMENSION, width: ICON_DIMENSION }}>
                <img src={`/images/social/${fileName}`} style={{ width: ICON_DIMENSION }} />
            </div>
        );
    }
    private _renderMenuItem(link: ALink): React.ReactNode {
        const titleToIcon: { [title: string]: string } = {
            [this.props.translate.get(Key.Discord, Deco.Cap)]: 'discord.png',
            [this.props.translate.get(Key.Blog, Deco.Cap)]: 'medium.png',
            Twitter: 'twitter.png',
            Reddit: 'reddit.png',
            [this.props.translate.get(Key.Forum, Deco.Cap)]: 'discourse.png',
        };
        const iconIfExists = titleToIcon[link.title];
        return (
            <div key={link.title} className="sm-center" style={{ fontSize: 13, paddingTop: 25 }}>
                <Link
                    to={link.to}
                    shouldOpenInNewTab={link.shouldOpenInNewTab}
                    fontColor={colors.white}
                    className="text-decoration-none"
                >
                    <div>
                        {iconIfExists !== undefined ? (
                            <div className="inline-block">
                                <div className="pr1 table-cell">{this._renderIcon(iconIfExists)}</div>
                                <div className="table-cell">{link.title}</div>
                            </div>
                        ) : (
                            link.title
                        )}
                    </div>
                </Link>
            </div>
        );
    }
    private _renderHeader(key: Key): React.ReactNode {
        const headerStyle = {
            color: colors.grey400,
            letterSpacing: 2,
            fontFamily: 'Roboto Mono',
            fontSize: 13,
        };
        return (
            <div className="lg-pb2 md-pb2 sm-pt4" style={headerStyle}>
                {this.props.translate.get(key, Deco.Upper)}
            </div>
        );
    }
    private _updateLanguage(_event: any, _index: number, value: Language): void {
        this.setState({
            selectedLanguage: value,
        });
        this.props.dispatcher.updateSelectedLanguage(value);
    }
}
