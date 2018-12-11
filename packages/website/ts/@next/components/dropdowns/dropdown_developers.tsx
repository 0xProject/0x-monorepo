import * as _ from 'lodash';
import * as React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import styled, {withTheme} from 'styled-components';

import {Link} from 'ts/@next/components/button';
import {Column, Wrap, WrapGrid} from 'ts/@next/components/layout';
import {Heading} from 'ts/@next/components/text';
import {GlobalStyle} from 'ts/@next/constants/globalStyle';

interface Props {
    theme: GlobalStyle;
}

const introData = [
    {
        label: 'Build a relayer',
        url: '#',
    },
    {
        label: 'Develop on Ethereum',
        url: '#',
    },
    {
        label: 'Make & take orders',
        url: '#',
    },
    {
        label: 'Use networked liquidity',
        url: '#',
    },
];

const docsData = [
    {
        label: '0x.js',
        url: '#',
    },
    {
        label: '0x Connect',
        url: '#',
    },
    {
        label: 'Smart Contract',
        url: '#',
    },
];

const linksData = [
    {
        label: 'Wiki',
        url: '#',
    },
    {
        label: 'Github',
        url: '#',
    },
    {
        label: 'Whitepaper',
        url: '#',
    },
];

export const DropdownDevelopers = withTheme((props: Props) => (
    <>
        <DropdownWrap>
            <div>
                <Heading asElement="h4" size={14} color="inherit" isMuted={0.35}>
                    Getting Started
                </Heading>

                <WrapGrid isCentered={false} isWrapped={true}>
                    {_.map(introData, (item, index) => (
                        <RouterLink to={item.url}>
                            {item.label}
                        </RouterLink>
                    ))}
                </WrapGrid>
            </div>

            <StyledWrap>
                <Column colWidth="1/2" isNoPadding={true}>
                    <Heading asElement="h4" size={14} color="inherit" isMuted={0.35}>
                        Popular Docs
                    </Heading>

                    <ul>
                        {_.map(docsData, (item, index) => (
                            <li>
                                <RouterLink to={item.url}>
                                    {item.label}
                                </RouterLink>
                            </li>
                        ))}
                    </ul>
                </Column>

                <Column colWidth="1/2" isNoPadding={true}>
                    <Heading asElement="h4" size={14} color="inherit" isMuted={0.35}>
                        Useful Links
                    </Heading>

                    <ul>
                        {_.map(linksData, (item, index) => (
                            <li>
                                <RouterLink to={item.url}>
                                    {item.label}
                                </RouterLink>
                            </li>
                        ))}
                    </ul>
                </Column>
            </StyledWrap>

            <StyledLink to="#" bgColor={props.theme.dropdownButtonBg} isAccentColor={true} isNoBorder={true}>
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
`;

const StyledWrap = styled(Wrap)`
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
        left:0;
    }
`;

const StyledLink = styled(Link)`
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
`;
