import * as _ from 'lodash';
import * as React from 'react';
import {Comment} from 'ts/pages/documentation/comment';
import {CustomEnum} from 'ts/pages/documentation/custom_enum';
import {DocsInfo} from 'ts/pages/documentation/docs_info';
import {Enum} from 'ts/pages/documentation/enum';
import {Interface} from 'ts/pages/documentation/interface';
import {MethodSignature} from 'ts/pages/documentation/method_signature';
import {Type} from 'ts/pages/documentation/type';
import {AnchorTitle} from 'ts/pages/shared/anchor_title';
import {CustomType, CustomTypeChild, HeaderSizes, KindString, TypeDocTypes} from 'ts/types';
import {constants} from 'ts/utils/constants';
import {typeDocUtils} from 'ts/utils/typedoc_utils';
import {utils} from 'ts/utils/utils';

const KEYWORD_COLOR = '#a81ca6';

interface TypeDefinitionProps {
    customType: CustomType;
    shouldAddId?: boolean;
    docsInfo: DocsInfo;
}

interface TypeDefinitionState {
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
                    <Interface
                        type={customType}
                        docsInfo={this.props.docsInfo}
                    />
                );
                break;

            case KindString.Variable:
                typePrefix = 'Enum';
                codeSnippet = (
                    <CustomEnum
                        type={customType}
                    />
                );
                break;

            case KindString.Enumeration:
                typePrefix = 'Enum';
                const enumValues = _.map(customType.children, (c: CustomTypeChild) => {
                    return {
                        name: c.name,
                        defaultValue: c.defaultValue,
                    };
                });
                codeSnippet = (
                    <Enum
                        values={enumValues}
                    />
                );
                break;

            case KindString['Type alias']:
                typePrefix = 'Type Alias';
                codeSnippet = (
                    <span>
                        <span style={{color: KEYWORD_COLOR}}>type</span> {customType.name} ={' '}
                        {customType.type.typeDocType !== TypeDocTypes.Reflection ?
                            <Type type={customType.type} docsInfo={this.props.docsInfo} /> :
                            <MethodSignature
                                method={customType.type.method}
                                shouldHideMethodName={true}
                                shouldUseArrowSyntax={true}
                                docsInfo={this.props.docsInfo}
                            />
                        }
                    </span>
                );
                break;

            default:
                throw utils.spawnSwitchErr('type.kindString', customType.kindString);
        }

        const typeDefinitionAnchorId = customType.name;
        return (
            <div
                id={this.props.shouldAddId ? typeDefinitionAnchorId : ''}
                className="pb2"
                style={{overflow: 'hidden', width: '100%'}}
                onMouseOver={this.setAnchorVisibility.bind(this, true)}
                onMouseOut={this.setAnchorVisibility.bind(this, false)}
            >
                <AnchorTitle
                    headerSize={HeaderSizes.H3}
                    title={`${typePrefix} ${customType.name}`}
                    id={this.props.shouldAddId ? typeDefinitionAnchorId : ''}
                    shouldShowAnchor={this.state.shouldShowAnchor}
                />
                <div style={{fontSize: 16}}>
                    <pre>
                        <code className="hljs">
                            {codeSnippet}
                        </code>
                    </pre>
                </div>
                {customType.comment &&
                    <Comment
                        comment={customType.comment}
                        className="py2"
                    />
                }
            </div>
        );
    }
    private setAnchorVisibility(shouldShowAnchor: boolean) {
        this.setState({
            shouldShowAnchor,
        });
    }
}
