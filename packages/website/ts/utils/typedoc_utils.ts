import {
    CustomType,
    CustomTypeChild,
    DocAgnosticFormat,
    DocSection,
    ExternalExportToLink,
    ExternalTypeToLink,
    GeneratedDocJson,
    IndexSignature,
    Parameter,
    Property,
    Type,
    TypeDocNode,
    TypeDocType,
    TypeDocTypes,
    TypeParameter,
    TypescriptFunction,
    TypescriptMethod,
} from '@0x/types';
import { errorUtils } from '@0x/utils';
import * as _ from 'lodash';

import { KindString } from '../types';

import { constants } from './constants';
import { DocsInfo } from './docs_info';

export class TypeDocUtils {
    private readonly _typeDocNameOrder: string[];
    private readonly _externalTypeToLink: ExternalTypeToLink;
    private readonly _externalExportToLink: ExternalExportToLink;
    private readonly _docsInfo: DocsInfo;
    private readonly _typeDocJson: TypeDocNode;
    private readonly _classNames: string[];
    constructor(generatedDocJson: GeneratedDocJson, docsInfo: DocsInfo) {
        this._docsInfo = docsInfo;
        const exportPathOrder = generatedDocJson.metadata.exportPathOrder;
        const exportPathToTypedocNames = generatedDocJson.metadata.exportPathToTypedocNames;
        this._externalTypeToLink = generatedDocJson.metadata.externalTypeToLink;
        this._externalExportToLink = generatedDocJson.metadata.externalExportToLink;
        this._typeDocJson = generatedDocJson.typedocJson;

        this._typeDocNameOrder = _.compact(
            _.flatten(
                _.map(exportPathOrder, exportPath => {
                    return exportPathToTypedocNames[exportPath];
                }),
            ),
        );

        this._classNames = [];
        _.each(this._typeDocJson.children, file => {
            _.each(file.children, child => {
                if (child.kindString === KindString.Class) {
                    this._classNames.push(child.name);
                }
            });
        });
    }
    public isType(entity: TypeDocNode): boolean {
        return (
            entity.kindString === KindString.Interface ||
            entity.kindString === KindString.Function ||
            entity.kindString === KindString.TypeAlias ||
            entity.kindString === KindString.Variable ||
            entity.kindString === KindString.Enumeration
        );
    }
    public isMethod(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Method;
    }
    public isConstructor(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Constructor;
    }
    public isProperty(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Property;
    }
    public isUnderscorePrefixed(name: string): boolean {
        return _.startsWith(name, '_');
    }
    public getModuleDefinitionsBySectionName(versionDocObj: TypeDocNode, configModulePaths: string[]): TypeDocNode[] {
        const moduleDefinitions: TypeDocNode[] = [];
        const jsonModules = versionDocObj.children;
        _.each(jsonModules, jsonMod => {
            _.each(configModulePaths, configModulePath => {
                if (_.includes(configModulePath, jsonMod.name)) {
                    moduleDefinitions.push(jsonMod);
                }
            });
        });
        return moduleDefinitions;
    }
    public convertToDocAgnosticFormat(): DocAgnosticFormat {
        const docAgnosticFormat: DocAgnosticFormat = {};

        if (!_.isEmpty(this._externalExportToLink)) {
            this._docsInfo.sections[constants.EXTERNAL_EXPORTS_SECTION_NAME] = constants.EXTERNAL_EXPORTS_SECTION_NAME;
            this._docsInfo.markdownMenu[constants.EXTERNAL_EXPORTS_SECTION_NAME] = [
                constants.EXTERNAL_EXPORTS_SECTION_NAME,
            ];
            const docSection: DocSection = {
                comment: 'This package also re-exports some third-party libraries for your convenience.',
                constructors: [],
                methods: [],
                functions: [],
                properties: [],
                types: [],
                externalExportToLink: this._externalExportToLink,
            };
            docAgnosticFormat[constants.EXTERNAL_EXPORTS_SECTION_NAME] = docSection;
        }

        const typeEntities: TypeDocNode[] = [];
        _.each(this._typeDocNameOrder, typeDocName => {
            const fileChildIndex = _.findIndex(this._typeDocJson.children, child => child.name === typeDocName);
            const fileChild = this._typeDocJson.children[fileChildIndex];
            let sectionName: string;
            _.each(fileChild.children, child => {
                switch (child.kindString) {
                    case KindString.Class:
                    case KindString.ObjectLiteral: {
                        sectionName = child.name;
                        this._docsInfo.sections[sectionName] = sectionName;
                        this._docsInfo.markdownMenu[sectionName] = [sectionName];
                        const entities = child.children;
                        const commentObj = child.comment;
                        const sectionComment = commentObj !== undefined ? commentObj.shortText : '';
                        const isClassOrObjectLiteral = true;
                        const docSection = this._convertEntitiesToDocSection(
                            entities,
                            sectionName,
                            isClassOrObjectLiteral,
                        );
                        docSection.comment = sectionComment;
                        docAgnosticFormat[sectionName] = docSection;
                        break;
                    }
                    case KindString.Function: {
                        sectionName = child.name;
                        this._docsInfo.sections[sectionName] = sectionName;
                        this._docsInfo.markdownMenu[sectionName] = [sectionName];
                        const entities = [child];
                        const commentObj = child.comment;
                        const SectionComment = commentObj !== undefined ? commentObj.shortText : '';
                        const docSection = this._convertEntitiesToDocSection(entities, sectionName);
                        docSection.comment = SectionComment;
                        docAgnosticFormat[sectionName] = docSection;
                        break;
                    }
                    case KindString.Interface:
                    case KindString.Variable:
                    case KindString.Enumeration:
                    case KindString.TypeAlias:
                        typeEntities.push(child);
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('kindString', child.kindString);
                }
            });
        });
        if (!_.isEmpty(typeEntities)) {
            this._docsInfo.sections[constants.TYPES_SECTION_NAME] = constants.TYPES_SECTION_NAME;
            this._docsInfo.markdownMenu[constants.TYPES_SECTION_NAME] = [constants.TYPES_SECTION_NAME];
            const docSection = this._convertEntitiesToDocSection(typeEntities, constants.TYPES_SECTION_NAME);
            docAgnosticFormat[constants.TYPES_SECTION_NAME] = docSection;
        }

        return docAgnosticFormat;
    }
    private _convertEntitiesToDocSection(
        entities: TypeDocNode[],
        sectionName: string,
        isClassOrObjectLiteral: boolean = false,
    ): DocSection {
        const docSection: DocSection = {
            comment: '',
            constructors: [],
            methods: [],
            functions: [],
            properties: [],
            types: [],
        };

        let isConstructor;
        _.each(entities, entity => {
            switch (entity.kindString) {
                case KindString.Constructor:
                    isConstructor = true;
                    const constructor = this._convertMethod(entity, isConstructor, sectionName);
                    docSection.constructors.push(constructor);
                    break;

                case KindString.Function:
                    if (entity.flags.isExported) {
                        const funcName = entity.signatures[0].name;
                        if (!this.isUnderscorePrefixed(funcName)) {
                            const func = this._convertFunction(entity, sectionName, isClassOrObjectLiteral);
                            docSection.functions.push(func);
                        }
                    }
                    break;

                case KindString.Method:
                    if (entity.flags.isPublic && !this.isUnderscorePrefixed(entity.name)) {
                        isConstructor = false;
                        const method = this._convertMethod(entity, isConstructor, sectionName);
                        docSection.methods.push(method);
                    }
                    break;

                case KindString.Property: {
                    if (!this.isUnderscorePrefixed(entity.name)) {
                        const property = this._convertProperty(entity, sectionName);
                        docSection.properties.push(property);
                    }
                    break;
                }

                case KindString.Variable:
                    if (isClassOrObjectLiteral) {
                        // Render as a property
                        const property = this._convertProperty(entity, sectionName);
                        docSection.properties.push(property);
                    } else {
                        // Otherwise, render as a type
                        const customType = this._convertCustomType(entity, sectionName);
                        const seenTypeNames = _.map(docSection.types, t => t.name);
                        const isUnseen = !_.includes(seenTypeNames, customType.name);
                        if (isUnseen) {
                            docSection.types.push(customType);
                        }
                    }
                    break;

                case KindString.Interface:
                case KindString.Enumeration:
                case KindString.TypeAlias: {
                    const customType = this._convertCustomType(entity, sectionName);
                    const seenTypeNames = _.map(docSection.types, t => t.name);
                    const isUnseen = !_.includes(seenTypeNames, customType.name);
                    if (isUnseen) {
                        docSection.types.push(customType);
                    }
                    break;
                }

                case KindString.Class:
                    // We currently do not support more then a single class per file
                    // except for the types section, where we ignore classes since we
                    // only want to render type definitions.
                    break;

                default:
                    throw errorUtils.spawnSwitchErr('kindString', entity.kindString);
            }
        });
        return docSection;
    }
    private _convertCustomType(entity: TypeDocNode, sectionName: string): CustomType {
        const typeIfExists = entity.type !== undefined ? this._convertType(entity.type, sectionName) : undefined;
        const isConstructor = false;
        const methodIfExists =
            entity.declaration !== undefined
                ? this._convertMethod(entity.declaration, isConstructor, sectionName)
                : undefined;
        const doesIndexSignatureExist = entity.indexSignature !== undefined;
        const indexSignature = entity.indexSignature;
        const indexSignatureIfExists = doesIndexSignatureExist
            ? this._convertIndexSignature(indexSignature, sectionName)
            : undefined;
        const commentIfExists =
            entity.comment !== undefined && entity.comment.shortText !== undefined
                ? entity.comment.shortText
                : undefined;

        const childrenIfExist =
            entity.children !== undefined
                ? _.map(entity.children, (child: TypeDocNode) => {
                      let childTypeIfExists =
                          child.type !== undefined ? this._convertType(child.type, sectionName) : undefined;
                      if (child.kindString === KindString.Method) {
                          childTypeIfExists = {
                              name: child.name,
                              typeDocType: TypeDocTypes.Reflection,
                              method: this._convertMethod(child, isConstructor, sectionName),
                          };
                      }
                      const c: CustomTypeChild = {
                          name: child.name,
                          type: childTypeIfExists,
                          defaultValue: child.defaultValue,
                      };
                      return c;
                  })
                : undefined;

        const customType = {
            name: entity.name,
            kindString: entity.kindString,
            type: typeIfExists,
            method: methodIfExists,
            indexSignature: indexSignatureIfExists,
            defaultValue: entity.defaultValue,
            comment: commentIfExists,
            children: childrenIfExist,
        };
        return customType;
    }
    private _convertIndexSignature(entity: TypeDocNode, sectionName: string): IndexSignature {
        const key = entity.parameters[0];
        const indexSignature = {
            keyName: key.name,
            keyType: this._convertType(key.type, sectionName),
            valueName: entity.type.name,
        };
        return indexSignature;
    }
    private _convertProperty(entity: TypeDocNode, sectionName: string): Property {
        const source = entity.sources[0];
        const commentIfExists = entity.comment !== undefined ? entity.comment.shortText : undefined;
        const isConstructor = false;
        const isStatic = entity.flags.isStatic === undefined ? false : entity.flags.isStatic;
        const callPath = this._getCallPath(sectionName, isStatic, isConstructor, entity.name);
        const property = {
            name: entity.name,
            type: this._convertType(entity.type, sectionName),
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            comment: commentIfExists,
            callPath,
        };
        return property;
    }
    private _convertMethod(entity: TypeDocNode, isConstructor: boolean, sectionName: string): TypescriptMethod {
        const signature = entity.signatures[0];
        const source = entity.sources[0];
        const hasComment = signature.comment !== undefined;
        const isStatic = entity.flags.isStatic === undefined ? false : entity.flags.isStatic;

        const parameters = _.map(signature.parameters, param => {
            return this._convertParameter(param, sectionName);
        });
        const returnType = this._convertType(signature.type, sectionName);
        const typeParameter =
            signature.typeParameter === undefined
                ? undefined
                : this._convertTypeParameter(signature.typeParameter[0], sectionName);

        const callPath = this._getCallPath(sectionName, isStatic, isConstructor, entity.name);
        const method = {
            isConstructor,
            isStatic,
            name: signature.name,
            comment: hasComment ? signature.comment.shortText : undefined,
            returnComment: hasComment && signature.comment.returns ? signature.comment.returns : undefined,
            source: {
                fileName: source.fileName,
                line: source.line,
                callPath,
                parameters,
                returnType,
                typeParameter,
            },
            callPath,
            parameters,
            returnType,
            typeParameter,
        };
        return method;
    }
    private _getCallPath(sectionName: string, isStatic: boolean, isConstructor: boolean, entityName: string): string {
        // HACK: we use the fact that the sectionName is the same as the property name at the top-level
        // of the public interface. In the future, we shouldn't use this hack but rather get it from the JSON.
        let callPath;
        if (isConstructor || entityName === '__type') {
            callPath = '';
        } else {
            const prefix = isStatic ? sectionName : this._getLowercaseSectionName(sectionName);
            callPath = `${prefix}.`;
        }
        return callPath;
    }
    private _getLowercaseSectionName(sectionName: string): string {
        if (_.startsWith(sectionName, 'ERC')) {
            return `${sectionName.slice(0, 3).toLowerCase()}${sectionName.slice(3)}`;
        }
        return `${sectionName[0].toLowerCase()}${sectionName.slice(1)}`;
    }
    private _convertFunction(entity: TypeDocNode, sectionName: string, isObjectLiteral: boolean): TypescriptFunction {
        const signature = entity.signatures[0];
        const source = entity.sources[0];
        const hasComment = signature.comment !== undefined;

        const parameters = _.map(signature.parameters, param => {
            return this._convertParameter(param, sectionName);
        });
        const returnType = this._convertType(signature.type, sectionName);
        const typeParameter =
            signature.typeParameter === undefined
                ? undefined
                : this._convertTypeParameter(signature.typeParameter[0], sectionName);

        let callPath = '';
        if (isObjectLiteral) {
            const isConstructor = false;
            const isStatic = false;
            callPath = this._getCallPath(sectionName, isStatic, isConstructor, entity.name);
        }
        const func = {
            name: signature.name,
            comment: hasComment ? signature.comment.shortText : undefined,
            returnComment: hasComment && signature.comment.returns ? signature.comment.returns : undefined,
            callPath,
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            parameters,
            returnType,
            typeParameter,
        };
        return func;
    }
    private _convertTypeParameter(entity: TypeDocNode, sectionName: string): TypeParameter {
        let type;
        if (entity.type !== undefined) {
            type = this._convertType(entity.type, sectionName);
        }
        const parameter = {
            name: entity.name,
            type,
        };
        return parameter;
    }
    private _convertParameter(entity: TypeDocNode, sectionName: string): Parameter {
        let comment = '<No comment>';
        if (entity.comment && entity.comment.shortText) {
            comment = entity.comment.shortText;
        } else if (entity.comment && entity.comment.text) {
            comment = entity.comment.text;
        }

        const isOptional = entity.flags.isOptional !== undefined ? entity.flags.isOptional : false;

        const type = this._convertType(entity.type, sectionName);

        const parameter = {
            name: entity.name,
            comment,
            isOptional,
            defaultValue: entity.defaultValue,
            type,
        };
        return parameter;
    }
    private _convertType(entity: TypeDocType, sectionName: string): Type {
        const typeArguments = _.map(entity.typeArguments, typeArgument => {
            return this._convertType(typeArgument, sectionName);
        });
        const types = _.map(entity.types, t => {
            return this._convertType(t, sectionName);
        });

        let indexSignatureIfExists;
        let methodIfExists;
        let tupleElementsIfExists;
        const doesIndexSignatureExist =
            entity.declaration !== undefined && entity.declaration.indexSignature !== undefined;
        if (doesIndexSignatureExist) {
            const indexSignature = entity.declaration.indexSignature;
            indexSignatureIfExists = this._convertIndexSignature(indexSignature, sectionName);
        } else if (entity.declaration !== undefined) {
            const isConstructor = false;
            methodIfExists = this._convertMethod(entity.declaration, isConstructor, sectionName);
        } else if (entity.type === TypeDocTypes.Tuple) {
            tupleElementsIfExists = _.map(entity.elements, el => {
                // the following line is required due to an open tslint issue, https://github.com/palantir/tslint/issues/3540
                // tslint:disable-next-line:no-unnecessary-type-assertion
                return { name: el.name, typeDocType: el.type as TypeDocTypes };
            });
        }

        const elementTypeIfExists =
            entity.elementType !== undefined
                ? {
                      name: entity.elementType.name,
                      typeDocType: entity.elementType.type,
                  }
                : undefined;

        const type: Type = {
            name: entity.name,
            value: entity.value,
            isExportedClassReference: _.includes(this._classNames, entity.name),
            typeDocType: entity.type,
            typeArguments,
            elementType: elementTypeIfExists,
            types,
            method: methodIfExists,
            indexSignature: indexSignatureIfExists,
            tupleElements: tupleElementsIfExists,
        };
        const externalLinkIfExists = this._externalTypeToLink[entity.name];
        if (externalLinkIfExists !== undefined) {
            type.externalLink = externalLinkIfExists;
        }
        return type;
    }
} // tslint:disable:max-file-line-count
