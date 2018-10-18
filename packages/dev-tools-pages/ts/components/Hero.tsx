import * as React from 'react';
import styled from 'styled-components';

import { withContext, Props } from './withContext';
import Button from './Button';
import { Beta } from './Typography';

function Hero(props: Props) {
    const { subtitle, tagline } = props;
    return (
        <StyledHero>
            <Subtitle>{subtitle}</Subtitle>
            <Tagline as="p">{tagline}</Tagline>
            <Button as="a" href="#" large>
                Read the Docs
            </Button>
        </StyledHero>
    );
}

const StyledHero = styled.section`
    margin: 0 auto;
    text-align: center;
    max-width: 590px;
`;

const Subtitle = styled.h2`
    font-size: 3.75rem;
    line-height: 1.16;
    margin-bottom: 1.5rem;
`;

const Tagline = styled(Beta)`
    margin-bottom: 2rem;
`;

export default withContext(Hero);
