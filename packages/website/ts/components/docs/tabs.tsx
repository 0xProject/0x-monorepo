import { ReactNode } from 'react';
import styled from 'styled-components';

import { Tab as ReactTab, TabList as ReactTabList, TabPanel as ReactTabPanel, Tabs as ReactTabs } from 'react-tabs';

import { colors } from 'ts/style/colors';

interface ITabProps {
    children: ReactNode;
    selectedTabClassName?: string;
}

const activeClass = {
    selectedTabClassName: 'is-active',
};

export const Tabs = styled(ReactTabs).attrs(activeClass)<ITabProps>`
    margin-bottom: 1.875rem;

    .is-active {
        background-color: ${colors.backgroundLight};
        color: ${colors.brandDark};
    }
`;

export const TabPanel = styled(ReactTabPanel).attrs(activeClass)<ITabProps>`
    background-color: ${colors.backgroundLight};
    border-radius: 4px;
    display: none;

    &.is-active {
        display: block;
    }
`;

export const TabList = styled(ReactTabList)<ITabProps>`
    display: flex;
`;

export const Tab = styled(ReactTab)<ITabProps>`
    background-color: transparent;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    padding: 12px;
    font-size: 1rem;
    color: ${colors.textDarkSecondary};
    font-weight: 300;
`;
