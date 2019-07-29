import * as React from 'react';
import styled, { keyframes } from 'styled-components';

import { analytics } from 'ts/utils/analytics';

import { Button } from 'ts/components/button';
import { Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';
import { fadeIn } from 'ts/style/keyframes';

interface IHelpfulCtaProps {
    page: string;
    question?: string;
    note?: string;
}

export const HelpfulCta: React.FC<IHelpfulCtaProps> = ({ note, page, question }) => {
    const [isClicked, setIsClicked] = React.useState<boolean>(false);

    const vote = (yesno: string) => {
        analytics.track('was_this_helpful_feedback', { yesno, page });
        setIsClicked(true);
    };

    // I am only creating these here bc of jsx-no-lambda tslint rule
    const voteYes = () => vote('yes');
    const voteNo = () => vote('no');

    return (
        <HelpfulCtaWrapper>
            {isClicked ? (
                <CtaTextAnimated>{note}</CtaTextAnimated>
            ) : (
                <>
                    <CtaText>{question}</CtaText>
                    <CtaButtons>
                        <CtaButton onClick={voteYes} color={colors.white}>
                            Yes
                        </CtaButton>
                        <CtaButton
                            onClick={voteNo}
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
    note: 'Thank you for letting us know 🙏',
};

const HelpfulCtaWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 1.875rem;

    @media (max-width: 500px) {
        flex-direction: column;
    }
`;

const CtaText = styled(Paragraph)`
    color: ${colors.textDarkPrimary};
    font-size: 1.1rem;
    font-weight: 400;
    line-height: 40px; /* button line-height + button border */
    margin-bottom: 0;

    @media (max-width: 500px) {
        margin-bottom: 12px;
    }
`;

const CtaTextAnimated = styled(CtaText)`
    animation: ${fadeIn} 0.5s ease-in-out;
`;

const CtaButtons = styled.div`
    display: flex;
    align-items: center;
    margin-left: 40px;

    @media (max-width: 500px) {
        margin-left: 0;
    }
`;

const CtaButton = styled(Button)`
    padding: 0 30px;
    line-height: 38px; /* +2 px for border */
    font-size: 1rem;

    & + & {
        margin-left: 10px;
    }
`;
