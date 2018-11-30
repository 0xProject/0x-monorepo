import * as React from 'react';
import styled from 'styled-components';

import LogoIcon from '../icons/logo-with-type.svg';

interface LogoInterface {
    // showType: boolean;
}

const StyledLogo = styled.div`
    text-align: left;
`;

const Icon = styled(LogoIcon)`
    flex-shrink: 0;
`;

export const Logo: React.StatelessComponent<LogoInterface> = ({}) => (
    <StyledLogo>
        <Icon />
    </StyledLogo>
);
