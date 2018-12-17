import * as _ from 'lodash';
import * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import styled, { withTheme } from 'styled-components';

import { Button } from 'ts/@next/components/button';
import { Column, FlexWrap, WrapGrid } from 'ts/@next/components/newLayout';
import { ThemeValuesInterface } from 'ts/@next/components/siteWrap';
import { Heading } from 'ts/@next/components/text';
import { WebsitePaths } from 'ts/types';

interface Props {
    theme: ThemeValuesInterface;
}

const introData = [
    {
        label: 'Build a relayer',
        url: `${WebsitePaths.Wiki}#Build-A-Relayer`,
    },
    {
        label: 'Develop on Ethereum',
        url: `${WebsitePaths.Wiki}#Ethereum-Development`,
    },
    {
        label: 'Make & take orders',
        url: `${WebsitePaths.Wiki}#Create,-Validate,-Fill-Order`,
    },
    {
        label: 'Use networked liquidity',
        url: `${WebsitePaths.Wiki}#Find,-Submit,-Fill-Order-From-Relayer`,
    },
];

const docsData = [
    {
        label: '0x.js',
        url: WebsitePaths.ZeroExJs,
    },
    {
        label: '0x Connect',
        url: WebsitePaths.Connect,
    },
    {
        label: 'Smart Contract',
        url: WebsitePaths.SmartContracts,
    },
];

const linksData = [
    {
        label: 'Wiki',
        url: WebsitePaths.Wiki,
    },
    {
        label: 'Github',
        url: 'https://github.com/0xProject',
    },
    {
        label: 'Protocol specification',
        url: 'https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md',
    },
];

export const DropdownDevelopers: React.FunctionComponent<Props> = withTheme((props: Props) => (
    <>
        <DropdownWrap>
            <div>
                <Heading asElement="h4" size={14} color="inherit" marginBottom="15px" isMuted={0.35}>
                    Getting Started
                </Heading>

                <StyledGrid isCentered={false} isWrapped={true}>
                    {_.map(introData, (item, index) => (
                        <li>
                            <RouterLink key={`introLink-${index}`} to={item.url}>
                                {item.label}
                            </RouterLink>
                        </li>
                    ))}
                </StyledGrid>
            </div>

            <StyledWrap>
                <Column width="calc(100% - 15px)">
                    <Heading asElement="h4" size={14} color="inherit" marginBottom="15px" isMuted={0.35}>
                        Popular Docs
                    </Heading>

                    <ul>
                        {_.map(docsData, (item, index) => (
                            <li key={`docsLink-${index}`}>
                                <RouterLink to={item.url}>{item.label}</RouterLink>
                            </li>
                        ))}
                    </ul>
                </Column>

                <Column width="calc(100% - 15px)">
                    <Heading asElement="h4" size={14} color="inherit" marginBottom="15px" isMuted={0.35}>
                        Useful Links
                    </Heading>

                    <ul>
                        {_.map(linksData, (item, index) => (
                            <li key={`usefulLink-${index}`}>
                                <RouterLink to={item.url}>{item.label}</RouterLink>
                            </li>
                        ))}
                    </ul>
                </Column>
            </StyledWrap>

            <StyledLink
                to="https://0x.org/docs"
                bgColor={props.theme.dropdownButtonBg}
                isAccentColor={true}
                isNoBorder={true}
            >
                View All Documentation
            </StyledLink>
        </DropdownWrap>
    </>
));

const DropdownWrap = styled.div`
    padding: 15px 30px 75px 30px;

    a {
        color: inherit;
    }

    li {
        margin: 8px 0;
    }
`;

const StyledGrid = styled(WrapGrid.withComponent('ul'))`
    li {
        width: 50%;
        flex-shrink: 0;
    }
`;

const StyledWrap = styled(FlexWrap)`
    padding-top: 20px;
    margin-top: 30px;
    position: relative;

    &:before {
        content: '';
        width: 100%;
        height: 1px;
        background-color: ${props => props.theme.dropdownColor};
        opacity: 0.15;
        position: absolute;
        top: 0;
        left: 0;
    }
`;

const StyledLink = styled(Button)`
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
`;
