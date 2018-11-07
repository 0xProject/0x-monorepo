import * as React from 'react';
import styled from 'styled-components';

import { media } from 'ts/variables';
import { withContext, Props } from './withContext';
import Button from './Button';
import { Beta } from './Typography';

interface HeroProps extends Props {
    children: React.ReactNode;
}

function Hero(props: HeroProps) {
    const { subtitle, tagline } = props;

    return (
        <React.Fragment>
            <StyledHero>
                <HeroContainer>
                    <Subtitle>{subtitle}</Subtitle>
                    <Tagline as="p">{tagline}</Tagline>
                    <Button as="a" href="#" large>
                        Read the Docs
                    </Button>
                </HeroContainer>
                {navigator.userAgent !== 'ReactSnap' ? props.children : null}
            </StyledHero>
        </React.Fragment>
    );
}

const StyledHero = styled.section`
    text-align: center;
    padding-top: 9.375rem;
    padding-bottom: 2rem;
    padding-left: 2.5rem;
    padding-right: 2.5rem;
    min-height: min-content;
    max-height: 37.5rem;
    height: 80vh;
    position: relative;
`;

const HeroContainer = styled.div`
    margin: 0 auto;
    max-width: 590px;
`;

const Subtitle = styled.h2`
    font-size: 3.75rem;
    line-height: 1.16;
    margin-bottom: 1.5rem;

    ${media.small`
        font-size: 2.25rem;
        line-height: 1.1;
        margin-bottom: 1.375rem;
    `};
`;

const Tagline = styled(Beta)`
    margin-bottom: 2rem;
    ${media.small`
        margin-bottom: 1.25rem;
    `};
`;

export default withContext(Hero);
