import React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';
import { zIndex } from 'ts/style/z_index';

import { Button } from 'ts/components/button';
import { Paragraph } from 'ts/components/text';

import { IThemeInterface } from 'ts/style/theme';

import { Column, Section, SectionProps } from 'ts/components/newLayout';

interface Props {
    heading?: string;
    subline?: string;
    onDismiss?: () => void;
    mainCta?: CTAButton;
    secondaryCta?: CTAButton;
    theme?: IThemeInterface;
    dismissed?: boolean;
}

interface CTAButton {
    text: string;
    href?: string;
    onClick?: () => void;
    shouldOpenInNewTab?: boolean;
}

interface BorderProps {
    isBottom?: boolean;
}

export const ANNOUNCEMENT_BANNER_HEIGHT = '14rem';

export const AnnouncementBanner: React.StatelessComponent<Props> = (props: Props) => {
    const { heading, subline, mainCta, secondaryCta } = props;
    return (
        <CustomSection bgColor={colors.brandDark} paddingMobile="120px 0" dismissed={props.dismissed}>
            <Border />
            <Border isBottom={true} />
            <BannerContentWrapper>
                <Column maxWidth="755px">
                    <CustomHeading>{heading}</CustomHeading>

                    {subline && (
                        <CustomParagraph color={colors.white} isMuted={0.5} isNoMargin={true}>
                            {subline}
                        </CustomParagraph>
                    )}
                </Column>
                <ColumnCta>
                    <ButtonWrap>
                        <Button
                            color={'rgba(255,255,255,0.6)'}
                            isTransparent={true}
                            isNoBorder={true}
                            borderColor={'rgba(0,0,0,0)'}
                            onClick={props.onDismiss}
                        >
                            Dismiss
                        </Button>
                        {mainCta && (
                            <Button
                                color={colors.white}
                                isTransparent={false}
                                href={mainCta.href}
                                onClick={mainCta.onClick}
                                target={mainCta.shouldOpenInNewTab ? '_blank' : ''}
                            >
                                {mainCta.text}
                            </Button>
                        )}

                        {secondaryCta && (
                            <SecondaryButtonWrapper>
                                <Button
                                    color={colors.white}
                                    href={secondaryCta.href}
                                    onClick={secondaryCta.onClick}
                                    target={secondaryCta.shouldOpenInNewTab ? '_blank' : ''}
                                    isTransparent={true}
                                >
                                    {secondaryCta.text}
                                </Button>
                            </SecondaryButtonWrapper>
                        )}
                    </ButtonWrap>
                </ColumnCta>
            </BannerContentWrapper>
        </CustomSection>
    );
};

interface CustomSectionProps extends SectionProps {
    dismissed: boolean;
}

const SecondaryButtonWrapper = styled.div`
    display: inline-block;
    @media (max-width: 56rem) {
        display: none;
    }
`;

const BannerContentWrapper = styled.div`
    max-width: 1200px;
    display: flex;
    margin: auto;
    padding: 0 20px;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    @media (max-width: 56rem) {
        flex-direction: column;
    }
`;

const CustomParagraph = styled(Paragraph)`
    @media (max-width: 56rem) {
        display: none;
    }
`;

const CustomSection = styled(Section)<CustomSectionProps>`
    color: ${colors.white};
    position: fixed;
    height: ${ANNOUNCEMENT_BANNER_HEIGHT};
    top: 0;
    left: 0;
    right: 0;
    z-index: ${zIndex.announcementBanner};
    padding: 0 1px;
    margin: 0;
    max-width: 100%;
    width: inherit;
    transition: 300ms transform ease-in-out;
    transform: translateY(-${props => (props.dismissed ? '100%' : '0')});
    font-family: Formular, sans-serif;
    @media (max-width: 900px) {
        align-items: center;
        display: flex;
        flex-direction: column;
        text-align: center;

        p {
            margin-bottom: 30px;
        }

        div:last-child {
            margin-bottom: 0;
        }
    }
`;

const ColumnCta = styled(Column)`
    flex-shrink: 0;
`;

const CustomHeading = styled.h2`
    font-size: 28px;
    line-height: normal;
    font-weight: 400;
    margin-bottom: 10px;

    @media (max-width: 768px) {
        font-size: 24px;
    }
`;

const ButtonWrap = styled.div`
    display: inline-block;
    & > button,
    a {
        margin: 0 12px;
    }
    & *:first-child {
        margin-left: 0;
    }
    & *:last-child {
        margin-right: 0;
    }
    @media (max-width: 768px) {
        display: flex;
        flex-direction: column-reverse;
        & > button,
        a {
            margin: 0;
        }
    }
`;

// Note let's refactor this
// is it absolutely necessary to have a stateless component
// to pass props down into the styled icon?
const Border = styled.div<BorderProps>`
    position: absolute;
    background-image: ${props =>
        props.isBottom ? 'url(/images/banner/bottomofcta.png);' : 'url(/images/banner/topofcta.png);'};
    background-position: ${props => (props.isBottom ? 'left top' : 'left bottom')};
    left: 0;
    width: calc(100% + 214px);
    height: 40px;
    top: ${props => !props.isBottom && 0};
    bottom: ${props => props.isBottom && 0};
    transform: translate(-112px);
    z-index: 0;
    pointer-events: none;
    @media (max-width: 768px) {
        width: calc(100% + 82px);
        height: 40px;
        transform: translate(-41px);
        background-size: auto 80px;
    }
`;
