import * as React from 'react';
import styled from 'styled-components';

interface Props {
    isPadded: boolean;
    bgColor?: 'dark' | 'light' | string;
}

export const Section = (props: Props) => (
    <SectionBase bgColor={props.bgColor}>
        <Wrap
            isPadded={props.isPadded}
        >
            {props.children}
        </Wrap>
    </SectionBase>
);

Section.defaultProps = {
    isPadded: true,
};

const SectionBase = styled.section`
    width: calc(100% - 60px);
    margin: 0 auto;
    padding: 120px 0;
    background-color: ${props => props.theme[`${props.bgColor}BgColor`] || props.bgColor};

    @media (max-width: 768px) {
        padding: 40px 0;
    }
`;

const Wrap = styled.div`
    width: calc(100% - 60px);
    max-width: 895px;
    margin: 0 auto;
    text-align: center;
`;
