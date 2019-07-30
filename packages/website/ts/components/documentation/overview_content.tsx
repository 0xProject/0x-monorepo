import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import { Element as ScrollElement } from 'react-scroll';
import { Link } from 'ts/components/documentation/shared/link';
import { MarkdownLinkBlock } from 'ts/components/documentation/shared/markdown_link_block';
import { TutorialButton } from 'ts/components/documentation/tutorial_button';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { Deco, Key, Package, TutorialInfo } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

export interface OverviewContentProps {
    translate: Translate;
    tutorials: TutorialInfo[];
    categoryToPackages: ObjectMap<Package[]>;
}

export interface OverviewContentState {}

export class OverviewContent extends React.Component<OverviewContentProps, OverviewContentState> {
    public render(): React.ReactNode {
        return (
            <Container>
                {this._renderSectionTitle(this.props.translate.get(Key.StartBuildOn0x, Deco.Cap))}
                <Container paddingTop="12px">
                    {this._renderSectionDescription(this.props.translate.get(Key.StartBuildOn0xDescription, Deco.Cap))}
                    <Container marginTop="36px">
                        {_.map(this.props.tutorials, tutorialInfo => (
                            <ScrollElement
                                name={utils.getIdFromName(
                                    this.props.translate.get(tutorialInfo.link.title as Key, Deco.Cap),
                                )}
                                key={`tutorial-${tutorialInfo.link.title}`}
                            >
                                <TutorialButton translate={this.props.translate} tutorialInfo={tutorialInfo} />
                            </ScrollElement>
                        ))}
                    </Container>
                </Container>
                <Container marginTop="32px" paddingBottom="100px">
                    {this._renderSectionTitle(this.props.translate.get(Key.LibrariesAndTools, Deco.CapWords))}
                    <Container paddingTop="12px">
                        {this._renderSectionDescription(
                            this.props.translate.get(Key.LibrariesAndToolsDescription, Deco.Cap),
                        )}
                        <Container marginTop="36px">
                            {_.map(this.props.categoryToPackages, (pkgs, category) =>
                                this._renderPackageCategory(category, pkgs),
                            )}
                        </Container>
                    </Container>
                </Container>
            </Container>
        );
    }
    private _renderPackageCategory(category: string, pkgs: Package[]): React.ReactNode {
        return (
            <Container key={`category-${category}`}>
                <Text fontSize="18px">{category}</Text>
                <Container>{_.map(pkgs, pkg => this._renderPackage(pkg))}</Container>
            </Container>
        );
    }
    private _renderPackage(pkg: Package): React.ReactNode {
        const id = utils.getIdFromName(pkg.link.title);
        return (
            <ScrollElement name={id} key={`package-${pkg.link.title}`}>
                <Container className="pb2">
                    <Container width="100%" height="1px" backgroundColor={colors.grey300} marginTop="11px" />
                    <Container className="clearfix mt2 pt1">
                        <Container className="md-col lg-col md-col-4 lg-col-4">
                            <Link
                                to={pkg.link.to}
                                fontColor={colors.lightLinkBlue}
                                shouldOpenInNewTab={!!pkg.link.shouldOpenInNewTab}
                            >
                                <Text Tag="div" fontColor={colors.lightLinkBlue} fontWeight="bold">
                                    {pkg.link.title}
                                </Text>
                            </Link>
                        </Container>
                        <Container className="md-col lg-col md-col-6 lg-col-6 sm-py2">
                            <Text fontColor={colors.grey700}>
                                <ReactMarkdown
                                    source={pkg.description}
                                    renderers={{
                                        link: MarkdownLinkBlock,
                                        paragraph: 'span',
                                    }}
                                />
                            </Text>
                        </Container>
                        <Container className="md-col lg-col md-col-2 lg-col-2 sm-pb2 relative">
                            <Container position="absolute" right="0px">
                                <Link
                                    to={pkg.link.to}
                                    fontColor={colors.lightLinkBlue}
                                    shouldOpenInNewTab={!!pkg.link.shouldOpenInNewTab}
                                >
                                    <Container className="flex">
                                        <Container>{this.props.translate.get(Key.More, Deco.Cap)}</Container>
                                        <Container paddingTop="1px" paddingLeft="6px">
                                            <i
                                                className="zmdi zmdi-chevron-right bold"
                                                style={{ fontSize: 18, color: colors.lightLinkBlue }}
                                            />
                                        </Container>
                                    </Container>
                                </Link>
                            </Container>
                        </Container>
                    </Container>
                </Container>
            </ScrollElement>
        );
    }
    private _renderSectionTitle(text: string): React.ReactNode {
        return (
            <Container paddingTop="30px">
                <Text fontColor={colors.projectsGrey} fontSize="30px" fontWeight="bold">
                    {text}
                </Text>
            </Container>
        );
    }
    private _renderSectionDescription(text: string): React.ReactNode {
        return (
            <Text fontColor={colors.linkSectionGrey} fontSize="16px" fontFamily="Roboto Mono">
                {text}
            </Text>
        );
    }
} // tslint:disable:max-file-line-count
