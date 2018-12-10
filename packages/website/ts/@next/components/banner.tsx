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
                        <Heading isNoMargin={true}>{heading}</Heading>
                        {subline && <Paragraph isMuted={true} isNoMargin={true}>{subline}</Paragraph>}
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

// Note let's refactor this
// is it absolutely necessary to have a stateless component
// to pass props down into the styled icon?
const Border = styled.div<BorderProps>`
    position: absolute;
    background-image: url("data:image/svg+xml;utf8,<svg width='218' height='41' viewBox='0 0 218 41' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M109 39c59.094 0 107-47.906 107-107 0-59.095-47.906-107-107-107S2-127.095 2-68C2-8.907 49.906 39 109 39z' stroke='rgba(255, 255, 255, 0.1)' stroke-width='3' stroke-miterlimit='10'/><path d='M55 6.688L109-68l54 74.688-8.917 22.313H63.988L55 6.688zM109-68l22 97M109-68L87 29M164 6H55' stroke='rgba(255, 255, 255, 0.1)' stroke-width='3' stroke-miterlimit='10'/></svg>");
    left: 0;
    width: calc(100% + 214px);
    height: 40px;
    top: ${props => !props.isBottom && 0 };
    bottom: ${props => props.isBottom && 0 };
    transform: ${props => props.isBottom ? 'rotate(180deg) translate(112px)' : 'translate(-112px)' };
`;
