import * as React from 'react';
import styled from 'styled-components';

import LogoIcon from '../icons/logo-with-type.svg';

interface LogoInterface {
    // showType: boolean;
    light?: any;
}


// Note let's refactor this
// is it absolutely necessary to have a stateless component
// to pass props down into the styled icon?
const StyledLogo = styled.div`
    text-align: left;
`;

const Icon = styled(LogoIcon)`
    flex-shrink: 0;

    path {
        fill: ${props => props.light ? '#fff' : props.theme.textColor};
    }
`;

export const Logo: React.StatelessComponent<LogoInterface> = (props) => (
    <StyledLogo>
        <Icon {...props} />
    </StyledLogo>
);
