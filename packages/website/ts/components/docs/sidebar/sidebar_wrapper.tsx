import * as React from 'react';
import MediaQuery from 'react-responsive';
import styled from 'styled-components';

import { Collapse } from 'ts/components/docs/sidebar/collapse';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

interface ISidebarWrapperProps {
    children: React.ReactNode;
}

export const SidebarWrapper: React.FC<ISidebarWrapperProps> = ({ children }) => {
    return (
        <SidebarAside>
            <SidebarContent>
                <MediaQuery maxWidth={900}>
                    <Collapse>{children}</Collapse>
                </MediaQuery>

                <MediaQuery minWidth={901}>{children}</MediaQuery>
            </SidebarContent>
        </SidebarAside>
    );
};

const SidebarAside = styled.aside`
    position: relative;
`;

const SidebarContent = styled.div`
    position: sticky;
    top: ${docs.headerOffset}px; /* To make space for the header (react-headroom) when clicking on links */
    max-height: 85vh;
    overflow-y: auto;
    overflow-x: hidden;

    /* Slim scroll bar */
    scrollbar-color: ${colors.grey500} transparent;
    scrollbar-width: thin; /* Firefox */
    -ms-overflow-style: none; /* IE 10+ */
    &::-webkit-scrollbar {
        height: 1px;
        width: 1px;
        background: transparent; /* Chrome / Safari / Webkit */
    }
    &::-webkit-scrollbar-thumb {
        background-color: ${colors.grey350};
    }

    @media (max-width: 900px) {
        max-height: 100%;
    }
`;
