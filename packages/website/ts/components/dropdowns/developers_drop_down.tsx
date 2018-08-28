import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { DropDown } from 'ts/components/ui/drop_down';
import { Deco, Key, ObjectMap, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

interface LinkInfo {
    link: string;
    shouldOpenNewTab: boolean;
}

const gettingStartedKeyToLinkInfo1: ObjectMap<LinkInfo> = {
    [Key.BuildARelayer]: {
        link: `${WebsitePaths.Wiki}#Build-A-Relayer`,
        shouldOpenNewTab: false,
    },
    [Key.IntroTutorial]: {
        link: `${WebsitePaths.Wiki}#Create,-Validate,-Fill-Order`,
        shouldOpenNewTab: false,
    },
};
const gettingStartedKeyToLinkInfo2: ObjectMap<LinkInfo> = {
    [Key.TradingTutorial]: {
        link: `${WebsitePaths.Wiki}#Find,-Submit,-Fill-Order-From-Relayer`,
        shouldOpenNewTab: false,
    },
    [Key.EthereumDevelopment]: {
        link: `${WebsitePaths.Wiki}#Ethereum-Development`,
        shouldOpenNewTab: false,
    },
};
const popularDocsToLinkInfos: ObjectMap<LinkInfo> = {
    [Key.ZeroExJs]: {
        link: WebsitePaths.ZeroExJs,
        shouldOpenNewTab: false,
    },
    [Key.Connect]: {
        link: WebsitePaths.Connect,
        shouldOpenNewTab: false,
    },
    [Key.SmartContract]: {
        link: WebsitePaths.SmartContracts,
        shouldOpenNewTab: false,
    },
};
const usefulLinksToLinkInfo: ObjectMap<LinkInfo> = {
    [Key.Github]: {
        link: constants.URL_GITHUB_ORG,
        shouldOpenNewTab: true,
    },
    [Key.Whitepaper]: {
        link: WebsitePaths.Whitepaper,
        shouldOpenNewTab: true,
    },
    [Key.Sandbox]: {
        link: constants.URL_SANDBOX,
        shouldOpenNewTab: true,
    },
};

interface DevelopersDropDownProps {
    translate: Translate;
    menuItemStyles: React.CSSProperties;
    menuIconStyle: React.CSSProperties;
}

interface DevelopersDropDownState {}

export class DevelopersDropDown extends React.Component<DevelopersDropDownProps, DevelopersDropDownState> {
    public render(): React.ReactNode {
        const activeNode = (
            <Container

            />
            <div className="flex relative" style={{ color: this.props.menuIconStyle.color }}>
                <div style={{ paddingRight: 10 }}>{this.props.translate.get(Key.Developers, Deco.Cap)}</div>
            </div>
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
                <div style={{ padding: '1.75rem' }}>
                    {this._renderTitle('Getting started')}
                    <div className="flex">
                        <div className="pr4 mr2">{this._renderLinkSection(gettingStartedKeyToLinkInfo1)}</div>
                        <div>{this._renderLinkSection(gettingStartedKeyToLinkInfo2)}</div>
                    </div>
                </div>
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
                <div
                    style={{
                        padding: '1.125rem',
                        textAlign: 'center',
                        backgroundColor: colors.lightBgGrey,
                        borderBottomLeftRadius: 4,
                        borderBottomRightRadius: 4,
                    }}
                >
                    <Link
                        to={WebsitePaths.ZeroExJs/* TODO: Update once we have overview page */}
                        className="text-decoration-none"
                        style={{
                            color: colors.lightBlueA700,
                            fontWeight: 'bold',
                            fontSize: 14,
                        }}
                    >
                        VIEW ALL DOCUMENTATION
                    </Link>
                </div>
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
    private _renderLinkSection(keyToLinkInfo: ObjectMap<LinkInfo>): React.ReactNode {
        const linkStyle: React.CSSProperties = {
            color: colors.lightBlueA700,
            fontFamily: 'Roboto, Roboto Mono',
        };
        const numLinks = _.size(keyToLinkInfo);
        let i = 0;
        const links = _.map(keyToLinkInfo, (linkInfo: LinkInfo, key: string) => {
            i++;
            const isLast = i === numLinks;
            const linkText = this.props.translate.get(key as Key, Deco.CapWords);
            return (
                <div className={`pr1 pt1 ${!isLast && 'pb1'}`} key={`dev-dropdown-link-${key}`}>
                    {linkInfo.shouldOpenNewTab ? (
                        <a target="_blank" className="text-decoration-none" style={linkStyle} href={linkInfo.link}>
                            {linkText}
                        </a>
                    ) : (
                        <Link to={linkInfo.link} className="text-decoration-none" style={linkStyle}>
                            {linkText}
                        </Link>
                    )}
                </div>
            );
        });
        return <div>{links}</div>;
    }
}
