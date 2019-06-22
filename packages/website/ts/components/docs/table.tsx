import * as _ from 'lodash';
import * as React from 'react';
import styled, { withTheme } from 'styled-components';
import { colors } from 'ts/style/colors';

export interface Props {
    children: React.ReactNode;
}

export const Table: React.FunctionComponent<Props> = (props: Props) => (
    <>
        <Wrapper>
            {props.children}
        </Wrapper>
    </>
);

Table.defaultProps = {
};

const Wrapper = styled.table`
    border: 1px solid #CFCFCF;
    margin-bottom: 1.875rem;
    width: 100%;

    th {
        font-size: 1rem;
        font-weight: 500;
        padding: 14px 20px 13px;
        border-bottom: 1px solid #CFCFCF;
        text-align: left;
    }

    td {
        padding: 14px 20px 13px;
        border-bottom: 1px solid #CFCFCF;
        font-size: 0.875rem;
        opacity: 0.76;
    }

    td + td,
    th + th {
        border-left: 1px solid #CFCFCF;
    }

    tr {
        border-collapse: collapse;
    }

    tr:nth-child(even) td {
        background-color: ${colors.backgroundLight};
    }
`;
