import * as React from 'react';
import styled from 'styled-components';
import { colors, media } from '../variables';

import { withContext, Props } from './withContext';
import { Alpha, Beta, Gamma } from './Typography';
import Container from './Container';
import Code from './Code';

import ExactLocation from 'ts/icons/exact-location.svg';
import NoLocation from 'ts/icons/no-location.svg';
import TimeConsuming from 'ts/icons/time-consuming.svg';
import TimeSaving from 'ts/icons/time-saving.svg';

interface TraceProps {
    background?: string;
}

function Trace(props: Props) {
    const { colors } = props;

    return (
        <StyledSection background={colors.secondary}>
            <Wrapper>
                <Block>
                    <Alpha>The Issue</Alpha>
                    <MainCopy as="p">
                        Every time an Ethereum transaction fails, it's extremely hard to trace down the troublemaking
                        line of code. The only hint you'll get is a generic error.
                    </MainCopy>
                    <Code>Error: VM Exception while processing transaction: rever</Code>

                    <List>
                        <Item>
                            <Copy>
                                <Gamma as="h3">No location</Gamma>
                                <p>
                                    The error basically says "anything could have gone wrong here", which keeps you
                                    completely in the dark about its exact location.
                                </p>
                            </Copy>
                            <NoLocation />
                        </Item>

                        <Item>
                            <Copy>
                                <Gamma as="h3">Time-consuming</Gamma>
                                <p>
                                    Working with a large code-base that contains hundreds of smart contracts, finding
                                    the failing line of code quickly becomes a daunting task.
                                </p>
                            </Copy>
                            <TimeConsuming />
                        </Item>
                    </List>
                </Block>

                <Block background={colors.secondary}>
                    <Alpha>The Fix</Alpha>
                    <MainCopy as="p">
                        Sol-trace will give you full stack traces, including contract names, line numbers and code
                        snippets, every time you encounter an error.
                    </MainCopy>
                    <Code>Error: VM Exception while processing transaction: rever</Code>

                    <List>
                        <Item>
                            <Copy>
                                <Gamma as="h3">Exact location</Gamma>
                                <p>
                                    It shows you the exact location of the specific code linen and where it was called
                                    from.
                                </p>
                            </Copy>
                            <ExactLocation />
                        </Item>

                        <Item>
                            <Copy>
                                <Gamma as="h3">Time-saving</Gamma>
                                <p>
                                    Turning "Your code failed somewhere, good luck debugging it" into "Your code failed
                                    on linen X of contract Y", it drastically improves the developer experience.
                                </p>
                            </Copy>
                            <TimeSaving />
                        </Item>
                    </List>
                </Block>
            </Wrapper>
        </StyledSection>
    );
}

const StyledSection =
    styled.section <
    TraceProps >
    `
    max-width: 90rem;
    margin: 0 auto;
    background: linear-gradient(to right, ${colors.black} 50%, ${props => props.background} 50%);
    padding-top: 6.25rem;
    padding-bottom: 5.25rem;
    
    ${media.small`background: none`};
`;

const Wrapper = styled(Container)`
    display: flex;

    ${Alpha} {
        padding-bottom: 2.5rem;

        ${media.small`padding-bottom: 1.875rem;`};
    }

    ${media.small`
        display: block;
        width: 100%;
    `};
`;

const Block =
    styled.div <
    TraceProps >
    `
    width: 50%;
    background: ${props => (props.background ? props.background : colors.black)};
    color: ${props => (props.background ? 'inherit' : colors.white)};

    :first-of-type {
        padding-right: 6.25rem;
    }
    :last-of-type {
        padding-left: 6.25rem;
    }

    ${media.small`
        width: 100%;
        padding-top: 2.5rem;
        padding-bottom: 3.4375rem;

        :first-of-type {
            padding-left: 1.875rem;
            padding-right: 1.875rem;
        }
        :last-of-type {
            padding-left: 1.875rem;
            padding-right: 1.875rem;
        }
    `};
`;

const MainCopy = styled(Beta)`
    margin-bottom: 3.1875rem;
    ${media.small`
        margin-bottom: 1.125rem;
        font-size: 1rem;
    `};
`;

const List = styled.ul`
    margin-top: 6.25rem;
    margin-bottom: 0;
    padding: 0;

    ${media.small`margin-top: 3.4375rem;`};
`;

const Item = styled.li`
    display: flex;
    align-items: center;

    :not(:last-child) {
        margin-bottom: 4.4375rem;

        ${media.small`margin-bottom: 3.4375rem;`};
    }
`;

const Copy = styled.div`
    max-width: 20rem;
    margin-right: 5.875rem;

    ${media.small`margin-right: 2.0625rem;`};
`;

export default withContext(Trace);
