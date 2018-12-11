import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import {Link as RouterLink} from 'react-router-dom';
import {Link} from 'ts/@next/components/button';
import {Column, Wrap, WrapGrid} from 'ts/@next/components/layout';
import {Heading} from 'ts/@next/components/text';

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

export const DropdownDevelopers = () => (
    <>
        <DropdownWrap>
            <div>
                <Heading size={14} color="#5d5d5d">
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
                    <Heading size={14} color="#5d5d5d">
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
                    <Heading size={14} color="#5d5d5d">
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

            <StyledLink to="#" bgColor="#F3F6F4" isAccentColor={true} isNoBorder={true}>
                View All Documentation
            </StyledLink>
        </DropdownWrap>
    </>
);

const DropdownWrap = styled.div`
    padding: 15px 30px 75px 15px;
`;

const StyledWrap = styled(Wrap)`
    border-top: 1px solid #dadada;
    padding-top: 20px;
    margin-top: 30px;
`;

const StyledLink = styled(Link)`
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
`;
