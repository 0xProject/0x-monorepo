import * as React from 'react';
import styled from 'styled-components';

import { ContextInterface, ThemeContext } from 'ts/context';

import { Button } from './button';

const CallToAction: React.StatelessComponent<ContextInterface> = ({ children }) => (
    <ThemeContext.Consumer>
        {({ docLink }: ContextInterface) => (
            <StyledCallToAction>
                <CallToActionContainer>
                    <Button as="a" href={docLink} target="_blank" large={true}>
                        Read the Docs
                    </Button>
                </CallToActionContainer>
                {children}
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

export { CallToAction };
