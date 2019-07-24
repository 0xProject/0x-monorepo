import React, { useLayoutEffect } from 'react';
import styled from 'styled-components';

interface IAutocompleteOverlayProps {
    onClick: () => void;
}

export const AutocompleteOverlay: React.FC<IAutocompleteOverlayProps> = ({ onClick }) => {
    // useLockBodyScroll();

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
function useLockBodyScroll() {
    useLayoutEffect(() => {
        // Get original value of body styles
        const { maxHeight, overflowY } = window.getComputedStyle(document.body);
        // Prevent scrolling on mount
        document.body.style.overflowY = 'hidden';
        document.body.style.maxHeight = '100vh';
        // Re-enable scrolling when component unmounts
        return () => {
            document.body.style.overflowY = overflowY;
            document.body.style.maxHeight = maxHeight;
        };
    }, []); // Empty array ensures effect is only run on mount and unmount
}
