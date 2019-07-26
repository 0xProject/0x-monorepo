import React, { useState, useRef } from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';
import { useDimensions } from 'ts/style/dimensions';

interface IAccordionProps {
    children: React.ReactNode;
    title?: string;
}

export const Accordion: React.FC<IAccordionProps> = props => {
    const [isActive, setIsActive] = useState<boolean>(false);
    // @ts-ignore
    const [contentRef, { height }] = useDimensions();

    const toggleAccordion = () => {
        setIsActive(!isActive);
    };

    return (
        <AccordionWrapper height={height}>
            <AccordionToggle isActive={isActive} onClick={toggleAccordion}>
                <p>On this page</p>
                <svg width="12" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 7l5-5 5 5" stroke={colors.brandDark} strokeWidth="1.5" />
                </svg>
            </AccordionToggle>
            <AccordionContent height={height} isActive={isActive}>
                <div ref={contentRef}>{props.children}</div>
            </AccordionContent>
        </AccordionWrapper>
    );
};

const AccordionWrapper = styled.div<{ height: number }>`
    height: ${props => props.height}px;
    display: flex;
    flex-direction: column;
    margin-bottom: 2.22em;

    @media (max-width: 900px) {
        margin-bottom: 30px;
    }
`;

const AccordionToggle = styled.button<{ isActive: boolean }>`
    display: flex;
    align-items: center;
    border: none;
    background: none;
    color: ${colors.brandDark};
    padding: 0;
    font-size: 0.89rem;
    margin-bottom: 1rem;

    svg {
        margin-left: 10px;
        transform: rotate(${props => (props.isActive ? 0 : 180)}deg);
        transition: transform 300ms ease-out;
    }
`;

const AccordionContent = styled.div<{ isActive: boolean; height: number }>`
    overflow: hidden;
    height: auto;
    transition: flex 300ms ease-out;
    flex: ${props => (props.isActive ? 1 : 0)};
`;
