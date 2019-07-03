import { ReactNode } from 'react';
import styled from 'styled-components';

import {
    Tab as OriginalTab,
    TabList as OriginalTabList,
    TabPanel as OriginalTabPanel,
    Tabs as OriginalTabs,
} from 'react-tabs';

import { colors } from 'ts/style/colors';

interface ITabProps {
    children: ReactNode;
    selectedTabClassName?: string;
}

export const Tabs = styled(OriginalTabs).attrs({
    selectedTabClassName: 'is-active',
})<ITabProps>`
    margin-bottom: 1.875rem;

    .is-active {
        background-color: ${colors.backgroundLight};
        color: ${colors.brandDark};
    }
`;

export const TabPanel = styled(OriginalTabPanel).attrs({
    selectedClassName: 'is-active',
})<ITabProps>`
    background-color: ${colors.backgroundLight};
    border-radius: 4px;
    display: none;

    &.is-active {
        display: block;
    }
`;

export const TabList = styled(OriginalTabList)<ITabProps>`
    display: flex;
`;

export const Tab = styled(OriginalTab)<ITabProps>`
    background-color: transparent;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    padding: 12px 12px 13px;
    font-size: 1rem;
    color: ${colors.textDarkSecondary};
    font-weight: 300;
`;
