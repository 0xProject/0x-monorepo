import * as React from 'react';
import styled from 'styled-components';
import { addFadeInAnimation } from 'ts/constants/animations';

import { Announcement, AnnouncementProps } from './announcement';

interface Props {
    title: string;
    maxWidth?: string;
    maxWidthHeading?: string;
    isLargeTitle?: boolean;
    isFullWidth?: boolean;
    isCenteredMobile?: boolean;
    description: string;
    figure?: React.ReactNode;
    actions?: React.ReactNode;
    background?: React.ReactNode;
    announcement?: AnnouncementProps;
    sectionPadding?: string;
    showFigureBottomMobile?: boolean;
}

interface SectionProps {
    isAnnouncement?: boolean;
    padding?: string;
}

const Section = styled.section<SectionProps>`
    padding: ${props => props.padding || (props.isAnnouncement ? '50px 0 120px 0' : '120px 0')};
    position: relative;
    @media (max-width: 768px) {
        padding: 60px 0;
    }
`;

interface WrapProps {
    isCentered?: boolean;
    isFullWidth?: boolean;
    isCenteredMobile?: boolean;
    showFigureBottomMobile?: boolean;
}
const Wrap = styled.div<WrapProps>`
    width: calc(100% - 60px);
    margin: 0 auto;

    @media (min-width: 768px) {
        max-width: ${props => (!props.isFullWidth ? '895px' : '1136px')};
        flex-direction: row-reverse;
        display: flex;
        align-items: center;
        text-align: ${props => props.isCentered && 'center'};
        justify-content: ${props => (props.isCentered ? 'center' : 'space-between')};
    }

    @media (max-width: 768px) {
        text-align: ${props => (props.isCenteredMobile ? `center` : 'left')};
        flex-direction: ${props => (props.showFigureBottomMobile ? 'column-reverse' : 'column')};
        display: flex;
        align-items: center;
    }
`;

interface TitleProps {
    isLarge?: any;
    maxWidth?: string;
}
const Title = styled.h1<TitleProps>`
    font-size: ${props => (props.isLarge ? '80px' : '50px')};
    font-weight: 300;
    line-height: 1.1;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 30px;
    max-width: ${props => props.maxWidth};
    ${addFadeInAnimation('0.5s')}

    @media (max-width: 1024px) {
        font-size: 60px;
    }

    @media (max-width: 768px) {
        font-size: 46px;
    }
`;

const Description = styled.p`
    font-size: 22px;
    line-height: 31px;
    font-weight: 300;
    padding: 0;
    margin-bottom: 50px;
    color: ${props => props.theme.introTextColor};
    ${addFadeInAnimation('0.5s', '0.15s')} @media (max-width: 1024px) {
        margin-bottom: 30px;
    }
`;

const Content = styled.div<{ width: string }>`
    width: 100%;

    @media (min-width: 768px) {
        max-width: ${props => props.width};
    }
`;

const ButtonWrap = styled.div`
    display: inline-flex;
    align-items: center;

    * + * {
        margin-left: 12px;
    }

    > *:nth-child(1) {
        ${addFadeInAnimation('0.6s', '0.3s')};
    }
    > *:nth-child(2) {
        ${addFadeInAnimation('0.6s', '0.4s')};
    }

    @media (max-width: 500px) {
        flex-direction: column;
        justify-content: center;

        > * {
            padding-left: 20px;
            padding-right: 20px;
        }

        * + * {
            margin-left: 0;
            margin-top: 12px;
        }
    }
`;

const BackgroundWrap = styled.div`
    position: absolute;
    overflow: hidden;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
`;

export class Hero extends React.Component<Props> {
    public static defaultProps = {
        isCenteredMobile: true,
    };
    public shouldComponentUpdate(): boolean {
        // The hero is a static component with animations.
        // We do not want state changes in parent components to re-trigger animations.
        return false;
    }
    public render(): React.ReactNode {
        const props = this.props;
        return (
            <Section padding={props.sectionPadding} isAnnouncement={!!props.announcement}>
                {!!props.background && <BackgroundWrap>{props.background}</BackgroundWrap>}
                <Wrap
                    isCentered={!props.figure}
                    isFullWidth={props.isFullWidth}
                    isCenteredMobile={props.isCenteredMobile}
                    showFigureBottomMobile={props.showFigureBottomMobile}
                >
                    {props.figure && <Content width="400px">{props.figure}</Content>}

                    <Content width={props.maxWidth ? props.maxWidth : props.figure ? '546px' : '678px'}>
                        {!!props.announcement && <Announcement {...props.announcement} />}
                        <Title isLarge={props.isLargeTitle} maxWidth={props.maxWidthHeading}>
                            {props.title}
                        </Title>

                        <Description>{props.description}</Description>

                        {props.actions && <ButtonWrap>{props.actions}</ButtonWrap>}
                    </Content>
                </Wrap>
            </Section>
        );
    }
}
