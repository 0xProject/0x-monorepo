import { AnchorTitle, colors, HeaderSizes } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { CustomType, CustomTypeChild, KindString, TypeDocTypes } from '../types';
import { utils } from '../utils/utils';

import { Comment } from './comment';
import { CustomEnum } from './custom_enum';
import { DocsInfo } from './docs_info';
import { Enum } from './enum';
import { Interface } from './interface';
import { MethodSignature } from './method_signature';
import { Type } from './type';

export interface TypeDefinitionProps {
    sectionName: string;
    customType: CustomType;
    shouldAddId?: boolean;
    docsInfo: DocsInfo;
}

export interface TypeDefinitionState {
    shouldShowAnchor: boolean;
}

export class TypeDefinition extends React.Component<TypeDefinitionProps, TypeDefinitionState> {
    public static defaultProps: Partial<TypeDefinitionProps> = {
        shouldAddId: true,
    };
    constructor(props: TypeDefinitionProps) {
        super(props);
        this.state = {
            shouldShowAnchor: false,
        };
    }
    public render() {
        const customType = this.props.customType;
        if (!this.props.docsInfo.isPublicType(customType.name)) {
            return null; // no-op
        }

        let typePrefix: string;
        let codeSnippet: React.ReactNode;
        switch (customType.kindString) {
            case KindString.Interface:
                typePrefix = 'Interface';
                codeSnippet = (
                    <Interface type={customType} sectionName={this.props.sectionName} docsInfo={this.props.docsInfo} />
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
                            />
                        ) : (
                            <MethodSignature
                                method={customType.type.method}
                                sectionName={this.props.sectionName}
                                shouldHideMethodName={true}
                                shouldUseArrowSyntax={true}
                                docsInfo={this.props.docsInfo}
                            />
                        )}
                    </span>
                );
                break;

            default:
                throw utils.spawnSwitchErr('type.kindString', customType.kindString);
        }

        const typeDefinitionAnchorId = `${this.props.sectionName}-${customType.name}`;
        return (
            <div
                id={this.props.shouldAddId ? typeDefinitionAnchorId : ''}
                className="pb2"
                style={{ overflow: 'hidden', width: '100%' }}
                onMouseOver={this._setAnchorVisibility.bind(this, true)}
                onMouseOut={this._setAnchorVisibility.bind(this, false)}
            >
                <AnchorTitle
                    headerSize={HeaderSizes.H3}
                    title={`${typePrefix} ${customType.name}`}
                    id={this.props.shouldAddId ? typeDefinitionAnchorId : ''}
                    shouldShowAnchor={this.state.shouldShowAnchor}
                />
                <div style={{ fontSize: 16 }}>
                    <pre>
                        <code className="hljs">{codeSnippet}</code>
                    </pre>
                </div>
                <div style={{ maxWidth: 620 }}>
                    {customType.comment && <Comment comment={customType.comment} className="py2" />}
                </div>
            </div>
        );
    }
    private _setAnchorVisibility(shouldShowAnchor: boolean) {
        this.setState({
            shouldShowAnchor,
        });
    }
}
