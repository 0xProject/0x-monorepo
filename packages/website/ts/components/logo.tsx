import * as React from 'react';
import styled from 'styled-components';

import { ThemeInterface } from 'ts/components/siteWrap';
import LogoIcon from 'ts/icons/logo-with-type.svg';

import { zIndex } from 'ts/style/z_index';

interface LogoInterface {
    theme?: ThemeInterface;
}

// Note let's refactor this
// is it absolutely necessary to have a stateless component
// to pass props down into the styled icon?
const StyledLogo = styled.div`
    text-align: left;
    position: relative;
    z-index: ${zIndex.header};

    @media (max-width: 800px) {
        svg {
            width: 60px;
        }
    }
`;

const Icon = styled(LogoIcon)<LogoInterface>`
    flex-shrink: 0;

    path {
        fill: ${props => props.theme.textColor};
    }
`;

export const Logo: React.StatelessComponent<LogoInterface> = (props: LogoInterface) => (
    <StyledLogo>
        <Icon {...props} />
    </StyledLogo>
);
