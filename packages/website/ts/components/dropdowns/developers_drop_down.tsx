import * as _ from 'lodash';
import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { DropDown } from 'ts/components/ui/drop_down';
import { Text } from 'ts/components/ui/text';
import { ALink, Deco, Key, WebsiteLegacyPaths, WebsitePaths } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

import { Link } from '../documentation/shared/link';

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
        title: Key.UseNetworkedLiquidity,
        to: `${WebsitePaths.Wiki}#Find,-Submit,-Fill-Order-From-Relayer`,
    },
];
const popularDocsToLinkInfos: ALink[] = [
    {
        title: Key.ZeroExJs,
        to: WebsiteLegacyPaths.ZeroExJs,
    },
    {
        title: Key.Connect,
        to: WebsiteLegacyPaths.Connect,
    },
    {
        title: Key.SmartContract,
        to: WebsitePaths.SmartContracts,
    },
];
const usefulLinksToLinkInfo: ALink[] = [
    {
        title: Key.Wiki,
        to: WebsitePaths.Wiki,
    },
    {
        title: Key.Github,
        to: constants.URL_GITHUB_ORG,
        shouldOpenInNewTab: true,
    },
    {
        title: Key.ProtocolSpecification,
        to: constants.URL_PROTOCOL_SPECIFICATION,
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
                popoverStyle={{ borderRadius: 4, width: 397, height: 373, marginTop: 0 }}
            />
        );
    }
    private _renderDropdownMenu(): React.ReactNode {
        const sectionPadding = '26px';
        const dropdownMenu = (
            <Container>
                <Container className="flex" padding={sectionPadding}>
                    <Container paddingRight="45px">
                        {this._renderLinkSection(gettingStartedKeyToLinkInfo1, 'Getting started')}
                    </Container>
                    <Container>{this._renderLinkSection(gettingStartedKeyToLinkInfo2)}</Container>
                </Container>
                <Container width="100%" height="1px" backgroundColor={colors.grey300} />
                <Container className="flex" padding={sectionPadding}>
                    <Container paddingRight="62px">
                        <Container>{this._renderLinkSection(popularDocsToLinkInfos, 'Popular docs')}</Container>
                    </Container>
                    <Container>
                        <Container>{this._renderLinkSection(usefulLinksToLinkInfo, 'Useful links')}</Container>
                    </Container>
                </Container>
                <Link to={WebsitePaths.Docs} fontColor={colors.lightBlueA700}>
                    <Container
                        padding="0.9rem"
                        backgroundColor={colors.lightBgGrey}
                        borderBottomLeftRadius={4}
                        borderBottomRightRadius={4}
                    >
                        <Text fontColor={colors.lightBlueA700} fontWeight="bold" fontSize="14px" textAlign="center">
                            {this.props.translate.get(Key.ViewAllDocumentation, Deco.Upper)}
                        </Text>
                    </Container>
                </Link>
            </Container>
        );
        return dropdownMenu;
    }
    private _renderLinkSection(links: ALink[], title: string = ''): React.ReactNode {
        const numLinks = links.length;
        let i = 0;
        const renderLinks = _.map(links, (link: ALink) => {
            const isWikiLink = _.startsWith(link.to, WebsitePaths.Wiki) && _.includes(link.to, '#');
            const isOnWiki = this.props.location.pathname === WebsitePaths.Wiki;
            let to = link.to;
            if (isWikiLink && isOnWiki) {
                to = `${link.to.split('#')[1]}`;
            }
            i++;
            const isLast = i === numLinks;
            const linkText = this.props.translate.get(link.title as Key, Deco.Cap);
            return (
                <Container className={`pr1 pt1 ${!isLast && 'pb1'}`} key={`dev-dropdown-link-${link.title}`}>
                    <Link to={to} shouldOpenInNewTab={!!link.shouldOpenInNewTab}>
                        <Text fontFamily="Roboto, Roboto Mono" fontColor={colors.lightBlueA700}>
                            {linkText}
                        </Text>
                    </Link>
                </Container>
            );
        });
        return (
            <Container>
                <Container height="33px">
                    {!_.isEmpty(title) && (
                        <Text letterSpacing={1} fontColor={colors.linkSectionGrey} fontSize="14px" fontWeight={600}>
                            {title.toUpperCase()}
                        </Text>
                    )}
                </Container>
                {renderLinks}
            </Container>
        );
    }
}
