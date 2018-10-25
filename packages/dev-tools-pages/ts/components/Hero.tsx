import * as React from 'react';
import styled from 'styled-components';

import { media } from 'ts/variables';
import { withContext, Props } from './withContext';
import Button from './Button';
import { Beta } from './Typography';

const IMAGE_WIDTH = 2560;
const IMAGE_HEIGHT = 800;

function Hero(props: Props) {
    const { subtitle, tagline, title } = props;

    return (
        <React.Fragment>
            <StyledHero>
                <Subtitle>{subtitle}</Subtitle>
                <Tagline as="p">{tagline}</Tagline>
                <Button as="a" href="#" large>
                    Read the Docs
                </Button>
            </StyledHero>

            <ImageContainer>
                <Image src={`/images/${title}@1x.gif`} srcSet={`/images/${title}@1x.gif, /images/${title}@2x.gif 2x`} />
            </ImageContainer>
        </React.Fragment>
    );
}

const StyledHero = styled.section`
    text-align: center;
    margin: 0 auto;
    padding-top: 9.375rem;
    padding-bottom: 2rem;
    padding-left: 2.5rem;
    padding-right: 2.5rem;
    max-width: 590px;
    min-height: min-content;
    max-height: 37.5rem;
    height: 80vh;
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
    height: ${IMAGE_HEIGHT}px;
    position: absolute;
    top: 6.875rem;
    left: 0;
    overflow: hidden;
    z-index: -1;
`;

const Image = styled.img`
    width: ${IMAGE_WIDTH}px;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%);
`;

export default withContext(Hero);
