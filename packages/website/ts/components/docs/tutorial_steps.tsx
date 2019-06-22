import * as _ from 'lodash';
import * as React from 'react';
import styled, { withTheme } from 'styled-components';

export interface Props {
    children: React.ReactNode;
}

interface WrapperProps {
}

export const TutorialSteps: React.FunctionComponent<Props> = (props: Props) => (
    <>
        <Wrapper>
            {props.children}
        </Wrapper>
    </>
);

TutorialSteps.defaultProps = {
};

const Wrapper = styled.ul<WrapperProps>`
    list-style-type: none;
    counter-reset: tutorialSteps;
    margin-bottom: 1.875rem;

    li {
        font-size: 1rem;
        display: flex;
        align-items: center;
        counter-increment: tutorialSteps;
        margin-bottom: 1rem;
        line-height: 1;
    }

    li:before {
        border-radius: 50%;
        background-color: rgba(0, 174, 153, 0.1);
        content: counter(tutorialSteps);
        display: flex;
        justify-content: center;
        font-feature-settings: 'tnum' on, 'lnum' on;
        align-items: center;
        width: 30px;
        height: 30px;
        margin-right: 1rem;
    }
`;
