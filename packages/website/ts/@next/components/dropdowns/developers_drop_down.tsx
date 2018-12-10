import { ALink, Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { colors } from 'ts/style/colors';
import { Container } from 'ts/components/ui/container';
import { DropDown } from 'ts/components/ui/drop_down';
import { Heading, Paragraph } from 'ts/@next/components/text';
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
        title: Key.UseNetworkedLiquidity,
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
        title: Key.Wiki,
        to: WebsitePaths.Wiki,
    },
    {
        title: Key.Github,
        to: constants.URL_GITHUB_ORG,
        shouldOpenInNewTab: true,
    },
    {
        title: Key.Whitepaper,
        to: WebsitePaths.Whitepaper,
        shouldOpenInNewTab: true,
    },
];

interface DevelopersDropDownProps {
    location: Location;
}

interface DevelopersDropDownState {}

export class DevelopersDropDown extends React.Component<DevelopersDropDownProps, DevelopersDropDownState> {
    public render(): React.ReactNode {
        const activeNode = (
            <Paragraph isNoMargin={true}>
                Developers
            </Paragraph>
        );
        return (
            <DropDown
                activeNode={activeNode}
                popoverContent={this._renderDropdownMenu()}
                anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                popoverStyle={{ borderRadius: 0, width: 420, height: 377, marginTop: 0 }}
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
                <Link to={WebsitePaths.Docs} fontColor={colors.brandLight}>
                    <Container
                        padding="0.9rem"
                        backgroundColor={colors.white}
                        borderBottomLeftRadius={4}
                        borderBottomRightRadius={4}
                    >
                        <Paragraph color={colors.brandLight} isCentered={true} isNoMargin={true}>
                            View all documentation
                        </Paragraph>
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
            // const linkText = this.props.translate.get(link.title as Key, Deco.Cap);
            const linkText = link.title;
            return (
                <Container className={`pr1 pt1 ${!isLast && 'pb1'}`} key={`dev-dropdown-link-${link.title}`}>
                    <Link to={to} shouldOpenInNewTab={!!link.shouldOpenInNewTab}>
                        <Paragraph size="small" color={colors.brandDark} isNoMargin={true}>
                            {linkText}
                        </Paragraph>
                    </Link>
                </Container>
            );
        });
        return (
            <Container>
                <Container height="33px">
                    {!_.isEmpty(title) && (
                        <Heading asElement="h3" size="small">
                            {title}
                        </Heading>
                    )}
                </Container>
                {renderLinks}
            </Container>
        );
    }
}
