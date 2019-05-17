import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Heading, Paragraph } from 'ts/components/text';
import { Section } from 'ts/components/newLayout';

interface Props {
    children?: React.ReactNode;
    showcaseImgSrc: string;
    maxWidth?: string;
    sectionPadding?: string;
}

const ShowcaseImg = styled.img`
    position: absolute; 
    top: 0;
    bottom: 0;
    right: 0;
    margin: auto 0 auto 0;
    max-width: 40%;
    height: 100%;
`;

interface WrapProps {
    sectionPadding?: string;
}

const Wrap = styled.div<WrapProps>`
    position: relative;
    padding: ${props => props.sectionPadding ||  "0 0"};
`;

export const ShowcaseSection = (props: Props) => <Wrap>
        <Section maxWidth={props.maxWidth} padding={"80px 0"}>
            {props.children}
        </Section>
        <ShowcaseImg src={props.showcaseImgSrc}/>
    </Wrap>