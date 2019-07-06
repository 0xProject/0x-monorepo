import React from 'react';

import { Button } from 'ts/components/button';

import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

export const CodeRun: React.FC = () => {
    // @TODO: add code running logic
    return (
        <RunCodeWrapper>
            <RunCodeButtons>
                <RunButton>Run</RunButton>
                <ResetButton>Reset</ResetButton>
            </RunCodeButtons>
            <RunCodeResult />
        </RunCodeWrapper>
    );
};

const GUTTER = '10px';
const BORDER_RADIUS = '4px';

const RunCodeWrapper = styled.div`
    display: flex;
    margin-top: ${GUTTER};
`;

const RunCodeButtons = styled.div`
    display: flex;
    flex-direction: column;
    margin-right: ${GUTTER};
`;

const ActionButton = styled(Button)`
    width: 112px;
    height: 40px;
    line-height: 0;
`;

const RunButton = styled(ActionButton)`
    background-color: ${colors.brandDark};
    color: white;
    margin-bottom: 4px;
`;

const ResetButton = styled(ActionButton)`
    background-color: white;
    color: ${colors.brandDark};
`;

const RunCodeResult = styled.div`
    background: white;
    border: 1px solid ${colors.brandDark};
    border-radius: ${BORDER_RADIUS};
    padding: 10px;
    width: 100%;
    min-height: 100%;
`;
