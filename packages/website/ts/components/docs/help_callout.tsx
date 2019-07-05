import React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

export interface IHelpCalloutProps {
    heading?: string;
    description?: string;
    url?: string;
}

export const HelpCallout: React.FC<IHelpCalloutProps> = props => (
    <HelpCalloutWrapper href={props.url}>
        <Icon color={colors.brandLight} name="help" size={38} margin={[0, 30, 0, 0]} />
        <div>
            <Heading size="small" marginBottom="8px">
                {props.heading}
            </Heading>
            <Paragraph size="default" marginBottom="0">
                {props.description}
            </Paragraph>
        </div>
    </HelpCalloutWrapper>
);

HelpCallout.defaultProps = {
    heading: 'Need some help?',
    description: `Get in touch here and we’ll be happy to help.`,
    url: 'https://discordapp.com/invite/d3FTX3M',
};

const HelpCalloutWrapper = styled.a.attrs({
    target: '_blank',
})`
    display: flex;
    align-items: center;
    padding: 25px 30px;
    margin-bottom: 1.875rem;
    background-color: ${colors.backgroundLight};
`;
