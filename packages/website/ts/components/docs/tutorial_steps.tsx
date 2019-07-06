import React from 'react';
import styled from 'styled-components';

interface ITutorialStepsProps {
    children: React.ReactNode;
}

export const TutorialSteps: React.FC<ITutorialStepsProps> = ({ children }) => <Wrapper>{children}</Wrapper>;

const Wrapper = styled.ol`
    list-style-type: none;
    counter-reset: tutorialSteps;
    margin-bottom: 1.875rem;

    li {
        display: flex;
        align-items: center;
        counter-increment: tutorialSteps;
        margin-bottom: 0.8333rem;
        font-size: 1rem;
        line-height: 1;
    }

    li:before {
        border-radius: 50%;
        background-color: rgba(0, 174, 153, 0.1);
        content: counter(tutorialSteps);
        display: flex;
        align-items: center;
        justify-content: center;
        font-feature-settings: 'tnum' on, 'lnum' on;
        width: 30px;
        height: 30px;
        margin-right: 1rem;
    }
`;
