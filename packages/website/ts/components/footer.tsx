import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Deco, Key, Language, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

interface MenuItemsBySection {
    [sectionName: string]: FooterMenuItem[];
}

interface FooterMenuItem {
    title: string;
    path?: string;
    isExternal?: boolean;
}

const ICON_DIMENSION = 16;

const linkStyle = {
    color: colors.white,
    cursor: 'pointer',
};

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
}

interface FooterState {
    selectedLanguage: Language;
}

export class Footer extends React.Component<FooterProps, FooterState> {
    constructor(props: FooterProps) {
        super(props);
        this.state = {
            selectedLanguage: props.translate.getLanguage(),
        };
    }
    public render(): React.ReactNode {
        const menuItemsBySection: MenuItemsBySection = {
            [Key.Documentation]: [
                {
                    title: '0x.js',
                    path: WebsitePaths.ZeroExJs,
                },
                {
                    title: this.props.translate.get(Key.SmartContracts, Deco.Cap),
                    path: WebsitePaths.SmartContracts,
                },
                {
                    title: this.props.translate.get(Key.Connect, Deco.Cap),
                    path: WebsitePaths.Connect,
                },
                {
                    title: this.props.translate.get(Key.Whitepaper, Deco.Cap),
                    path: WebsitePaths.Whitepaper,
                    isExternal: true,
                },
                {
                    title: this.props.translate.get(Key.Wiki, Deco.Cap),
                    path: WebsitePaths.Wiki,
                },
                {
                    title: this.props.translate.get(Key.Faq, Deco.Cap),
                    path: WebsitePaths.FAQ,
                },
            ],
            [Key.Community]: [
                {
                    title: this.props.translate.get(Key.RocketChat, Deco.Cap),
                    isExternal: true,
                    path: constants.URL_ZEROEX_CHAT,
                },
                {
                    title: this.props.translate.get(Key.Blog, Deco.Cap),
                    isExternal: true,
                    path: constants.URL_BLOG,
                },
                {
                    title: 'Twitter',
                    isExternal: true,
                    path: constants.URL_TWITTER,
                },
                {
                    title: 'Reddit',
                    isExternal: true,
                    path: constants.URL_REDDIT,
                },
                {
                    title: this.props.translate.get(Key.Forum, Deco.Cap),
                    isExternal: true,
                    path: constants.URL_DISCOURSE_FORUM,
                },
            ],
            [Key.Organization]: [
                {
                    title: this.props.translate.get(Key.About, Deco.Cap),
                    isExternal: false,
                    path: WebsitePaths.About,
                },
                {
                    title: this.props.translate.get(Key.Careers, Deco.Cap),
                    isExternal: false,
                    path: WebsitePaths.Jobs,
                },
                {
                    title: this.props.translate.get(Key.Contact, Deco.Cap),
                    isExternal: true,
                    path: 'mailto:team@0xproject.com',
                },
            ],
        };
        const languageMenuItems = _.map(languageToMenuTitle, (menuTitle: string, language: Language) => {
            return <MenuItem key={menuTitle} value={language} primaryText={menuTitle} />;
        });
        return (
            <div className="relative pb4 pt2" style={{ backgroundColor: colors.darkerGrey }}>
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
                                {_.map(menuItemsBySection[Key.Documentation], this._renderMenuItem.bind(this))}
                            </div>
                        </div>
                        <div className="col lg-col-4 md-col-4 col-12 lg-pr2 md-pr2">
                            <div className="lg-right md-right sm-center">
                                {this._renderHeader(Key.Community)}
                                {_.map(menuItemsBySection[Key.Community], this._renderMenuItem.bind(this))}
                            </div>
                        </div>
                        <div className="col lg-col-4 md-col-4 col-12">
                            <div className="lg-right md-right sm-center">
                                {this._renderHeader(Key.Organization)}
                                {_.map(menuItemsBySection[Key.Organization], this._renderMenuItem.bind(this))}
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
    private _renderMenuItem(item: FooterMenuItem): React.ReactNode {
        const titleToIcon: { [title: string]: string } = {
            [this.props.translate.get(Key.RocketChat, Deco.Cap)]: 'rocketchat.png',
            [this.props.translate.get(Key.Blog, Deco.Cap)]: 'medium.png',
            Twitter: 'twitter.png',
            Reddit: 'reddit.png',
            [this.props.translate.get(Key.Forum, Deco.Cap)]: 'discourse.png',
        };
        const iconIfExists = titleToIcon[item.title];
        return (
            <div key={item.title} className="sm-center" style={{ fontSize: 13, paddingTop: 25 }}>
                {item.isExternal ? (
                    <a className="text-decoration-none" style={linkStyle} target="_blank" href={item.path}>
                        {!_.isUndefined(iconIfExists) ? (
                            <div className="inline-block">
                                <div className="pr1 table-cell">{this._renderIcon(iconIfExists)}</div>
                                <div className="table-cell">{item.title}</div>
                            </div>
                        ) : (
                            item.title
                        )}
                    </a>
                ) : (
                    <Link to={item.path} style={linkStyle} className="text-decoration-none">
                        <div>
                            {!_.isUndefined(iconIfExists) && (
                                <div className="pr1">{this._renderIcon(iconIfExists)}</div>
                            )}
                            {item.title}
                        </div>
                    </Link>
                )}
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
    private _updateLanguage(e: any, index: number, value: Language): void {
        this.setState({
            selectedLanguage: value,
        });
        this.props.dispatcher.updateSelectedLanguage(value);
    }
}
