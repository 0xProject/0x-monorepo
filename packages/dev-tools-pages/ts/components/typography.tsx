import styled from 'styled-components';

import { media } from '../variables';

const Alpha = styled.h2`
    font-size: 1.75rem;
    line-height: 1;

    ${media.small`font-size: 1.5rem;`};
`;

const Beta = styled.h3`
    font-size: 1.25rem;
    line-height: 1.65;
`;

const Gamma = styled.h4`
    font-size: 1rem;

    ${media.small`font-size: 0.875rem;`};
`;

const Lead = styled.p`
    font-size: 1.25rem;
    line-height: 1.6;
    ${media.small`font-size: 1rem;`};
`;

const Small = styled.p`
    font-size: 0.875rem;
`;

export { Alpha, Beta, Gamma, Lead, Small };
