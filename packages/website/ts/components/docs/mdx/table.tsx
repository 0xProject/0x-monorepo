import styled from 'styled-components';

import { colors } from 'ts/style/colors';
import { docs} from 'ts/style/docs';

export const Table = styled.table`
    border: 1px solid #cfcfcf;
    margin-bottom:  ${docs.marginBottom};
    width: 100%;

    th {
        font-size: 0.888888889rem;
        font-weight: 400;
        padding: 14px 20px 13px;
        border-bottom: 1px solid #cfcfcf;
        text-align: left;
    }

    td {
        padding: 14px 20px 13px;
        border-bottom: 1px solid #cfcfcf;
        font-size: 0.777777778rem;
        opacity: 0.76;
        line-height: 1.428571429;
    }

    td + td,
    th + th {
        border-left: 1px solid #cfcfcf;
    }

    tr {
        border-collapse: collapse;
    }

    tr:nth-child(even) td {
        background-color: ${colors.backgroundLight};
    }

    code {
        background-color: rgba(0, 56, 49, 0.1);
        border-radius: 3px;
        border: 0;
        font-size: 1em;
        padding: 2px 5px;
        color: ${colors.brandDark};
        font-family: inherit;
    }
`;
