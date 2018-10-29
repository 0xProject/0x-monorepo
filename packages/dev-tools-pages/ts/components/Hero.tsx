import * as React from 'react';
import styled from 'styled-components';

import { media } from 'ts/variables';
import { withContext, Props } from './withContext';
import Button from './Button';
import { Beta } from './Typography';

function Hero(props: Props) {
    const { subtitle, tagline, title } = props;

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

                <ImageContainer>
                    <Image
                        src={`/images/${title}@1x.gif`}
                        srcSet={`/images/${title}@1x.gif, /images/${title}@2x.gif 2x`}
                    />
                </ImageContainer>
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

const ImageContainer = styled.div`
    width: 100%;
    height: 800px;
    position: absolute;
    top: 100%;
    left: 0;
    overflow: hidden;
    transform: translateY(-50%);
    z-index: -1;
    ${media.xlarge`
        height: 533.333333334px;
        transform: translateY(-60%);
    `};
    ${media.small`
        height: 400px;
        transform: translateY(-70%);
    `};
`;

const Image = styled.img`
    width: min-content;
    height: 100%;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    object-fit: contain;
    ${media.small`
        height: 100%;
        width: auto;
        left: 0;
        transform: translateX(-15%);
    `};
`;

export default withContext(Hero);
