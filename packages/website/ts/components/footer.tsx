import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { WebsitePaths } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { constants } from 'ts/utils/constants';

interface MenuItemsBySection {
    [sectionName: string]: FooterMenuItem[];
}

interface FooterMenuItem {
    title: string;
    path?: string;
    isExternal?: boolean;
}

enum Sections {
    Documentation = 'Documentation',
    Community = 'Community',
    Organization = 'Organization',
}

const ICON_DIMENSION = 16;
const menuItemsBySection: MenuItemsBySection = {
    Documentation: [
        {
            title: '0x.js',
            path: WebsitePaths.ZeroExJs,
        },
        {
            title: '0x Smart Contracts',
            path: WebsitePaths.SmartContracts,
        },
        {
            title: '0x Connect',
            path: WebsitePaths.Connect,
        },
        {
            title: 'Whitepaper',
            path: WebsitePaths.Whitepaper,
            isExternal: true,
        },
        {
            title: 'Wiki',
            path: WebsitePaths.Wiki,
        },
        {
            title: 'FAQ',
            path: WebsitePaths.FAQ,
        },
    ],
    Community: [
        {
            title: 'Rocket.chat',
            isExternal: true,
            path: constants.URL_ZEROEX_CHAT,
        },
        {
            title: 'Blog',
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
            title: 'Forum',
            isExternal: true,
            path: constants.URL_DISCOURSE_FORUM,
        },
    ],
    Organization: [
        {
            title: 'About',
            isExternal: false,
            path: WebsitePaths.About,
        },
        {
            title: 'Careers',
            isExternal: true,
            path: constants.URL_ANGELLIST,
        },
        {
            title: 'Contact',
            isExternal: true,
            path: 'mailto:team@0xproject.com',
        },
    ],
};
const linkStyle = {
    color: colors.white,
    cursor: 'pointer',
};

const titleToIcon: { [title: string]: string } = {
    'Rocket.chat': 'rocketchat.png',
    Blog: 'medium.png',
    Twitter: 'twitter.png',
    Reddit: 'reddit.png',
    Forum: 'discourse.png',
};

export interface FooterProps {}

interface FooterState {}

export class Footer extends React.Component<FooterProps, FooterState> {
    public render() {
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
                        </div>
                    </div>
                    <div className="col lg-col-8 md-col-8 col-12 lg-pl4 md-pl4">
                        <div className="col lg-col-4 md-col-4 col-12">
                            <div className="lg-right md-right sm-center">
                                {this._renderHeader(Sections.Documentation)}
                                {_.map(menuItemsBySection[Sections.Documentation], this._renderMenuItem.bind(this))}
                            </div>
                        </div>
                        <div className="col lg-col-4 md-col-4 col-12 lg-pr2 md-pr2">
                            <div className="lg-right md-right sm-center">
                                {this._renderHeader(Sections.Community)}
                                {_.map(menuItemsBySection[Sections.Community], this._renderMenuItem.bind(this))}
                            </div>
                        </div>
                        <div className="col lg-col-4 md-col-4 col-12">
                            <div className="lg-right md-right sm-center">
                                {this._renderHeader(Sections.Organization)}
                                {_.map(menuItemsBySection[Sections.Organization], this._renderMenuItem.bind(this))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private _renderIcon(fileName: string) {
        return (
            <div style={{ height: ICON_DIMENSION, width: ICON_DIMENSION }}>
                <img src={`/images/social/${fileName}`} style={{ width: ICON_DIMENSION }} />
            </div>
        );
    }
    private _renderMenuItem(item: FooterMenuItem) {
        const iconIfExists = titleToIcon[item.title];
        return (
            <div key={item.title} className="sm-center" style={{ fontSize: 13, paddingTop: 25 }}>
                {item.isExternal ? (
                    <a className="text-decoration-none" style={linkStyle} target="_blank" href={item.path}>
                        {!_.isUndefined(iconIfExists) ? (
                            <div className="sm-mx-auto" style={{ width: 65 }}>
                                <div className="flex">
                                    <div className="pr1">{this._renderIcon(iconIfExists)}</div>
                                    <div>{item.title}</div>
                                </div>
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
    private _renderHeader(title: string) {
        const headerStyle = {
            textTransform: 'uppercase',
            color: colors.grey400,
            letterSpacing: 2,
            fontFamily: 'Roboto Mono',
            fontSize: 13,
        };
        return (
            <div className="lg-pb2 md-pb2 sm-pt4" style={headerStyle}>
                {title}
            </div>
        );
    }
}
