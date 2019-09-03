import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

interface ISidebarWrapperProps {
    children: React.ReactNode;
}

const THROTTLE_RATE = 250;
const LINK_PADDING = 20;

export const SidebarDesktop: React.FC<ISidebarWrapperProps> = ({ children }) => {
    const [maxHeight, setMaxHeight] = React.useState<number>(0);
    const asideRef = React.useRef(null);
    const contentRef = React.useRef(null);

    function getVisibleHeight(el: HTMLElement): number {
        const elementHeight = el.offsetHeight;
        const windowHeight = window.innerHeight;
        const { bottom, top } = el.getBoundingClientRect();
        // Get the larger visible top or bottom part of the sidebar
        let calc = Math.max(0, top > 0 ? Math.min(elementHeight, windowHeight - top) : Math.min(bottom, windowHeight));
        // Adjust the calculation if position sticky is 'stuck' at the offset of header
        if (top < docs.headerOffset) {
            calc = calc - docs.headerOffset;
        }
        return calc;
    }

    const setScrollIfLinkNotVisible = (visibleHeight: number): void => {
        const active: HTMLAnchorElement = document.querySelector('.toc-link-active');
        if (active) {
            const activeTop = active.offsetTop;
            const activeHeight = active.clientHeight + LINK_PADDING;
            const contentScroll = contentRef.current.scrollTop;

            const isVisible = activeTop >= contentScroll && activeTop - contentScroll + activeHeight <= visibleHeight;

            if (!isVisible) {
                contentRef.current.scrollTop =
                    contentScroll > activeTop ? activeTop : activeTop - visibleHeight + activeHeight;
            }
        }
    };

    const listener = (e: Event): void => {
        const visibleHeight = getVisibleHeight(asideRef.current);
        const newMaxHeight = visibleHeight;

        setScrollIfLinkNotVisible(visibleHeight);

        if (maxHeight !== newMaxHeight) {
            setMaxHeight(newMaxHeight);
        }
    };

    const throttledListener = _.throttle(listener, THROTTLE_RATE);

    React.useEffect(() => {
        const { top } = asideRef.current.getBoundingClientRect();
        const newHeight = window.innerHeight - top;

        setMaxHeight(newHeight);
    }, []);

    React.useEffect(() => {
        window.addEventListener('scroll', throttledListener);
        window.addEventListener('resize', throttledListener);
        return () => {
            window.removeEventListener('scroll', throttledListener);
            window.removeEventListener('resize', throttledListener);
        };
    }, [maxHeight]);

    return (
        <SidebarAside ref={asideRef}>
            {/* Setting maxHeight as style and not styled component prop due
            to better performance, not having to create a dynamic class for each change */}
            <SidebarContent ref={contentRef} style={{ maxHeight: maxHeight - LINK_PADDING }}>
                {children}
            </SidebarContent>
        </SidebarAside>
    );
};

const SidebarAside = styled.aside`
    position: relative;
`;

const SidebarContent = styled.div`
    position: sticky;
    top: ${docs.headerOffset}px; /* Space for the header (react-headroom) when clicking on links */
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
`;
