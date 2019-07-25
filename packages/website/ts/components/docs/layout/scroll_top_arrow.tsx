import React, { useEffect, useState } from 'react';
import { animateScroll } from 'react-scroll';
import styled from 'styled-components';

import debounce from 'lodash/debounce';

import { colors } from 'ts/style/colors';
import { fadeIn, fadeOut } from 'ts/style/keyframes';

export const ScrollTopArrow = () => {
    const [scrollY, setScrollY] = useState<number>(window.scrollY);
    const isArrowVisible = scrollY > 100;

    useEffect(
        () => {
            const handleScroll = () => setScrollY(window.scrollY);
            window.addEventListener('scroll', debounce(handleScroll));
            return () => window.removeEventListener('scroll', debounce(handleScroll));
        },
        [debounce],
    );

    return (
        <ArrowWrapper isArrowVisible={isArrowVisible} onClick={animateScroll.scrollToTop}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22.047" height="22.236">
                <path d="M2.524 8.625L3.67 9.693l6.557-6.232v18.23h1.592V3.46l6.557 6.232 1.147-1.068-8.5-8.08-8.5 8.08z" />
            </svg>
        </ArrowWrapper>
    );
};

const ArrowWrapper = styled.button<{ isArrowVisible: boolean }>`
    visibility: ${props => (props.isArrowVisible ? 'visible' : 'hidden')};
    animation: ${props => (props.isArrowVisible ? fadeIn : fadeOut)} 300ms linear;
    transition: visibility 300ms linear;

    display: flex;
    align-items: center;
    justify-content: center;

    position: sticky;
    bottom: 20px;
    left: calc(50% - 20px);

    height: 40px;
    width: 40px;
    border: none;
    border-radius: 50%;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.2);
    background: ${colors.backgroundLight};
`;
