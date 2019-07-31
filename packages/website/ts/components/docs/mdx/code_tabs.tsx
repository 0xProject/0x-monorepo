import * as React from 'react';
import styled from 'styled-components';

import {
    Tab as OriginalTab,
    TabList as OriginalTabList,
    TabPanel as OriginalTabPanel,
    Tabs as OriginalTabs,
} from 'react-tabs';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

interface ITabProps {
    children: React.ReactNode;
    selectedTabClassName?: string;
}

interface ICodeTabsProps {
    children: React.ReactNode;
    tabs: string[];
}

export const CodeTabs: React.FC<ICodeTabsProps> = ({ children, tabs }) => {
    return (
        <Tabs>
            <TabList>
                {tabs.map((tab, index) => (
                    <Tab key={`tab-${index}`}>{tab}</Tab>
                ))}
            </TabList>
            {React.Children.map(children, (child, index) => {
                return <TabPanel key={`tabPanel-${index}`}>{child}</TabPanel>;
            })}
        </Tabs>
    );
};

export const Tabs = styled(OriginalTabs).attrs({
    selectedTabClassName: 'is-active',
})<ITabProps>`
    margin-bottom: ${docs.marginBottom};
    position: relative;
`;

export const TabPanel = styled(OriginalTabPanel).attrs({
    selectedClassName: 'is-active',
})<ITabProps>`
    border-radius: 4px;
    display: none;

    &.is-active {
        display: block;
    }
`;

export const TabList = styled(OriginalTabList)<ITabProps>`
    display: flex;
    position: absolute;
    top: 5px;
`;

export const Tab = styled(OriginalTab)<ITabProps>`
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    padding: 12px;
    font-size: 16px;
    font-weight: 300;
    color: ${colors.textDarkSecondary};

    &.is-active {
        background-color: ${colors.backgroundLight};
        color: ${colors.brandDark};
    }
`;
