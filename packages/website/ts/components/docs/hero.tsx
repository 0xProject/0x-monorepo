import React from 'react';
import styled from 'styled-components';

import { SearchInput } from 'ts/components/docs/search_input';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

interface IHeroProps {
    isHome?: boolean;
    title?: string;
    description?: string;
}

export const Hero: React.FC<IHeroProps> = ({ description, isHome, title }) => {
    return (
        <HeroWrapper isHome={isHome}>
            <Heading size="large" isCentered={true} marginBottom={isHome || description ? '30px' : '0'}>
                {title}
            </Heading>
            {description && <Paragraph isCentered={true}>{description}</Paragraph>}
            {isHome && <SearchInput isHome={true} />}
        </HeroWrapper>
    );
};

Hero.defaultProps = {
    isHome: false,
};

const HeroWrapper = styled.div<{ isHome: boolean }>`
    background-color: ${colors.backgroundLight};
    padding-top: ${({ isHome }) => isHome && `63px`};
    padding-bottom: 80px;
    margin-bottom: 60px;
    min-height: ${({ isHome }) => (isHome ? '21.875rem' : '13.222rem')};
    display: flex;
    flex-direction: column;
    justify-content: center;
`;
