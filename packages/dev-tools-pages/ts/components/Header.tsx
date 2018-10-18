import * as React from 'react';
import styled from 'styled-components';

import { withContext, Props } from './withContext';
import Container from './Container';
import { Small } from './Typography';

function Header(props: Props) {
    const { icon, title, colors } = props;

    return (
        <Container>
            <StyledHeader>
                <LogoMark>
                    <Logo as={icon} color={colors.main} />
                    <Title>{title}</Title>
                </LogoMark>

                <Link as="a" href="#">
                    Built by 0x
                </Link>
            </StyledHeader>
        </Container>
    );
}

const StyledHeader = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 3.75rem;
    padding-bottom: 0.875rem;
`;

const LogoMark = styled.div`
    display: flex;
    align-items: center;
`;

const StyledLogo = styled.div`
    color: ${props => props.color}
    width: 1.75rem;
    height: 1.75rem;
`;

const Title = styled.h1`
    font-size: 1.5rem;
    margin: 0;
    margin-left: 0.8125rem;
`;

const StyledLink = styled(Small)`
    color: inherit;
`;

const Link = StyledLink as any;
const Logo = StyledLogo as any;

export default withContext(Header);
