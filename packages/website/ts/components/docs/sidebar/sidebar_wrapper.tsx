import * as React from 'react';
import MediaQuery from 'react-responsive';
import styled from 'styled-components';

import { Collapse } from 'ts/components/docs/sidebar/collapse';

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
`;
