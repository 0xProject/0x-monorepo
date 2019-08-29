import * as _ from 'lodash';
import * as React from 'react';
import MediaQuery from 'react-responsive';
import styled from 'styled-components';

import { Collapse } from 'ts/components/docs/sidebar/collapse';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

interface ISidebarWrapperProps {
    children: React.ReactNode;
}

const THROTTLE_RATE = 200;

export const SidebarWrapper: React.FC<ISidebarWrapperProps> = ({ children }) => {
    const [maxHeight, setMaxHeight] = React.useState<number>(0);
    const el = React.useRef(null);

    function visibleHeight(el: any) {
        const elementHeight = el.offsetHeight;
        const windowHeight = window.innerHeight;
        const { bottom, top } = el.getBoundingClientRect();
        return Math.max(0, top > 0 ? Math.min(elementHeight, windowHeight - top) : Math.min(bottom, windowHeight));
    }

    const listener = (e: any) => {
        const newMaxHeight = visibleHeight(el.current);
        setMaxHeight(newMaxHeight);
    };

    const throttledListener = _.throttle(listener, THROTTLE_RATE);

    React.useEffect(() => {
        const { top } = el.current.getBoundingClientRect();
        const newHeight = window.innerHeight - top;

        setMaxHeight(newHeight);

        window.addEventListener('scroll', throttledListener);
        window.addEventListener('resize', throttledListener);
        return () => {
            window.removeEventListener('scroll', throttledListener);
            window.removeEventListener('resize', throttledListener);
        };
    }, []);

    return (
        <SidebarAside ref={el}>
            <SidebarContent maxHeight={maxHeight}>
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

const SidebarContent = styled.div<{ maxHeight: number }>`
    position: sticky;
    top: ${docs.headerOffset}px; /* To make space for the header (react-headroom) when clicking on links */
    max-height: ${props => props.maxHeight - 20}px;
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
