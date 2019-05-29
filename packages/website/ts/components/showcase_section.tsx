import * as React from 'react';
import styled from 'styled-components';

interface Props {
    children?: React.ReactNode;
    showcaseImgSrc: string;
    maxWidth?: string;
    sectionPadding?: string;
    paddingMobile?: string;
}

const ShowcaseSideImg = styled.img`
    position: absolute;
    top: 0;
    bottom: 0;
    right: -10rem;
    margin: auto 0 auto 0;
    width: 60%;
    max-width: 800px;
    height: 100%;
    @media (max-width: 900px) {
        position: relative;
        right: 0;
        display: block;
        width: 100%;
        padding: 0 30px;
    }

    @media (min-width: 1800px) {
        display: none;
    }
`;

const ShowcaseImg = styled.img`
    display: none;
    @media (min-width: 1800px) {
        width: auto;
        max-height: 500px;
        display: block;
    }
`;

interface SectionProps {
    sectionPadding?: string;
    paddingMobile?: string;
}

const Section = styled.section<SectionProps>`
    position: relative;
    padding: ${props => props.sectionPadding || '0 0'};
    @media (max-width: 768px) {
        padding: ${props => props.paddingMobile || '40px 0'};
    }
    margin: 0 auto;
`;

interface WrapProps {
    padding?: string;
    maxWidth?: string;
}

const Wrap = styled.div<WrapProps>`
    display: flex;
    align-self: center;
    width: calc(100% - 60px);
    margin: 0 auto;
    padding: ${props => props.padding || '120px 0'};
    max-width: ${props => props.maxWidth || '100%'};
    @media (min-width: 1800px) {
        max-width: 1500px;
    }
`;

const ContentWrap = styled.div`
    width: 50%;
    display: flex;
    align-self: center;
    @media (max-width: 900px) {
        width: 100%;
    }
`;

export const ShowcaseSection = (props: Props) => (
    <Section paddingMobile={props.paddingMobile} sectionPadding={props.sectionPadding}>
        <ShowcaseSideImg src={props.showcaseImgSrc} />
        <Wrap maxWidth={props.maxWidth} padding={'80px 0'}>
            <ContentWrap>{props.children}</ContentWrap>
            <ShowcaseImg src={props.showcaseImgSrc} />
        </Wrap>
    </Section>
);
