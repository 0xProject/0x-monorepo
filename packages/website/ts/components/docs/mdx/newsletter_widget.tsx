import * as React from 'react';
import styled from 'styled-components';

import { NewsletterForm } from 'ts/components/newsletter_form';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

export interface INewsletterWidgetProps {
    heading?: string;
    description?: string;
    url?: string;
}

export const NewsletterWidget: React.FC<INewsletterWidgetProps> = props => {
    return (
        <NewsletterSignupWrapper href={props.url}>
            <Heading marginBottom="8px">{props.heading}</Heading>
            <Paragraph marginBottom="25px">{props.description}</Paragraph>
            <NewsletterForm color="#b1b1b1" />
        </NewsletterSignupWrapper>
    );
};

NewsletterWidget.defaultProps = {
    heading: 'Sign up for the Newsletter',
    description: 'Body font about the newseletter',
};

const NewsletterSignupWrapper = styled.a`
    background-color: ${colors.backgroundLight};
    padding: 40px 120px 50px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    margin-bottom: ${docs.marginBottom};

    @media (max-width: 768px) {
        padding: 40px 80px 50px;
    }

    @media (max-width: 425px) {
        padding: 40px 20px 30px;
    }
`;
