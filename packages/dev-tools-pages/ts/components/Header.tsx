import * as React from 'react';
import styled from 'styled-components';

import { withContext, Props } from './withContext';
import Container from './Container';
import { Small } from './Typography';

import { media } from '../variables';

function Header(props: Props) {
    const { icon, title, colors } = props;

    return (
        <StyledHeader>
            <Container>
                <LogoMark>
                    <Logo as={icon} color={colors.main} />
                    <Title>{title}</Title>
                </LogoMark>

                <Link as="a" href="#">
                    Built by 0x
                </Link>
            </Container>
        </StyledHeader>
    );
}

const StyledHeader = styled.header`
    padding-top: 3.75rem;
    padding-bottom: 0.875rem;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    ${Container} {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    ${media.small`padding-top: 2.125rem;`};
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

    ${media.small`font-size: 1.25rem;`};
`;

const StyledLink = styled(Small)`
    :hover {
        text-decoration: underline;
    }
`;

const Link = StyledLink as any;
const Logo = StyledLogo as any;

export default withContext(Header);
