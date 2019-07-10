import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { Button } from 'ts/components/button';
import { Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

interface IHelpfulCtaProps {
    question?: string;
    reply?: string;
}

export const HelpfulCta: React.FC<IHelpfulCtaProps> = ({ reply, question }) => {
    const [isClicked, setIsClicked] = useState<boolean>(false);

    const handleClick = () => {
        setIsClicked(true);
    };

    return (
        <HelpfulCtaWrapper>
            {isClicked ? (
                <CtaTextAnimated>{reply}</CtaTextAnimated>
            ) : (
                <>
                    <CtaText>{question}</CtaText>
                    <CtaButtons>
                        <CtaButton onClick={handleClick} color={colors.white}>
                            Yes
                        </CtaButton>
                        <CtaButton
                            onClick={handleClick}
                            isTransparent={true}
                            color={colors.brandLight}
                            borderColor={colors.brandLight}
                        >
                            No
                        </CtaButton>
                    </CtaButtons>
                </>
            )}
        </HelpfulCtaWrapper>
    );
};

HelpfulCta.defaultProps = {
    question: 'Was this page helpful?',
    reply: 'Thank you for letting us know 🙏',
};

const HelpfulCtaWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 1.875rem;
`;

const CtaText = styled(Paragraph)`
    color: ${colors.textDarkPrimary};
    font-size: 1.1rem;
    font-weight: 400;
    line-height: 40px;
    margin-bottom: 0;
    opacity: 1;
`;

// prettier-ignore
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const CtaTextAnimated = styled(CtaText)`
    animation: ${fadeIn} 0.5s ease-in-out;
`;

const CtaButtons = styled.div`
    display: flex;
    align-items: center;
    margin-left: 40px;
`;

const CtaButton = styled(Button)`
    border: none;
    padding: 0 30px;
    line-height: 40px;
    font-size: 1rem;

    & + & {
        margin-left: 10px;
    }
`;
