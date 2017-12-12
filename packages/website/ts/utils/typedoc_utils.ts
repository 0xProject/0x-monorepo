import * as _ from 'lodash';
import {DocsInfo} from 'ts/pages/documentation/docs_info';
import {
    CustomType,
    CustomTypeChild,
    DocAgnosticFormat,
    DocSection,
    DocsMenu,
    IndexSignature,
    KindString,
    MenuSubsectionsBySection,
    Parameter,
    Property,
    SectionsMap,
    Type,
    TypeDocNode,
    TypeDocType,
    TypeDocTypes,
    TypeParameter,
    TypescriptMethod,
} from 'ts/types';
import {constants} from 'ts/utils/constants';
import {utils} from 'ts/utils/utils';

export const typeDocUtils = {
    isType(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Interface ||
               entity.kindString === KindString.Function ||
               entity.kindString === KindString['Type alias'] ||
               entity.kindString === KindString.Variable ||
               entity.kindString === KindString.Enumeration;
    },
    isMethod(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Method;
    },
    isConstructor(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Constructor;
    },
    isProperty(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Property;
    },
    isPrivateOrProtectedProperty(propertyName: string): boolean {
        return _.startsWith(propertyName, '_');
    },
    getModuleDefinitionBySectionNameIfExists(versionDocObj: TypeDocNode, modulePaths: string[]):
        TypeDocNode|undefined {
        const modules = versionDocObj.children;
        for (const mod of modules) {
            if (_.includes(modulePaths, mod.name)) {
                const moduleWithName = mod;
                return moduleWithName;
            }
        }
        return undefined;
    },
    convertToDocAgnosticFormat(typeDocJson: TypeDocNode, docsInfo: DocsInfo): DocAgnosticFormat {
        const subMenus = _.values(docsInfo.getMenu());
        const orderedSectionNames = _.flatten(subMenus);
        const docAgnosticFormat: DocAgnosticFormat = {};
        _.each(orderedSectionNames, sectionName => {
            const modulePathsIfExists = docsInfo.getModulePathsIfExists(sectionName);
            if (_.isUndefined(modulePathsIfExists)) {
                return; // no-op
            }
            const packageDefinitionIfExists = typeDocUtils.getModuleDefinitionBySectionNameIfExists(
                typeDocJson, modulePathsIfExists,
            );
            if (_.isUndefined(packageDefinitionIfExists)) {
                return; // no-op
            }

            // Since the `types.ts` file is the only file that does not export a module/class but
            // instead has each type export itself, we do not need to go down two levels of nesting
            // for it.
            let entities;
            let packageComment = '';
            if (sectionName === docsInfo.sections.types) {
                entities = packageDefinitionIfExists.children;
            } else {
                entities = packageDefinitionIfExists.children[0].children;
                const commentObj = packageDefinitionIfExists.children[0].comment;
                packageComment = !_.isUndefined(commentObj) ? commentObj.shortText : packageComment;
            }

            const docSection = typeDocUtils._convertEntitiesToDocSection(entities, docsInfo, sectionName);
            docSection.comment = packageComment;
            docAgnosticFormat[sectionName] = docSection;
        });
        return docAgnosticFormat;
    },
    _convertEntitiesToDocSection(entities: TypeDocNode[], docsInfo: DocsInfo, sectionName: string) {
        const docSection: DocSection = {
            comment: '',
            constructors: [],
            methods: [],
            properties: [],
            types: [],
        };

        let isConstructor;
        _.each(entities, entity => {
            switch (entity.kindString) {
                case KindString.Constructor:
                    isConstructor = true;
                    const constructor = typeDocUtils._convertMethod(
                        entity, isConstructor, docsInfo.sections, sectionName, docsInfo.subPackageName,
                    );
                    docSection.constructors.push(constructor);
                    break;

                case KindString.Method:
                    if (entity.flags.isPublic) {
                        isConstructor = false;
                        const method = typeDocUtils._convertMethod(
                            entity, isConstructor, docsInfo.sections, sectionName, docsInfo.subPackageName,
                        );
                        docSection.methods.push(method);
                    }
                    break;

                case KindString.Property:
                    if (!typeDocUtils.isPrivateOrProtectedProperty(entity.name)) {
                        const property = typeDocUtils._convertProperty(
                            entity, docsInfo.sections, sectionName, docsInfo.subPackageName);
                        docSection.properties.push(property);
                    }
                    break;

                case KindString.Interface:
                case KindString.Function:
                case KindString.Variable:
                case KindString.Enumeration:
                case KindString['Type alias']:
                    if (docsInfo.isPublicType(entity.name)) {
                        const customType = typeDocUtils._convertCustomType(
                            entity, docsInfo.sections, sectionName, docsInfo.subPackageName);
                        docSection.types.push(customType);
                    }
                    break;

                default:
                    throw utils.spawnSwitchErr('kindString', entity.kindString);
            }
        });
        return docSection;
    },
    _convertCustomType(entity: TypeDocNode, sections: SectionsMap, sectionName: string,
                       subPackageName: string): CustomType {
        const typeIfExists = !_.isUndefined(entity.type) ?
                             typeDocUtils._convertType(entity.type, sections, sectionName, subPackageName) :
                             undefined;
        const isConstructor = false;
        const methodIfExists = !_.isUndefined(entity.declaration) ?
            typeDocUtils._convertMethod(entity.declaration, isConstructor, sections, sectionName, subPackageName) :
            undefined;
        const indexSignatureIfExists = !_.isUndefined(entity.indexSignature) ?
            typeDocUtils._convertIndexSignature(entity.indexSignature[0], sections, sectionName, subPackageName) :
            undefined;
        const commentIfExists = !_.isUndefined(entity.comment) && !_.isUndefined(entity.comment.shortText) ?
            entity.comment.shortText :
            undefined;

        const childrenIfExist = !_.isUndefined(entity.children) ?
            _.map(entity.children, (child: TypeDocNode) => {
                const childTypeIfExists = !_.isUndefined(child.type) ?
                    typeDocUtils._convertType(child.type, sections, sectionName, subPackageName) :
                    undefined;
                const c: CustomTypeChild = {
                    name: child.name,
                    type: childTypeIfExists,
                    defaultValue: child.defaultValue,
                };
                return c;
            }) :
            undefined;

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
    },
    _convertIndexSignature(entity: TypeDocNode, sections: SectionsMap, sectionName: string,
                           subPackageName: string): IndexSignature {
        const key = entity.parameters[0];
        const indexSignature = {
            keyName: key.name,
            keyType: typeDocUtils._convertType(key.type, sections, sectionName, subPackageName),
            valueName: entity.type.name,
        };
        return indexSignature;
    },
    _convertProperty(entity: TypeDocNode, sections: SectionsMap, sectionName: string,
                     subPackageName: string): Property {
        const source = entity.sources[0];
        const commentIfExists = !_.isUndefined(entity.comment) ? entity.comment.shortText : undefined;
        const property = {
            name: entity.name,
            type: typeDocUtils._convertType(entity.type, sections, sectionName, subPackageName),
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            comment: commentIfExists,
        };
        return property;
    },
    _convertMethod(
        entity: TypeDocNode, isConstructor: boolean, sections: SectionsMap, sectionName: string, subPackageName: string,
    ): TypescriptMethod {
        const signature = entity.signatures[0];
        const source = entity.sources[0];
        const hasComment = !_.isUndefined(signature.comment);
        const isStatic = _.isUndefined(entity.flags.isStatic) ? false : entity.flags.isStatic;

        // HACK: we use the fact that the sectionName is the same as the property name at the top-level
        // of the public interface. In the future, we shouldn't use this hack but rather get it from the JSON.
        let callPath;
        if (isConstructor || entity.name === '__type') {
            callPath = '';
        } else if (subPackageName === '0x.js') {
            const topLevelInterface = isStatic ? 'ZeroEx.' : 'zeroEx.';
            callPath = (!_.isUndefined(sections.zeroEx) && sectionName !== sections.zeroEx) ?
                       `${topLevelInterface}${sectionName}.` :
                       topLevelInterface;
        } else {
            callPath = `${sectionName}.`;
        }

        const parameters = _.map(signature.parameters, param => {
            return typeDocUtils._convertParameter(param, sections, sectionName, subPackageName);
        });
        const returnType = typeDocUtils._convertType(signature.type, sections, sectionName, subPackageName);
        const typeParameter = _.isUndefined(signature.typeParameter) ?
                              undefined :
                              typeDocUtils._convertTypeParameter(
                                  signature.typeParameter[0], sections, sectionName, subPackageName);

        const method = {
            isConstructor,
            isStatic,
            name: signature.name,
            comment: hasComment ? signature.comment.shortText : undefined,
            returnComment: hasComment && signature.comment.returns ? signature.comment.returns : undefined,
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            callPath,
            parameters,
            returnType,
            typeParameter,
        };
        return method;
    },
    _convertTypeParameter(entity: TypeDocNode, sections: SectionsMap, sectionName: string,
                          subPackageName: string): TypeParameter {
        const type = typeDocUtils._convertType(entity.type, sections, sectionName, subPackageName);
        const parameter = {
            name: entity.name,
            type,
        };
        return parameter;
    },
    _convertParameter(entity: TypeDocNode, sections: SectionsMap, sectionName: string,
                      subPackageName: string): Parameter {
        let comment = '<No comment>';
        if (entity.comment && entity.comment.shortText) {
            comment = entity.comment.shortText;
        } else if (entity.comment && entity.comment.text) {
            comment = entity.comment.text;
        }

        const isOptional = !_.isUndefined(entity.flags.isOptional) ?
            entity.flags.isOptional :
            false;

        const type = typeDocUtils._convertType(entity.type, sections, sectionName, subPackageName);

        const parameter = {
            name: entity.name,
            comment,
            isOptional,
            type,
        };
        return parameter;
    },
    _convertType(entity: TypeDocType, sections: SectionsMap, sectionName: string, subPackageName: string): Type {
        const typeArguments = _.map(entity.typeArguments, typeArgument => {
            return typeDocUtils._convertType(typeArgument, sections, sectionName, subPackageName);
        });
        const types = _.map(entity.types, t => {
            return typeDocUtils._convertType(t, sections, sectionName, subPackageName);
        });

        const isConstructor = false;
        const methodIfExists = !_.isUndefined(entity.declaration) ?
            typeDocUtils._convertMethod(entity.declaration, isConstructor, sections, sectionName, subPackageName) :
            undefined;

        const elementTypeIfExists = !_.isUndefined(entity.elementType) ?
            {
                name: entity.elementType.name,
                typeDocType: entity.elementType.type,
            } :
            undefined;

        const type = {
            name: entity.name,
            value: entity.value,
            typeDocType: entity.type,
            typeArguments,
            elementType: elementTypeIfExists,
            types,
            method: methodIfExists,
        };
        return type;
    },
};
