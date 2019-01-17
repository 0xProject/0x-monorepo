import * as React from 'react';
import styled from 'styled-components';

import { ContextInterface, ThemeContext } from 'ts/context';
import { media } from 'ts/variables';

import { Container } from './container';
import { Small } from './typography';

const Header: React.StatelessComponent<{}> = () => (
    <ThemeContext.Consumer>
        {({ icon, title }: ContextInterface) => (
            <StyledHeader>
                <Container>
                    <LogoMark>
                        <Logo as={icon as 'svg'} />
                        <Title>{title}</Title>
                    </LogoMark>

                    <Link as="a" href="https://0x.org/" target="_blank">
                        Built by 0x
                    </Link>
                </Container>
            </StyledHeader>
        )}
    </ThemeContext.Consumer>
);

const StyledHeader = styled.header`
    padding-top: 3.75rem;
    padding-bottom: 0.875rem;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    ${Container} {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    ${media.small`padding-top: 2.125rem;`};
`;

const LogoMark = styled.div`
    position: relative;
    height: 1.75rem;
    display: flex;
    align-items: center;
`;

const Logo = styled.div`
    color: ${props => props.theme.colors.main};
    width: 1.75rem;
    height: 100%;
`;

const Title = styled.h1`
    font-size: 1.5rem;
    line-height: 1;
    white-space: nowrap;
    margin-top: 2px;
    margin-bottom: 0;
    margin-left: 0.8125rem;

    ${media.small`font-size: 1.25rem;`};
`;

const Link = styled(Small)`
    :hover {
        text-decoration: underline;
    }
`;

export { Header };
