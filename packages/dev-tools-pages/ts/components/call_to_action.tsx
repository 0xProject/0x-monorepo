import * as React from 'react';
import styled from 'styled-components';

import { ContextInterface, ThemeContext } from 'ts/context';
import { media } from 'ts/variables';

import { Button } from './button';
import { Beta } from './typography';

const CallToAction: React.StatelessComponent<ContextInterface> = ({ children }) => (
    <ThemeContext.Consumer>
        {({ subtitle, tagline, docLink }: ContextInterface) => (
            <StyledCallToAction>
                <CallToActionContainer>
                    <Button as="a" href={docLink} target="_blank" large={true}>
                        Read the Docs
                    </Button>
                </CallToActionContainer>
                {navigator.userAgent !== 'ReactSnap' ? children : null}
            </StyledCallToAction>
        )}
    </ThemeContext.Consumer>
);

const StyledCallToAction = styled.section`
    text-align: center;
    padding-top: 0;
    padding-bottom: 1rem;
    padding-left: 2.5rem;
    padding-right: 2.5rem;
    min-height: min-content;
    max-height: 37.5rem;
    height: 20vh;
    position: relative;
`;

const CallToActionContainer = styled.div`
    margin: 0 auto;
    max-width: 590px;
`;

const Subtitle = styled.h2`
    font-size: 3.75rem;
    line-height: 1.16;
    margin-bottom: 1.5rem;

    ${media.small`
        font-size: 2.25rem;
        line-height: 1.1;
        margin-bottom: 1.375rem;
    `};
`;

const Tagline = styled(Beta)`
    margin-bottom: 2rem;
    ${media.small`
        margin-bottom: 1.25rem;
    `};
`;

export { CallToAction };
