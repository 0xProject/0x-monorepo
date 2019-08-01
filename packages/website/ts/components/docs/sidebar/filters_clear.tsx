import { ClearRefinements } from 'react-instantsearch-dom';

import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export const FiltersClear = styled(ClearRefinements)`
    button {
        border: none;
        background: none;
        cursor: pointer;
        padding: 0;
        font-size: 0.83rem;
        color: ${colors.brandDark};
        transition: opacity 300ms ease-in-out;

        &[disabled] {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
`;
