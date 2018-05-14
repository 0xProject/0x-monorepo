import { AnchorTitle, colors, HeaderSizes, Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { DocsInfo } from '../docs_info';
import { Parameter, SolidityMethod, TypeDefinitionByName, TypescriptFunction, TypescriptMethod } from '../types';
import { constants } from '../utils/constants';
import { typeDocUtils } from '../utils/typedoc_utils';

import { Comment } from './comment';
import { Signature } from './signature';
import { SourceLink } from './source_link';

export interface SignatureBlockProps {
    method: SolidityMethod | TypescriptFunction | TypescriptMethod;
    sectionName: string;
    libraryVersion: string;
    typeDefinitionByName: TypeDefinitionByName;
    docsInfo: DocsInfo;
    sourceUrl: string;
}

export interface SignatureBlockState {
    shouldShowAnchor: boolean;
}

const styles: Styles = {
    chip: {
        fontSize: 13,
        backgroundColor: colors.lightBlueA700,
        color: colors.white,
        height: 11,
        borderRadius: 14,
        lineHeight: 0.9,
    },
};

export class SignatureBlock extends React.Component<SignatureBlockProps, SignatureBlockState> {
    constructor(props: SignatureBlockProps) {
        super(props);
        this.state = {
            shouldShowAnchor: false,
        };
    }
    public render(): React.ReactNode {
        const method = this.props.method;
        if (typeDocUtils.isPrivateOrProtectedProperty(method.name)) {
            return null;
        }

        return (
            <div
                id={`${this.props.sectionName}-${method.name}`}
                style={{ overflow: 'hidden', width: '100%' }}
                className="pb4"
                onMouseOver={this._setAnchorVisibility.bind(this, true)}
                onMouseOut={this._setAnchorVisibility.bind(this, false)}
            >
                {!(method as TypescriptMethod).isConstructor && (
                    <div className="flex pb2 pt2">
                        {(method as TypescriptMethod).isStatic && this._renderChip('Static')}
                        {(method as SolidityMethod).isConstant && this._renderChip('Constant')}
                        {(method as SolidityMethod).isPayable && this._renderChip('Payable')}
                        <div style={{ lineHeight: 1.3 }}>
                            <AnchorTitle
                                headerSize={HeaderSizes.H3}
                                title={method.name}
                                id={`${this.props.sectionName}-${method.name}`}
                                shouldShowAnchor={this.state.shouldShowAnchor}
                            />
                        </div>
                    </div>
                )}
                <code className={`hljs ${constants.TYPE_TO_SYNTAX[this.props.docsInfo.type]}`}>
                    <Signature
                        name={method.name}
                        returnType={method.returnType}
                        parameters={method.parameters}
                        typeParameter={(method as TypescriptMethod).typeParameter}
                        callPath={(method as TypescriptMethod).callPath}
                        sectionName={this.props.sectionName}
                        typeDefinitionByName={this.props.typeDefinitionByName}
                        docsInfo={this.props.docsInfo}
                    />
                </code>
                {(method as TypescriptMethod).source && (
                    <SourceLink
                        version={this.props.libraryVersion}
                        source={(method as TypescriptMethod).source}
                        sourceUrl={this.props.sourceUrl}
                    />
                )}
                {method.comment && <Comment comment={method.comment} className="py2" />}
                {method.parameters &&
                    !_.isEmpty(method.parameters) && (
                        <div>
                            <h4 className="pb1 thin" style={{ borderBottom: '1px solid #e1e8ed' }}>
                                ARGUMENTS
                            </h4>
                            {this._renderParameterDescriptions(method.parameters)}
                        </div>
                    )}
                {method.returnComment && (
                    <div className="pt1 comment">
                        <h4 className="pb1 thin" style={{ borderBottom: '1px solid #e1e8ed' }}>
                            RETURNS
                        </h4>
                        <Comment comment={method.returnComment} />
                    </div>
                )}
            </div>
        );
    }
    private _renderChip(text: string): React.ReactNode {
        return (
            <div className="p1 mr1" style={styles.chip}>
                {text}
            </div>
        );
    }
    private _renderParameterDescriptions(parameters: Parameter[]): React.ReactNode {
        const descriptions = _.map(parameters, parameter => {
            const isOptional = parameter.isOptional;
            return (
                <div
                    key={`param-description-${parameter.name}`}
                    className="flex pb1 mb2"
                    style={{ borderBottom: '1px solid #f0f4f7' }}
                >
                    <div className="pl2 col lg-col-4 md-col-4 sm-col-12 col-12">
                        <div
                            className="bold"
                            style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                        >
                            {parameter.name}
                        </div>
                        <div className="pt1" style={{ color: colors.grey, fontSize: 14 }}>
                            {isOptional && 'optional'}
                        </div>
                    </div>
                    <div className="col lg-col-8 md-col-8 sm-col-12 col-12" style={{ paddingLeft: 5 }}>
                        {parameter.comment && <Comment comment={parameter.comment} />}
                    </div>
                </div>
            );
        });
        return descriptions;
    }
    private _setAnchorVisibility(shouldShowAnchor: boolean): void {
        this.setState({
            shouldShowAnchor,
        });
    }
}
