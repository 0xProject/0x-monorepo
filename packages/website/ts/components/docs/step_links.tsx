import * as _ from 'lodash';
import * as React from 'react';
import styled, { withTheme } from 'styled-components';

import { StepLink, StepLinkConfig } from 'ts/components/docs/step_link';
import { colors } from 'ts/style/colors';

export interface LinkProps {
    links: StepLinkConfig[];
}

export const StepLinks: React.FunctionComponent<LinkProps> = (props: LinkProps) => (
    <>
        <Wrapper>
            {props.links.map((shortcut, index) => <StepLink key={`step-${index}`} {...shortcut} />)}
        </Wrapper>
    </>
);

StepLinks.defaultProps = {
    links: [],
};

const Wrapper = styled.div`
    background-color: ${colors.backgroundLight};
    border: 1px solid #DBDFDD;
    margin-bottom: 1.875rem;
`;
