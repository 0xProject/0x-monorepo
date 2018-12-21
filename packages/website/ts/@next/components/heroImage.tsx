import * as React from 'react';
import styled from 'styled-components';

interface Props {
    image: React.ReactNode;
}

export const LandingAnimation = (props: Props) => <Wrap>{props.image}</Wrap>;

const Wrap = styled.figure`
    display: inline-block;

    svg {
        width: 100%;
        height: auto;
    }

    @media (min-width: 768px) {
        width: 100%;
        max-width: 400px;
    }

    @media (max-width: 768px) {
        width: 180px;
        margin-bottom: 40px;
    }
`;
