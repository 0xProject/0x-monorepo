import * as React from 'react';
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
    <HeroWrapper subtitle={subtitle}>
        <Heading size={isHome ? 'large' : 'medium'} isCentered={true} marginBottom={isHome || subtitle ? '30px' : '0'}>
            {title}
        </Heading>
        {subtitle && (
            <Paragraph marginBottom="0" isCentered={true}>
                {subtitle}
            </Paragraph>
        )}
        {isHome && <SearchInput isHome={true} />}
    </HeroWrapper>
);

const HeroWrapper = styled.div<{ subtitle: string }>`
    background-color: ${colors.backgroundLight};

    display: flex;
    flex-direction: column;
    justify-content: center;

    margin-bottom: 60px;
    padding-top: 36px;
    padding-bottom: 96px;

    @media (max-width: 768px) {
        padding-top: 12px;
        padding-bottom: 72px;
    }
`;
