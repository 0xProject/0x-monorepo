import React, { useLayoutEffect } from 'react';
import styled from 'styled-components';

interface IAutocompleteOverlayProps {
    onClick: () => void;
    shouldLockScroll?: boolean;
}

export const AutocompleteOverlay: React.FC<IAutocompleteOverlayProps> = ({ onClick, shouldLockScroll }) => {
    if (shouldLockScroll) {
        useLockBodyScroll();
    }

    return <Overlay onClick={onClick} />;
};

const Overlay = styled.div<IAutocompleteOverlayProps>`
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    z-index: 30;

    width: 100vw;
    height: 100vh;

    background: rgba(243, 246, 244, 0.5);
    cursor: pointer;
`;

// This could be extracted to reuse
function useLockBodyScroll(): void {
    useLayoutEffect(() => {
        const html = document.documentElement;
        // Prevent scrolling on mount
        html.style.overflowY = 'hidden';
        html.style.maxHeight = '100vh';
        // Re-enable scrolling when component unmounts
        return () => {
            html.style.overflowY = 'auto';
            html.style.maxHeight = '';
        };
    }, []); // Empty array ensures effect is only run on mount and unmount
}
