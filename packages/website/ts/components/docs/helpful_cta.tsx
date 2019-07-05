import React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

export interface IHelpfulCtaProps {
    heading?: string;
}

export const HelpfulCta: React.FC<IHelpfulCtaProps> = ({ heading }) => {
    // @TODO: add was this helpful logic
    return (
        <Wrapper>
            <Text>{heading}</Text>
            <Buttons>
                <CtaButton color={colors.white}>Yes</CtaButton>
                <CtaButton isTransparent={true} color={colors.brandLight} borderColor={colors.brandLight}>
                    No
                </CtaButton>
            </Buttons>
        </Wrapper>
    );
};

HelpfulCta.defaultProps = {
    heading: 'Was this page helpful?',
};

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 1.875rem;
`;

const Text = styled(Paragraph)`
    color: ${colors.textDarkPrimary};
    font-size: 1.111111111rem;
    font-weight: 400;
    margin-bottom: 0;
    opacity: 1;
`;

const Buttons = styled.div`
    display: flex;
    align-items: center;
    margin-left: 40px;
`;

const CtaButton = styled(Button)`
    padding: 8px 30px 6px;
    font-size: 1rem;

    & + & {
        margin-left: 10px;
    }
`;
