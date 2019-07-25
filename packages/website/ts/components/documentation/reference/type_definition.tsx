import { CustomType, CustomTypeChild, TypeDefinitionByName, TypeDocTypes } from '@0x/types';
import { errorUtils } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { AnchorTitle } from 'ts/components/documentation/shared/anchor_title';

import { HeaderSizes, KindString, SupportedDocJson } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { constants } from 'ts/utils/constants';
import { DocsInfo } from 'ts/utils/docs_info';

import { Comment } from './comment';
import { CustomEnum } from './custom_enum';
import { Enum } from './enum';
import { Interface } from './interface';
import { Signature } from './signature';
import { Type } from './type';

export interface TypeDefinitionProps {
    sectionName: string;
    customType: CustomType;
    shouldAddId?: boolean;
    docsInfo: DocsInfo;
    typeDefinitionByName?: TypeDefinitionByName;
    isInPopover?: boolean;
}

export interface TypeDefinitionState {
    shouldShowAnchor: boolean;
}

export class TypeDefinition extends React.Component<TypeDefinitionProps, TypeDefinitionState> {
    public static defaultProps: Partial<TypeDefinitionProps> = {
        shouldAddId: true,
        isInPopover: false,
    };
    constructor(props: TypeDefinitionProps) {
        super(props);
        this.state = {
            shouldShowAnchor: false,
        };
    }
    public render(): React.ReactNode {
        const customType = this.props.customType;

        let typePrefix: string;
        let codeSnippet: React.ReactNode;
        switch (customType.kindString) {
            case KindString.Interface:
                typePrefix = this.props.docsInfo.type === SupportedDocJson.SolDoc ? 'Struct' : 'Interface';
                codeSnippet = (
                    <Interface
                        type={customType}
                        sectionName={this.props.sectionName}
                        docsInfo={this.props.docsInfo}
                        typeDefinitionByName={this.props.typeDefinitionByName}
                        isInPopover={this.props.isInPopover}
                    />
                );
                break;

            case KindString.Variable:
                typePrefix = 'Enum';
                codeSnippet = <CustomEnum type={customType} />;
                break;

            case KindString.Enumeration:
                typePrefix = 'Enum';
                const enumValues = _.map(customType.children, (c: CustomTypeChild) => {
                    return {
                        name: c.name,
                        defaultValue: c.defaultValue,
                    };
                });
                codeSnippet = <Enum values={enumValues} />;
                break;

            case KindString.TypeAlias:
                typePrefix = 'Type Alias';
                codeSnippet = (
                    <span>
                        <span style={{ color: colors.lightPurple }}>type</span> {customType.name} ={' '}
                        {customType.type.typeDocType !== TypeDocTypes.Reflection ? (
                            <Type
                                type={customType.type}
                                sectionName={this.props.sectionName}
                                docsInfo={this.props.docsInfo}
                                typeDefinitionByName={this.props.typeDefinitionByName}
                                isInPopover={this.props.isInPopover}
                            />
                        ) : (
                            <Signature
                                name={customType.type.method.name}
                                returnType={customType.type.method.returnType}
                                parameters={customType.type.method.parameters}
                                typeParameter={customType.type.method.typeParameter}
                                callPath={customType.type.method.callPath}
                                sectionName={this.props.sectionName}
                                shouldHideMethodName={true}
                                shouldUseArrowSyntax={true}
                                docsInfo={this.props.docsInfo}
                                typeDefinitionByName={this.props.typeDefinitionByName}
                                isInPopover={this.props.isInPopover}
                            />
                        )}
                    </span>
                );
                break;

            default:
                throw errorUtils.spawnSwitchErr('type.kindString', customType.kindString);
        }

        const typeDefinitionAnchorId = `${this.props.sectionName}-${customType.name}`;
        return (
            <div
                id={this.props.shouldAddId ? typeDefinitionAnchorId : ''}
                className="pb2 pt2"
                style={{ overflow: 'hidden', width: '100%' }}
                onMouseOver={this._setAnchorVisibility.bind(this, true)}
                onMouseOut={this._setAnchorVisibility.bind(this, false)}
            >
                <AnchorTitle
                    headerSize={HeaderSizes.H3}
                    title={`${typePrefix} ${customType.name}`}
                    id={this.props.shouldAddId ? typeDefinitionAnchorId : ''}
                    shouldShowAnchor={this.state.shouldShowAnchor}
                    isDisabled={this.props.isInPopover}
                />
                <div style={{ fontSize: 16 }}>
                    <pre>
                        <code className={`hljs ${constants.TYPE_TO_SYNTAX[this.props.docsInfo.type]}`}>
                            {codeSnippet}
                        </code>
                    </pre>
                </div>
                <div style={{ maxWidth: 620 }}>
                    {customType.comment && (
                        <Comment comment={this._formatComment(customType.comment)} className="py2" />
                    )}
                </div>
            </div>
        );
    }
    private _setAnchorVisibility(shouldShowAnchor: boolean): void {
        this.setState({
            shouldShowAnchor,
        });
    }
    /**
     * Type definition comments usually describe the type as a whole or the individual
     * properties within the type. Since TypeDoc just treats these comments simply as
     * one paragraph, we do some additional formatting so that we can display individual
     * property comments on their own lines.
     * E.g:
     * Interface SomeConfig
     * {
     *   networkId: number,
     *   derivationPath: string,
     * }
     * networkId: The ethereum networkId to set as the chainId from EIP155
     * derivationPath: Initial derivation path to use e.g 44'/60'/0'
     *
     * Each property description should be on a new line.
     */
    private _formatComment(text: string): string {
        const NEW_LINE_REGEX = /(\r\n|\n|\r)/gm;
        const sanitizedText = text.replace(NEW_LINE_REGEX, ' ');
        const PROPERTY_DESCRIPTION_DIVIDER = ':';
        if (!_.includes(sanitizedText, PROPERTY_DESCRIPTION_DIVIDER)) {
            return sanitizedText;
        }
        const segments = sanitizedText.split(PROPERTY_DESCRIPTION_DIVIDER);
        _.each(segments, (s: string, i: number) => {
            if (i === 0) {
                segments[i] = `**${s}**`;
                return;
            } else if (i === segments.length - 1) {
                return;
            }
            const words = s.split(' ');
            const property = words[words.length - 1];
            words[words.length - 1] = `\n\n**${property}**`;
            segments[i] = words.join(' ');
        });
        const final = segments.join(PROPERTY_DESCRIPTION_DIVIDER);
        return final;
    }
}
