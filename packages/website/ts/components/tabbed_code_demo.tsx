import * as React from 'react';
import styled from 'styled-components';

import { CodeDemo } from 'ts/components/code_demo';

export interface CodeTab {
    code: string;
    label: string;
    language: string;
}

export interface TabbedCodeDemoProps {
    tabs: CodeTab[];
    activeIndex: number;
    onTabClick: (index: number) => void;
}

interface TabProps {
    isActive: boolean;
}

export const TabbedWrapper = styled.div`
    background-color: #0c2320;
    width: 100%;
    height: 586px;
    margin-left: 50px;
    @media (max-width: 768px) {
        display: none;
    }
`;

const Tab = styled.div<TabProps>`
    background-color: ${props => props.theme.lightBgColor};
    opacity: ${props => (props.isActive ? '1' : '0.5')};
    display: inline-block;
    padding: 20px 40px;
    cursor: pointer;
    &:hover {
        opacity: ${props => (props.isActive ? '1' : '0.75')};
    }
`;

export const TabbedCodeDemo: React.FC<TabbedCodeDemoProps> = props => {
    const { activeIndex, tabs, onTabClick } = props;
    const { code, language } = tabs[activeIndex];
    return (
        <TabbedWrapper>
            {tabs.map((tab, index) => (
                <Tab key={tab.label} isActive={activeIndex === index} onClick={onTabClick.bind(null, index)}>
                    {tab.label}
                </Tab>
            ))}
            <CodeDemo language={language} fontSize="16px" shouldHideCopy={true}>
                {code}
            </CodeDemo>
        </TabbedWrapper>
    );
};
