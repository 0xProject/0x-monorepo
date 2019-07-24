import React from 'react';
import styled from 'styled-components';

import { SearchInput } from 'ts/components/docs/search/search_input';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

interface IHeroProps {
    isHome?: boolean;
    title?: string;
    subtitle?: string;
}

export const Hero: React.FC<IHeroProps> = ({ isHome = false, subtitle, title }) => (
    <HeroWrapper isHome={isHome}>
        <Heading size={isHome ? 'large' : 'medium'} isCentered={true} marginBottom={isHome || subtitle ? '30px' : '0'}>
            {title}
        </Heading>
        {subtitle && <Paragraph isCentered={true}>{subtitle}</Paragraph>}
        {isHome && <SearchInput isHome={true} />}
    </HeroWrapper>
);

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
