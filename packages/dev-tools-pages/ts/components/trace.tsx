import * as React from 'react';
import styled from 'styled-components';

import { ContextInterface, ThemeContext } from 'ts/context';
import ExactLocation from 'ts/icons/exact-location.svg';
import NoLocation from 'ts/icons/no-location.svg';
import TimeConsuming from 'ts/icons/time-consuming.svg';
import TimeSaving from 'ts/icons/time-saving.svg';
import { colors, media } from 'ts/variables';

import { Breakout } from './breakout';
import { Code } from './code';
import { Container } from './container';
import { Alpha, Gamma, Lead } from './typography';

const Trace: React.StatelessComponent<{}> = () => (
    <ThemeContext.Consumer>
        {(props: ContextInterface) => (
            <StyledSection background={props.colors.secondary}>
                <Wrapper>
                    <Block>
                        <Alpha>The Issue</Alpha>
                        <MainCopy>
                            Every time an Ethereum transaction fails, it's extremely hard to trace down the
                            troublemaking line of code. The only hint you'll get is a generic error.
                        </MainCopy>
                        <Breakout>
                            <Code isLight={true}>Error: VM Exception while processing transaction: rever</Code>
                        </Breakout>

                        <List>
                            <Item>
                                <Copy dark={true}>
                                    <Gamma as="h3">No location</Gamma>
                                    <p>
                                        The error basically says "anything could have gone wrong here", which keeps you
                                        completely in the dark about its exact location.
                                    </p>
                                </Copy>
                                <Icon as={NoLocation} />
                            </Item>

                            <Item>
                                <Copy dark={true}>
                                    <Gamma as="h3">Time-consuming</Gamma>
                                    <p>
                                        Working with a large code-base that contains hundreds of smart contracts,
                                        finding the failing line of code quickly becomes a daunting task.
                                    </p>
                                </Copy>
                                <Icon as={TimeConsuming} />
                            </Item>
                        </List>
                    </Block>

                    <Block background={props.colors.secondary}>
                        <Alpha>The Fix</Alpha>
                        <MainCopy>
                            Sol-trace will give you full stack traces, including contract names, line numbers and code
                            snippets, every time you encounter an error.
                        </MainCopy>
                        <Breakout>
                            <Code isLight={true} language="javascript">
                                {`contracts/src/2.0.0/protocol/Exchange/MixinSignatureValidator.sol:51:8
    require(
        isValidSignature(
            hash,
            signerAddress,
            signature
        ),
        "INVALID_SIGNATURE"
    )`}
                            </Code>
                        </Breakout>

                        <List>
                            <Item>
                                <Copy>
                                    <Gamma as="h3">Exact location</Gamma>
                                    <p>
                                        It shows you the exact location of the specific code linen and where it was
                                        called from.
                                    </p>
                                </Copy>
                                <Icon as={ExactLocation} />
                            </Item>

                            <Item>
                                <Copy>
                                    <Gamma as="h3">Time-saving</Gamma>
                                    <p>
                                        Turning "Your code failed somewhere, good luck debugging it" into "Your code
                                        failed on line X of contract Y", it drastically improves the developer
                                        experience.
                                    </p>
                                </Copy>
                                <Icon as={TimeSaving} />
                            </Item>
                        </List>
                    </Block>
                </Wrapper>
            </StyledSection>
        )}
    </ThemeContext.Consumer>
);

interface TraceProps {
    background?: string;
}

const StyledSection = styled.section<TraceProps>`
    max-width: 90rem;
    margin: 0 auto;
    background: linear-gradient(to right, ${colors.black} 50%, ${props => props.background} 50%);
    overflow: hidden;
    ${media.large`
        background: none
        padding-top: 0;
        padding-bottom: 0;
    `};
`;

const Wrapper = styled(Container)`
    display: flex;

    ${Alpha} {
        padding-bottom: 2.5rem;

        ${media.small`padding-bottom: 1.875rem;`};
    }

    ${media.large`
        display: block;
        width: 100%;
    `};
`;

const Block = styled.div<TraceProps>`
    width: 50%;
    background: ${props => (props.background ? props.background : colors.black)};
    color: ${props => (props.background ? 'inherit' : colors.white)};
    padding-top: 6.25rem;
    padding-bottom: 5.25rem;

    :first-of-type {
        padding-right: 6.25rem;
    }
    :last-of-type {
        padding-left: 6.25rem;
    }

    ${media.xlarge`
        :first-of-type {
            padding-right: 2.5rem;
        }
        :last-of-type {
            padding-left: 2.5rem;
        }
    `}
    ${media.large`
        width: 100%;
        padding: 2.5rem;
    `}

    ${media.small`
        padding-left: 1.875rem;
        padding-right: 1.875rem;
    `};
`;

const MainCopy = styled(Lead)`
    margin-bottom: 3.1875rem;
    ${media.small`
        margin-bottom: 1.125rem;
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

const Copy = styled.div<{ dark: boolean }>`
    margin-right: 5.875rem;
    ${props =>
        props.dark &&
        `
        p {
            color: #ccc;
        }
    `}

    ${media.small`margin-right: 2.0625rem;`};
`;

const Icon = styled.div`
    flex-shrink: 0;
`;

export { Trace };
