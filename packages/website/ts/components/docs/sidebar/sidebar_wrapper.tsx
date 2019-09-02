import * as React from 'react';
import MediaQuery from 'react-responsive';

import { Collapse } from 'ts/components/docs/sidebar/collapse';
import { SidebarDesktop } from 'ts/components/docs/sidebar/sidebar_desktop';

interface ISidebarWrapperProps {
    children: React.ReactNode;
}

// Note (piotr): I render these two conditionally to not have any taxing
// event listeners / expensive calculations on mobile (setting dynamic
// sidebar height) and to not break sidebar styles

export const SidebarWrapper: React.FC<ISidebarWrapperProps> = ({ children }) => {
    return (
        <>
            <MediaQuery maxWidth={900}>
                <Collapse>{children}</Collapse>
            </MediaQuery>

            <MediaQuery minWidth={901}>
                <SidebarDesktop>{children}</SidebarDesktop>
            </MediaQuery>
        </>
    );
};
