import * as React from 'react';
import styled from 'styled-components';

import { ThemeInterface } from 'ts/@next/components/siteWrap';
import LogoIcon from 'ts/@next/icons/logo-with-type.svg';

interface LogoInterface {
    isLight?: boolean;
    theme?: ThemeInterface;
}

// Note let's refactor this
// is it absolutely necessary to have a stateless component
// to pass props down into the styled icon?
const StyledLogo = styled.div`
    text-align: left;
    position: relative;

    @media (max-width: 768px) {
        z-index: 2;

        svg {
            width: 60px;
        }
    }
`;

const Icon = styled(LogoIcon)`
    flex-shrink: 0;

    path {
        fill: ${(props: LogoInterface) => props.isLight ? '#fff' : props.theme.textColor};

        @media (max-width: 768px) {
            fill: #fff;
        }
    }
`;

export const Logo: React.StatelessComponent<LogoInterface> = (props: LogoInterface) => (
    <StyledLogo>
        <Icon {...props} />
    </StyledLogo>
);
