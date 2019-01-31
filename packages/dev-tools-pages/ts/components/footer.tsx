import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { context as compiler } from 'ts/context/compiler';
import { context as coverage } from 'ts/context/coverage';
import { context as profiler } from 'ts/context/profiler';
import { context as trace } from 'ts/context/trace';
import MainIcon from 'ts/icons/logos/0x.svg';
import { media } from 'ts/variables';

import { Container } from './container';
import { Alpha, Beta } from './typography';

const tools = [trace, coverage, compiler, profiler];

const Footer: React.StatelessComponent<{}> = () => (
    <StyledFooter>
        <Container>
            <Top>
                <Alpha>Other tools by 0x</Alpha>
                <List>
                    {_.map(tools, ({ title, subtitle, icon, name }) => (
                        <ListItem key={title}>
                            <ListLink href={`https://sol-${name}.com`}>
                                <Icon as={icon as 'svg'} />
                                <div>
                                    <Beta>{title}</Beta>
                                    <p>{subtitle}</p>
                                </div>
                            </ListLink>
                        </ListItem>
                    ))}
                </List>
            </Top>
            <Media as="aside">
                <Icon as={MainIcon} />
                <Small>
                    0x is an open, permissionless protocol allowing for tokens to be traded on the Ethereum blockchain.
                    Interested in joining our team?{' '}
                    <a href="https://0x.org/careers" target="_blank">
                        We're hiring
                    </a>
                </Small>
            </Media>
        </Container>
    </StyledFooter>
);

const StyledFooter = styled.footer`
    background-color: ${props => props.theme.colors.secondary};
    padding-top: 6.25rem;
    padding-bottom: 5.4375rem;

    ${media.small`padding-top: 2.5rem;`};
`;

const Top = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 9.375rem;

    ${media.medium`
        display: block;
        margin-bottom: 5.3125rem;
    `};

    ${Alpha} {
        ${media.medium`margin-bottom: 3.8125rem;`};
    }
`;

const Icon = styled.div`
    margin-right: 1.3125rem;
    flex-shrink: 0;
    ${media.small`margin-right: 0.9375rem`};
`;

const Media = styled.div`
    display: flex;
    align-items: center;

    ${Icon} {
        margin-top: 0.5rem;
        align-self: flex-start;
    }
`;

const List = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    width: 66.693548387%;
    display: flex;
    flex-wrap: wrap;

    ${media.medium`
        width: 100%;
    `};

    ${media.small`
        display: block;
    `};
`;

const ListItem = styled.li`
    margin-bottom: 3.3125rem;
    padding-right: 1rem;
    flex-basis: 50%;
    :nth-last-of-type(-n + 2) {
        margin-bottom: 0;

        ${media.small`margin-bottom: 1.875rem`};
    }

    ${media.small`
        margin-bottom: 1.875rem
        :last-of-type {
            margin-bottom: 0;
        }
    `};
`;

const ListLink = styled.a`
    display: flex;
    align-items: center;
    :hover {
        color: ${props => props.theme.colors.dark};
    }
`;

const Small = styled.small`
    font-size: 1em;
    max-width: 37.5rem;
`;

export { Footer };
