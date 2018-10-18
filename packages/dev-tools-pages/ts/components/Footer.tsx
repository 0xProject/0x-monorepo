import * as React from 'react';
import styled from 'styled-components';

import { Alpha, Beta } from './Typography';
import { withContext, Props } from './withContext';
import Container from './Container';

import MainIcon from 'ts/icons/logos/0x.svg';
import compiler from 'ts/context/compiler';
import cov from 'ts/context/cov';
import profiler from 'ts/context/profiler';
import trace from 'ts/context/trace';

const tools = [trace, cov, compiler, profiler];

function Footer(props: Props) {
    const { colors } = props;

    return (
        <StyledFooter background={colors.secondary}>
            <Container>
                <Top>
                    <Alpha>Other tools by 0x</Alpha>
                    <List>
                        {tools.map(({ title, subtitle, icon }) => (
                            <ListItem as="li" key={title}>
                                <Icon as={icon} />
                                <div>
                                    <Beta>{title}</Beta>
                                    <p>{subtitle}</p>
                                </div>
                            </ListItem>
                        ))}
                    </List>
                </Top>
                <Media as="aside">
                    <Icon as={MainIcon} />
                    <Small>
                        Built by 0x. 0x is an open, permissionless protocol allowing for ERC20 tokens to be traded on
                        the Ethereum blockchain.
                    </Small>
                </Media>
            </Container>
        </StyledFooter>
    );
}

const StyledFooter = styled.footer`
    background-color: ${(props: { background: string }) => props.background};
    padding-top: 6.25rem;
    padding-bottom: 5.4375rem;
`;

const Top = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 9.375rem;
`;

const Media = styled.div`
    display: flex;
    align-items: center;
`;

const Icon = styled.div`
    margin-right: 1.3125rem;
`;

const List = styled.ul`
    display: flex;
    width: 66.693548387%;
    flex-wrap: wrap;
    flex-direction: row;
    margin: 0;
    padding: 0;
`;

const ListItem = styled(Media)`
    flex-basis: 50%;
    margin-bottom: 3.3125rem;
    :nth-last-of-type(-n + 2) {
        margin-bottom: 0;
    }
`;

const Small = styled.small`
    font-size: 1em;
    max-width: 37.5rem;
`;

export default withContext(Footer);
