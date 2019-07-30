import * as _ from 'lodash';
import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { styled } from 'ts/style/theme';
import { Deco, Key, TutorialInfo } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { Translate } from 'ts/utils/translate';

import { Link } from './shared/link';

export interface TutorialButtonProps {
    className?: string;
    translate: Translate;
    tutorialInfo: TutorialInfo;
}

const PlainTutorialButton: React.StatelessComponent<TutorialButtonProps> = ({ translate, tutorialInfo, className }) => (
    <Container className={className}>
        <Link to={tutorialInfo.link.to} shouldOpenInNewTab={tutorialInfo.link.shouldOpenInNewTab}>
            <div className="flex relative">
                <div className="col col-1 flex items-center sm-pr3">
                    <img src={tutorialInfo.iconUrl} height={40} />
                </div>
                <div className="lg-pl2 md-pl2 sm-pl3 col col-10">
                    <Text Tag="div" fontSize="18" fontColor={colors.lightLinkBlue} fontWeight="bold">
                        {translate.get(tutorialInfo.link.title as Key, Deco.Cap)}
                    </Text>
                    <Text Tag="div" fontColor={colors.grey750} fontSize="16">
                        {translate.get(tutorialInfo.description as Key, Deco.Cap)}
                    </Text>
                </div>
                <div className="col col-1 flex items-center justify-end">
                    <div className="right">
                        <i
                            className="zmdi zmdi-chevron-right bold"
                            style={{ fontSize: 26, color: colors.lightLinkBlue }}
                        />
                    </div>
                </div>
            </div>
        </Link>
    </Container>
);

export const TutorialButton = styled(PlainTutorialButton)`
    border-radius: 4px;
    border: 1px solid ${colors.grey325};
    background-color: ${colors.white};
    &:hover {
        border: 1px solid ${colors.lightLinkBlue};
        background-color: ${colors.lightestBlue};
    }
    padding: 20px;
    margin-bottom: 15px;
`;

TutorialButton.defaultProps = {};

TutorialButton.displayName = 'TutorialButton';
