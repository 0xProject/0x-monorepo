import * as React from 'react';
import styled from 'styled-components';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';

interface Props {
    image: React.Node;
}

export const LandingAnimation = (props: Props) => (
    <Wrap>
        {props.image}
    </Wrap>
);

const Wrap = styled.figure`
    border: 1px solid red;
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
