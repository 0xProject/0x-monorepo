import styled from 'styled-components';
import { colors } from 'ts/style/colors';

export const UnorderedList = styled.ul`
    list-style-type: disc;
    margin-bottom: 1.875rem;
    padding-left: 1rem;

    li {
        color: ${colors.textDarkSecondary};
        font-size: 1rem;
        font-weight: 300;
        line-height: 1.625em;
        margin-bottom: 1rem;
        line-height: 1;
        opacity: 0.75;
    }
`;
