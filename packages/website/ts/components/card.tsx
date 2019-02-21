import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

interface CardProps {
    icon: string;
    heading: string;
    description: string;
    href?: string;
}

export const Card: React.StatelessComponent<CardProps> = (props: CardProps) => {
    const { heading, description, icon } = props;

    return (
        <StyledCard>
            <CardHead>
                <Icon name={icon} size="large" />
            </CardHead>
            <CardContent>
                <Heading asElement="h4" size="small" marginBottom="15px">
                    {heading}
                </Heading>
                <Paragraph isMuted={true}>{description}</Paragraph>
            </CardContent>
        </StyledCard>
    );
};

const StyledCard = styled.div`
    background-color: ${colors.backgroundDark};
    width: 100%;
    min-height: 520px;
    flex: 0 0 auto;
    transition: opacity 0.4s ease-in-out;

    @media (max-width: 1200px) {
    }

    @media (max-width: 500px) {
        min-height: 450px;
    }
`;

const CardHead = styled.div`
    background-color: ${colors.brandDark};
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;

    @media (max-width: 500px) {
        height: 240px;
    }
`;

const CardContent = styled.div`
    padding: 30px;

    @media (max-width: 500px) {
        padding: 20px;
    }
`;
