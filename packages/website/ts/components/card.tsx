import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

export interface LinkProps {
    text: string;
    url: string;
}

interface CardProps {
    icon: string;
    heading: string;
    description: string;
    href?: string;
    links?: LinkProps[];
}

export const Card: React.StatelessComponent<CardProps> = (props: CardProps) => {
    const { heading, description, icon, links } = props;

    return (
        <StyledCard>
            <CardHead>
                <Icon name={icon} size={160} />
            </CardHead>
            <CardContent>
                <Heading asElement="h4" size="default" marginBottom="15px">
                    {heading}
                </Heading>
                <Paragraph isMuted={true}>{description}</Paragraph>
                <Links>
                    {_.map(links, (link, index) => (
                        <Button
                            href={link.url}
                            target={link.url !== undefined ? '_blank' : undefined}
                            isWithArrow={true}
                            isAccentColor={true}
                            key={`cardLink-${index}-${link.url}`}
                        >
                            {link.text}
                        </Button>
                    ))}
                </Links>
            </CardContent>
        </StyledCard>
    );
};

const StyledCard = styled.div`
    background-color: ${colors.backgroundDark};
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 520px;
    flex: 0 0 auto;
    transition: opacity 0.4s ease-in-out;

    @media (max-width: 500px) {
        min-height: 450px;
    }
`;

const CardHead = styled.div`
    background-color: ${colors.brandDark};
    height: 240px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 0;

    @media (max-width: 500px) {
        height: 180px;
        padding: 30px 0;
    }
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: 30px;
    flex-grow: 1;

    @media (max-width: 500px) {
        padding: 20px;
    }
`;

const Links = styled.div`
    margin-top: auto;
`;
