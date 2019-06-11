import * as React from 'react';
import styled from 'styled-components';

export const CheckedUl = styled.ul`
    list-style-type: none;
`;

const Li = styled.li`
    padding: 0.8rem 0 0.8rem 1.5rem;
    position: relative;
    line-height: 1.4rem;
    #checkmark-icon {
        position: absolute;
        top: 1rem;
        left: 0;
    }
    @media (max-width: 768px) {
        font-size: 15px;
    }
`;

const Checkmark = () => (
    <svg id="checkmark-icon" width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 1L6 12L1 7" stroke="#00AE99" stroke-width="1.4" />
    </svg>
);

interface CheckedLiProps {
    children: string;
}

export const CheckedLi = (props: CheckedLiProps) => (
    <Li>
        <Checkmark />
        {props.children}
    </Li>
);
