import * as React from 'react';
import styled from 'styled-components';

import {colors} from 'ts/style/colors';

import {Button, ButtonWrap} from 'ts/@next/components/button';
import { Column, Section, Wrap, WrapCentered } from 'ts/@next/components/layout';
import {Paragraph, Heading} from 'ts/@next/components/text';
import { ThemeInterface } from 'ts/@next/components/siteWrap';

interface Props {
    heading?: string;
    subline?: string;
    mainCta?: CTAButton;
    secondaryCta?: CTAButton;
    theme?: ThemeInterface;
}

interface CTAButton {
    text: string;
    href: string;
}

interface BorderProps {
    isBottom?: boolean;
}

export const Banner: React.StatelessComponent<Props> = (props: Props) => {
    const {
        heading,
        subline,
        mainCta,
        secondaryCta,
    } = props;
    return (
        <Section bgColor={colors.brandDark} isRelative={true}>
            <Border/>
            <Wrap>
                <CustomColumn colWidth="1/2" isPadLarge={true}>
                    <WrapCentered>
                        <CustomHeading isNoMargin={true}>{heading}</CustomHeading>
                        {subline && <Paragraph isMuted={0.5} isNoMargin={true}>{subline}</Paragraph>}
                    </WrapCentered>
                </CustomColumn>
                <CustomColumn colWidth="1/2" isPadLarge={true}>
                    <WrapCentered>
                        <ButtonWrap>
                            {mainCta && <Button href={mainCta.href}>{mainCta.text}</Button>}
                            {secondaryCta && <Button href={secondaryCta.href} isTransparent={true}>{secondaryCta.text}</Button>}
                        </ButtonWrap>
                    </WrapCentered>
                </CustomColumn>
            </Wrap>
            <Border isBottom={true} />
        </Section>
    );
};

const CustomColumn = styled(Column)`
    padding: 95px 30px;
`;

const CustomHeading = styled(Heading)`
    --defaultHeading: 1.888888889rem;
    font-weight: 400;
    margin-bottom: 10px;
`;

// Note let's refactor this
// is it absolutely necessary to have a stateless component
// to pass props down into the styled icon?
const Border = styled.div<BorderProps>`
    position: absolute;
    background-image: ${props => props.isBottom ? 'url(/images/@next/banner/bottomofcta.png);': 'url(/images/@next/banner/topofcta.png);' };
    background-position: ${props => props.isBottom ? 'left top' : 'left bottom' };
    left: 0;
    width: calc(100% + 214px);
    height: 40px;
    top: ${props => !props.isBottom && 0 };
    bottom: ${props => props.isBottom && 0 };
    transform: translate(-112px);
`;
