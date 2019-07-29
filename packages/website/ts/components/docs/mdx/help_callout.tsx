import * as React from 'react';
import styled from 'styled-components';

import { Link } from '@0x/react-shared';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

export interface IHelpCalloutProps {
    heading?: string;
    description?: string;
    url?: string;
}

export const HelpCallout: React.FC<IHelpCalloutProps> = props => (
    <HelpCalloutWrapper>
        <Icon color={colors.brandDark} name="help" size={38} margin={[0, 30, 0, 0]} />
        <div>
            <Heading size="small" marginBottom="8px">
                {props.heading}
            </Heading>
            <Paragraph size="default" marginBottom="0">
                Get in touch{' '}
                <Link fontColor={colors.brandDark} textDecoration="underline" to={props.url}>
                    here
                </Link>{' '}
                and we'll be happy to help
            </Paragraph>
        </div>
    </HelpCalloutWrapper>
);

HelpCallout.defaultProps = {
    heading: 'Need some help?',
    url: 'https://discordapp.com/invite/d3FTX3M',
};

const HelpCalloutWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 25px 30px;
    margin-bottom: 1.875rem;
    background-color: ${colors.backgroundLight};
`;
