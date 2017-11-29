import * as _ from 'lodash';
import * as React from 'react';
import {
  Link,
} from 'react-router-dom';
import {HashLink} from 'react-router-hash-link';
import {
    Link as ScrollLink,
} from 'react-scroll';
import {Styles, WebsitePaths} from 'ts/types';
import {constants} from 'ts/utils/constants';

interface MenuItemsBySection {
    [sectionName: string]: FooterMenuItem[];
}

interface FooterMenuItem {
    title: string;
    path?: string;
    isExternal?: boolean;
    fileName?: string;
}

enum Sections {
    Documentation = 'Documentation',
    Community = 'Community',
    Organization = 'Organization',
}

const ICON_DIMENSION = 16;
const CUSTOM_DARK_GRAY = '#393939';
const CUSTOM_LIGHT_GRAY = '#CACACA';
const CUSTOM_LIGHTEST_GRAY = '#9E9E9E';
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
            path: constants.ZEROEX_CHAT_URL,
            fileName: 'rocketchat.png',
        },
        {
            title: 'Blog',
            isExternal: true,
            path: constants.BLOG_URL,
            fileName: 'medium.png',
        },
        {
            title: 'Twitter',
            isExternal: true,
            path: constants.TWITTER_URL,
            fileName: 'twitter.png',
        },
        {
            title: 'Reddit',
            isExternal: true,
            path: constants.REDDIT_URL,
            fileName: 'reddit.png',
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
            path: constants.ANGELLIST_URL,
        },
        {
            title: 'Contact',
            isExternal: true,
            path: 'mailto:team@0xproject.com',
        },
    ],
};
const linkStyle = {
    color: 'white',
    cursor: 'pointer',
};

const titleToIcon: {[title: string]: string} = {
    'Rocket.chat': 'rocketchat.png',
    'Blog': 'medium.png',
    'Twitter': 'twitter.png',
    'Reddit': 'reddit.png',
};

export interface FooterProps {
    location: Location;
}

interface FooterState {}

export class Footer extends React.Component<FooterProps, FooterState> {
    public render() {
        return (
            <div className="relative pb4 pt2" style={{backgroundColor: CUSTOM_DARK_GRAY}}>
                <div className="mx-auto max-width-4 md-px2 lg-px0 py4 clearfix" style={{color: 'white'}}>
                    <div className="col lg-col-4 md-col-4 col-12 left">
                        <div className="sm-mx-auto" style={{width: 148}}>
                            <div>
                                <img src="/images/protocol_logo_white.png" height="30" />
                            </div>
                            <div style={{fontSize: 11, color: CUSTOM_LIGHTEST_GRAY, paddingLeft: 37, paddingTop: 2}}>
                                © ZeroEx, Intl.
                            </div>
                        </div>
                    </div>
                    <div className="col lg-col-8 md-col-8 col-12 lg-pl4 md-pl4">
                        <div className="col lg-col-4 md-col-4 col-12">
                            <div className="lg-right md-right sm-center">
                                {this.renderHeader(Sections.Documentation)}
                                {_.map(menuItemsBySection[Sections.Documentation], this.renderMenuItem.bind(this))}
                            </div>
                        </div>
                        <div className="col lg-col-4 md-col-4 col-12 lg-pr2 md-pr2">
                            <div className="lg-right md-right sm-center">
                                {this.renderHeader(Sections.Community)}
                                {_.map(menuItemsBySection[Sections.Community], this.renderMenuItem.bind(this))}
                            </div>
                        </div>
                        <div className="col lg-col-4 md-col-4 col-12">
                            <div className="lg-right md-right sm-center">
                                {this.renderHeader(Sections.Organization)}
                                {_.map(menuItemsBySection[Sections.Organization], this.renderMenuItem.bind(this))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private renderIcon(fileName: string) {
        return (
            <div style={{height: ICON_DIMENSION, width: ICON_DIMENSION}}>
                <img src={`/images/social/${fileName}`} style={{width: ICON_DIMENSION}} />
            </div>
        );
    }
    private renderMenuItem(item: FooterMenuItem) {
        const iconIfExists = titleToIcon[item.title];
        return (
            <div
                key={item.title}
                className="sm-center"
                style={{fontSize: 13, paddingTop: 25}}
            >
                {item.isExternal ?
                    <a
                        className="text-decoration-none"
                        style={linkStyle}
                        target="_blank"
                        href={item.path}
                    >
                        {!_.isUndefined(iconIfExists) ?
                            <div className="sm-mx-auto" style={{width: 65}}>
                                <div className="flex">
                                    <div className="pr1">
                                        {this.renderIcon(iconIfExists)}
                                    </div>
                                    <div>{item.title}</div>
                                </div>
                            </div> :
                            item.title
                        }
                    </a> :
                    <Link
                        to={item.path}
                        style={linkStyle}
                        className="text-decoration-none"
                    >
                        <div>
                            {!_.isUndefined(iconIfExists) &&
                                <div className="pr1">
                                    {this.renderIcon(iconIfExists)}
                                </div>
                            }
                            {item.title}
                        </div>
                    </Link>
                }
            </div>
        );
    }
    private renderHeader(title: string) {
        const headerStyle = {
            textTransform: 'uppercase',
            color: CUSTOM_LIGHT_GRAY,
            letterSpacing: 2,
            fontFamily: 'Roboto Mono',
            fontSize: 13,
        };
        return (
            <div
                className="lg-pb2 md-pb2 sm-pt4"
                style={headerStyle}
            >
                {title}
            </div>
        );
    }
    private renderHomepageLink(title: string) {
        const hash = title.toLowerCase();
        if (this.props.location.pathname === WebsitePaths.Home) {
            return (
                <ScrollLink
                    style={linkStyle}
                    to={hash}
                    smooth={true}
                    offset={0}
                    duration={constants.HOME_SCROLL_DURATION_MS}
                    containerId="home"
                >
                    {title}
                </ScrollLink>
            );
        } else {
            return (
                <HashLink
                    to={`/#${hash}`}
                    className="text-decoration-none"
                    style={linkStyle}
                >
                    {title}
                </HashLink>
            );
        }
    }
}
