import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';
import { useDimensions } from 'ts/style/dimensions';

interface ICollapseProps {
    children: React.ReactNode;
    title?: string;
}

interface ICollapse {
    isActive: boolean;
    height?: number;
}

export const Collapse: React.FC<ICollapseProps> = props => {
    const [isActive, setIsActive] = React.useState<boolean>(true);
    // @ts-ignore
    const [contentRef, { height }] = useDimensions();

    const toggleCollapse = () => {
        setIsActive(!isActive);
    };

    return (
        <>
            <CollapseToggle isActive={isActive} onClick={toggleCollapse}>
                <p>On this page</p>
                <svg width="12" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 7l5-5 5 5" stroke={colors.brandDark} strokeWidth="1.5" />
                </svg>
            </CollapseToggle>
            <CollapseWrapper height={height} isActive={isActive}>
                <CollapseContent isActive={isActive}>
                    <div ref={contentRef}>{props.children}</div>
                </CollapseContent>
            </CollapseWrapper>
        </>
    );
};

const CollapseWrapper = styled.div<ICollapse>`
    height: ${props => (props.isActive ? props.height : 0)}px;
    display: flex;
    flex-direction: column;
`;

const CollapseToggle = styled.button<ICollapse>`
    display: flex;
    align-items: center;
    border: none;
    background: none;
    cursor: pointer;
    color: ${colors.brandDark};
    padding: 0;
    font-size: 0.89rem;
    margin-bottom: ${props => (props.isActive ? 1 : 0)}rem;

    svg {
        margin-left: 10px;
        transform: rotate(${props => (props.isActive ? 0 : 180)}deg);
        transition: transform 300ms ease-out;
    }
`;

const CollapseContent = styled.div<ICollapse>`
    overflow: hidden;
    transition: flex 300ms ease-out;
    flex: ${props => (props.isActive ? 1 : 0)};
`;
