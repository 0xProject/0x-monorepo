import { ALink, colors, Link, LinkType } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { DropDown } from 'ts/components/ui/drop_down';
import { Text } from 'ts/components/ui/text';
import { Deco, Key, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

const gettingStartedKeyToLinkInfo1: ALink[] = [
    {
        title: Key.BuildARelayer,
        to: `${WebsitePaths.Wiki}#Build-A-Relayer`,
    },
    {
        title: Key.OrderBasics,
        to: `${WebsitePaths.Wiki}#Create,-Validate,-Fill-Order`,
    },
];
const gettingStartedKeyToLinkInfo2: ALink[] = [
    {
        title: Key.DevelopOnEthereum,
        to: `${WebsitePaths.Wiki}#Ethereum-Development`,
    },
    {
        title: Key.UseSharedLiquidity,
        to: `${WebsitePaths.Wiki}#Find,-Submit,-Fill-Order-From-Relayer`,
    },
];
const popularDocsToLinkInfos: ALink[] = [
    {
        title: Key.ZeroExJs,
        to: WebsitePaths.ZeroExJs,
    },
    {
        title: Key.Connect,
        to: WebsitePaths.Connect,
    },
    {
        title: Key.SmartContract,
        to: WebsitePaths.SmartContracts,
    },
];
const usefulLinksToLinkInfo: ALink[] = [
    {
        title: Key.Github,
        to: constants.URL_GITHUB_ORG,
        type: LinkType.External,
        shouldOpenInNewTab: true,
    },
    {
        title: Key.Whitepaper,
        to: WebsitePaths.Whitepaper,
        type: LinkType.External,
        shouldOpenInNewTab: true,
    },
    {
        title: Key.Sandbox,
        to: constants.URL_SANDBOX,
        type: LinkType.External,
        shouldOpenInNewTab: true,
    },
];

interface DevelopersDropDownProps {
    location: Location;
    translate: Translate;
    menuItemStyles: React.CSSProperties;
    menuIconStyle: React.CSSProperties;
}

interface DevelopersDropDownState {}

export class DevelopersDropDown extends React.Component<DevelopersDropDownProps, DevelopersDropDownState> {
    public render(): React.ReactNode {
        const activeNode = (
            <Container className="flex relative" paddingRight="10">
                <Text fontColor={this.props.menuIconStyle.color}>
                    {this.props.translate.get(Key.Developers, Deco.Cap)}
                </Text>
            </Container>
        );
        return (
            <DropDown
                activeNode={activeNode}
                popoverContent={this._renderDropdownMenu()}
                anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                style={this.props.menuItemStyles}
                popoverStyle={{ borderRadius: 4, width: 427, height: 373, marginTop: 10 }}
            />
        );
    }
    private _renderDropdownMenu(): React.ReactNode {
        const dropdownMenu = (
            <div>
                <Container padding="1.75rem">
                    {this._renderTitle('Getting started')}
                    <div className="flex">
                        <div className="pr4 mr2">{this._renderLinkSection(gettingStartedKeyToLinkInfo1)}</div>
                        <div>{this._renderLinkSection(gettingStartedKeyToLinkInfo2)}</div>
                    </div>
                </Container>
                <div
                    style={{
                        width: '100%',
                        height: 1,
                        backgroundColor: colors.grey300,
                    }}
                />
                <div className="flex" style={{ padding: '1.75rem' }}>
                    <div className="pr4 mr2">
                        <div>{this._renderTitle('Popular docs')}</div>
                        <div>{this._renderLinkSection(popularDocsToLinkInfos)}</div>
                    </div>
                    <div>
                        <div>{this._renderTitle('Useful links')}</div>
                        <div>{this._renderLinkSection(usefulLinksToLinkInfo)}</div>
                    </div>
                </div>
                <Link
                    to={WebsitePaths.Docs}
                    style={{
                        color: colors.lightBlueA700,
                        fontWeight: 'bold',
                        fontSize: 14,
                    }}
                >
                    <div
                        style={{
                            padding: '0.9rem',
                            textAlign: 'center',
                            backgroundColor: colors.lightBgGrey,
                            borderBottomLeftRadius: 4,
                            borderBottomRightRadius: 4,
                        }}
                    >
                        {this.props.translate.get(Key.ViewAllDocumentation, Deco.Upper)}
                    </div>
                </Link>
            </div>
        );
        return dropdownMenu;
    }
    private _renderTitle(title: string): React.ReactNode {
        return (
            <div
                style={{
                    color: colors.linkSectionGrey,
                    fontSize: 14,
                    paddingBottom: 12,
                    fontWeight: 600,
                    letterSpacing: 1,
                }}
            >
                {title.toUpperCase()}
            </div>
        );
    }
    private _renderLinkSection(links: ALink[]): React.ReactNode {
        const linkStyle: React.CSSProperties = {
            color: colors.lightBlueA700,
            fontFamily: 'Roboto, Roboto Mono',
        };
        const numLinks = links.length;
        let i = 0;
        const renderLinks = _.map(links, (link: ALink) => {
            const isWikiLink = _.startsWith(link.to, WebsitePaths.Wiki) && _.includes(link.to, '#');
            const isOnWiki = this.props.location.pathname === WebsitePaths.Wiki;
            let to = link.to;
            let type = link.type;
            if (isWikiLink && isOnWiki) {
                to = `${link.to.split('#')[1]}`;
                type = LinkType.ReactScroll;
            }
            i++;
            const isLast = i === numLinks;
            const linkText = this.props.translate.get(link.title as Key, Deco.Cap);
            return (
                <div className={`pr1 pt1 ${!isLast && 'pb1'}`} key={`dev-dropdown-link-${link.title}`}>
                    <Link to={to} type={type} shouldOpenInNewTab={!!link.shouldOpenInNewTab} style={linkStyle}>
                        {linkText}
                    </Link>
                </div>
            );
        });
        return <div>{renderLinks}</div>;
    }
}
