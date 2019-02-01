import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as ts from 'typescript';

import { constants } from '../constants';
import { docGenConfigs } from '../doc_gen_configs';
import { ExportInfo, ExportNameToTypedocNames, ExportPathToExportedItems, PackageJSON } from '../types';

import { utils } from './utils';

export class DocGenerateAndUploadUtils {
    private readonly _isStaging: boolean;
    private readonly _shouldUploadDocs: boolean;
    private readonly _packageName: string;
    private readonly _omitExports: string[];
    private readonly _packagePath: string;
    private readonly _exportPathToExportedItems: ExportPathToExportedItems;
    private readonly _exportPathOrder: string[];
    private readonly _monoRepoPkgNameToPath: { [name: string]: string };
    private readonly _packageJson: PackageJSON;
    /**
     *  Recursively iterate over the TypeDoc JSON object and find all type names
     */
    private static _getAllTypeNames(node: any, typeNames: string[]): string[] {
        if (!_.isObject(node)) {
            return typeNames;
        }
        const typeKindStrings = ['Interface', 'Enumeration', 'Type alias'];
        if (_.includes(typeKindStrings, node.kindString)) {
            return [...typeNames, node.name];
        }
        let updatedTypeNames = typeNames;
        _.each(node, nodeValue => {
            if (_.isArray(nodeValue)) {
                _.each(nodeValue, aNode => {
                    updatedTypeNames = DocGenerateAndUploadUtils._getAllTypeNames(aNode, updatedTypeNames);
                });
            } else if (_.isObject(nodeValue)) {
                updatedTypeNames = DocGenerateAndUploadUtils._getAllTypeNames(nodeValue, updatedTypeNames);
            }
        });
        return updatedTypeNames;
    }
    /**
     * Recursively iterate over the TypeDoc JSON object and find all reference names (i.e types, classNames,
     * objectLiteral names, etc...)
     */
    private static _getAllReferenceNames(propertyName: string, node: any, referenceNames: string[]): string[] {
        if (!_.isObject(node)) {
            return referenceNames;
        }

        let updatedReferenceNames = referenceNames;
        // Some nodes of type reference are for subtypes, which we don't want to return.
        // We therefore filter them out.
        const SUB_TYPE_PROPERTY_NAMES = ['inheritedFrom', 'overwrites', 'extendedTypes', 'implementationOf'];
        const TS_MAPPED_TYPES = ['Partial', 'Promise', 'Readonly', 'Pick', 'Record'];
        if (
            !_.isUndefined(node.type) &&
            _.isString(node.type) &&
            node.type === 'reference' &&
            !_.includes(TS_MAPPED_TYPES, node.name) &&
            !_.includes(SUB_TYPE_PROPERTY_NAMES, propertyName)
        ) {
            updatedReferenceNames = _.uniq([...referenceNames, node.name]);
            return updatedReferenceNames;
        }
        _.each(node, (nodeValue, innerPropertyName) => {
            if (_.isArray(nodeValue)) {
                _.each(nodeValue, aNode => {
                    updatedReferenceNames = DocGenerateAndUploadUtils._getAllReferenceNames(
                        innerPropertyName,
                        aNode,
                        updatedReferenceNames,
                    );
                });
            } else if (_.isObject(nodeValue)) {
                updatedReferenceNames = DocGenerateAndUploadUtils._getAllReferenceNames(
                    innerPropertyName,
                    nodeValue,
                    updatedReferenceNames,
                );
            }
        });
        return _.uniq(updatedReferenceNames);
    }
    private static _getExportPathToExportedItems(filePath: string, omitExports?: string[]): ExportInfo {
        const sourceFile = ts.createSourceFile(
            'indexFile',
            readFileSync(filePath).toString(),
            ts.ScriptTarget.ES2017,
            /*setParentNodes */ true,
        );
        const exportPathToExportedItems: ExportPathToExportedItems = {};
        const exportPathOrder: string[] = [];
        const exportsToOmit = _.isUndefined(omitExports) ? [] : omitExports;

        processNode(sourceFile);

        function processNode(node: ts.Node): void {
            switch (node.kind) {
                case ts.SyntaxKind.ExportDeclaration: {
                    const exportClause = (node as any).exportClause;
                    if (_.isUndefined(exportClause)) {
                        return;
                    }
                    const exportPath = exportClause.parent.moduleSpecifier.text;
                    _.each(exportClause.elements, element => {
                        const exportItem = element.name.escapedText;
                        if (!_.includes(exportsToOmit, exportItem)) {
                            exportPathToExportedItems[exportPath] = _.isUndefined(exportPathToExportedItems[exportPath])
                                ? [exportItem]
                                : [...exportPathToExportedItems[exportPath], exportItem];
                        }
                    });
                    if (!_.isUndefined(exportPathToExportedItems[exportPath])) {
                        exportPathOrder.push(exportPath);
                    }
                    break;
                }

                case ts.SyntaxKind.ExportKeyword: {
                    const foundNode: any = node;
                    let exportPath = './index';
                    if (foundNode.parent && foundNode.parent.name) {
                        const exportItem = foundNode.parent.name.escapedText;
                        const isExportImportRequireStatement = !_.isUndefined(
                            _.get(foundNode, 'parent.moduleReference.expression.text'),
                        );
                        if (isExportImportRequireStatement) {
                            exportPath = foundNode.parent.moduleReference.expression.text;
                        }
                        if (!_.includes(exportsToOmit, exportItem)) {
                            exportPathToExportedItems[exportPath] = _.isUndefined(exportPathToExportedItems[exportPath])
                                ? [exportItem]
                                : [...exportPathToExportedItems[exportPath], exportItem];
                        }
                    }
                    if (
                        !_.includes(exportPathOrder, exportPath) &&
                        !_.isUndefined(exportPathToExportedItems[exportPath])
                    ) {
                        exportPathOrder.push(exportPath);
                    }
                    break;
                }
                default:
                    // noop
                    break;
            }

            ts.forEachChild(node, processNode);
        }
        const exportInfo = {
            exportPathToExportedItems,
            exportPathOrder,
        };
        return exportInfo;
    }
    constructor(packageName: string, isStaging: boolean, shouldUploadDocs: boolean) {
        this._isStaging = isStaging;
        this._packageName = packageName;
        this._shouldUploadDocs = shouldUploadDocs;
        this._packagePath = `${constants.monorepoRootPath}/packages/${packageName}`;

        this._monoRepoPkgNameToPath = {};
        const monorepoPackages = utils.getPackages(constants.monorepoRootPath);
        _.each(monorepoPackages, p => (this._monoRepoPkgNameToPath[p.packageJson.name] = p.location));

        const pkg = _.find(monorepoPackages, monorepoPackage => {
            return _.includes(monorepoPackage.packageJson.name, packageName);
        });
        if (_.isUndefined(pkg)) {
            throw new Error(`Couldn't find a package.json for ${packageName}`);
        }
        this._packageJson = pkg.packageJson;
        this._omitExports = _.get(this._packageJson, 'config.postpublish.docOmitExports', []);

        const indexPath = `${this._packagePath}/src/index.ts`;
        const exportInfo = DocGenerateAndUploadUtils._getExportPathToExportedItems(indexPath, this._omitExports);
        this._exportPathToExportedItems = exportInfo.exportPathToExportedItems;
        this._exportPathOrder = exportInfo.exportPathOrder;
    }
    public async generateAndUploadDocsAsync(): Promise<void> {
        // For each dep that is another one of our monorepo packages, we fetch it's index.ts
        // and see which specific files we must pass to TypeDoc, in order to generate a Doc JSON
        // the includes everything exported by the public interface.
        const typeDocExtraFileIncludes: string[] = this._getTypeDocFileIncludesForPackage();

        // In order to avoid TS errors, we need to pass TypeDoc the package's global.d.ts file
        // if it exists.
        const globalTypeDefinitionsPath = path.join(this._packagePath, 'src', 'globals.d.ts');
        if (existsSync(globalTypeDefinitionsPath)) {
            typeDocExtraFileIncludes.push(globalTypeDefinitionsPath);
        }

        utils.log(`GENERATE_UPLOAD_DOCS: Generating Typedoc JSON for ${this._packageName}...`);
        const jsonFilePath = path.join(this._packagePath, 'generated_docs', 'index.json');
        const projectFiles = typeDocExtraFileIncludes.join(' ');
        const cwd = path.join(constants.monorepoRootPath, 'packages', this._packageName);
        // HACK: For some reason calling `typedoc` command directly from here, even with `cwd` set to the
        // packages root dir, does not work. It only works when called via a `package.json` script located
        // in the package's root.
        await execAsync(`JSON_FILE_PATH=${jsonFilePath} PROJECT_FILES="${projectFiles}" yarn docs:json`, {
            cwd,
        });

        utils.log('GENERATE_UPLOAD_DOCS: Modifying Typedoc JSON to our custom format...');
        const typedocOutputString = readFileSync(jsonFilePath).toString();
        const typedocOutput = JSON.parse(typedocOutputString);
        const standardizedTypedocOutput = this._standardizeTypedocOutputTopLevelChildNames(typedocOutput);
        const modifiedTypedocOutput = this._pruneTypedocOutput(standardizedTypedocOutput);

        if (!_.includes(docGenConfigs.TYPES_ONLY_LIBRARIES, this._packageName)) {
            const propertyName = ''; // Root has no property name
            const referenceNames = DocGenerateAndUploadUtils._getAllReferenceNames(
                propertyName,
                modifiedTypedocOutput,
                [],
            );
            this._lookForUnusedExportedTypesThrowIfExists(referenceNames, modifiedTypedocOutput);
            this._lookForMissingReferenceExportsThrowIfExists(referenceNames);
        }

        // Some of our packages re-export external package exports in their index.ts
        // Typedoc is incapable of rendering these packages, so we need to special-case them
        const externalExportToLink: { [externalExport: string]: string } = {};
        const externalExportsWithoutLinks: string[] = [];
        const externalExports: string[] = this._getAllExternalExports();
        _.each(externalExports, externalExport => {
            const linkIfExists = docGenConfigs.EXTERNAL_EXPORT_TO_LINK[externalExport];
            if (_.isUndefined(linkIfExists)) {
                externalExportsWithoutLinks.push(externalExport);
                return;
            }
            externalExportToLink[externalExport] = linkIfExists;
        });
        if (!_.isEmpty(externalExportsWithoutLinks)) {
            throw new Error(
                `Found the following external exports in ${
                    this._packageName
                }'s index.ts:\n ${externalExportsWithoutLinks.join(
                    '\n',
                )}\nThey are missing from the EXTERNAL_EXPORT_TO_LINK mapping. Add them and try again.`,
            );
        }

        const exportPathToTypedocNames: ExportNameToTypedocNames = {};
        _.each(modifiedTypedocOutput.children, file => {
            const exportPath = this._findExportPathGivenTypedocName(file.name);
            exportPathToTypedocNames[exportPath] = _.isUndefined(exportPathToTypedocNames[exportPath])
                ? [file.name]
                : [...exportPathToTypedocNames[exportPath], file.name];
        });

        // Since we need additional metadata included in the doc JSON, we nest the TypeDoc JSON
        // within our own custom, versioned docsJson format.
        const docJson = {
            version: docGenConfigs.DOC_JSON_VERSION,
            metadata: {
                exportPathToTypedocNames,
                exportPathOrder: this._exportPathOrder,
                externalTypeToLink: docGenConfigs.EXTERNAL_TYPE_TO_LINK,
                externalExportToLink,
            },
            typedocJson: modifiedTypedocOutput,
        };
        utils.log(`GENERATE_UPLOAD_DOCS: Saving Doc JSON to: ${jsonFilePath}`);
        writeFileSync(jsonFilePath, JSON.stringify(docJson, null, 2));

        if (this._shouldUploadDocs) {
            await this._uploadDocsAsync(jsonFilePath, cwd);
        }
        utils.log(`GENERATE_UPLOAD_DOCS: Doc generation done for ${this._packageName}`);
    }
    private async _uploadDocsAsync(jsonFilePath: string, cwd: string): Promise<void> {
        const fileName = `v${this._packageJson.version}.json`;
        utils.log(`GENERATE_UPLOAD_DOCS: Doc generation successful, uploading docs... as ${fileName}`);

        const S3BucketPath = this._isStaging
            ? `s3://staging-doc-jsons/${this._packageName}/`
            : `s3://doc-jsons/${this._packageName}/`;
        const s3Url = `${S3BucketPath}${fileName}`;
        await execAsync(
            `aws s3 cp ${jsonFilePath} ${s3Url} --profile 0xproject --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers --content-type application/json`,
            {
                cwd,
            },
        );
        utils.log(`GENERATE_UPLOAD_DOCS: Docs uploaded to S3 bucket: ${S3BucketPath}`);
        // Remove the generated docs directory
        await execAsync(`rm -rf ${jsonFilePath}`, {
            cwd,
        });
    }
    /**
     *  Look for types that are used by the public interface but are missing from a package's index.ts
     */
    private _lookForMissingReferenceExportsThrowIfExists(referenceNames: string[]): void {
        const allExportedItems = _.flatten(_.values(this._exportPathToExportedItems));
        const missingReferences: string[] = [];
        _.each(referenceNames, referenceName => {
            if (
                !_.includes(allExportedItems, referenceName) &&
                _.isUndefined(docGenConfigs.EXTERNAL_TYPE_TO_LINK[referenceName])
            ) {
                missingReferences.push(referenceName);
            }
        });
        if (!_.isEmpty(missingReferences)) {
            throw new Error(
                `${this._packageName} package needs to export: \n${missingReferences.join(
                    '\n',
                )} \nFrom it\'s index.ts. If any are from external dependencies, then add them to the EXTERNAL_TYPE_TO_LINK mapping.`,
            );
        }
    }
    /**
     * Look for exported types that are not used by the package's public interface
     */
    private _lookForUnusedExportedTypesThrowIfExists(referenceNames: string[], typedocOutput: any): void {
        const exportedTypes = DocGenerateAndUploadUtils._getAllTypeNames(typedocOutput, []);
        const excessiveReferences = _.difference(exportedTypes, referenceNames);
        const excessiveReferencesExceptIgnored = _.difference(
            excessiveReferences,
            docGenConfigs.IGNORED_EXCESSIVE_TYPES,
        );
        if (!_.isEmpty(excessiveReferencesExceptIgnored)) {
            throw new Error(
                `${this._packageName} package exports BUT does not need: \n${excessiveReferencesExceptIgnored.join(
                    '\n',
                )} \nin it\'s index.ts. Remove them then try again OR if we still want them exported (e.g error enum types), then add them to the IGNORED_EXCESSIVE_TYPES array.`,
            );
        }
    }
    /**
     *  For each entry in the TypeDoc JSON, remove it if:
     * - it was not exported in index.ts
     * - the constructor is to be ignored
     * - it begins with an underscore (i.e is private)
     */
    private _pruneTypedocOutput(typedocOutput: any): any {
        const modifiedTypedocOutput = _.cloneDeep(typedocOutput);
        _.each(typedocOutput.children, (file, i) => {
            const exportPath = this._findExportPathGivenTypedocName(file.name);
            const exportItems = this._exportPathToExportedItems[exportPath];
            _.each(file.children, (child, j) => {
                const isNotExported = !_.includes(exportItems, child.name);
                if (isNotExported) {
                    delete modifiedTypedocOutput.children[i].children[j];
                    return;
                }

                const innerChildren = typedocOutput.children[i].children[j].children;
                _.each(innerChildren, (innerChild, k) => {
                    const isHiddenConstructor =
                        child.kindString === 'Class' &&
                        _.includes(docGenConfigs.CLASSES_WITH_HIDDEN_CONSTRUCTORS, child.name) &&
                        innerChild.kindString === 'Constructor';
                    const isPrivate = _.startsWith(innerChild.name, '_');
                    if (isHiddenConstructor || isPrivate) {
                        delete modifiedTypedocOutput.children[i].children[j].children[k];
                    }
                });
                modifiedTypedocOutput.children[i].children[j].children = _.compact(
                    modifiedTypedocOutput.children[i].children[j].children,
                );
            });
            modifiedTypedocOutput.children[i].children = _.compact(modifiedTypedocOutput.children[i].children);
        });
        return modifiedTypedocOutput;
    }
    /**
     * Unfortunately TypeDoc children names will only be prefixed with the name of the package _if_ we passed
     * TypeDoc files outside of the packages root path (i.e this package exports another package from our
     * monorepo). In order to enforce that the names are always prefixed with the package's name, we check and add
     * them here when necessary.
     */
    private _standardizeTypedocOutputTopLevelChildNames(typedocOutput: any): any {
        const modifiedTypedocOutput = _.cloneDeep(typedocOutput);
        _.each(typedocOutput.children, (child, i) => {
            if (!_.includes(child.name, '/src/')) {
                const nameWithoutQuotes = child.name.replace(/"/g, '');
                const standardizedName = `"${this._packageName}/src/${nameWithoutQuotes}"`;
                modifiedTypedocOutput.children[i].name = standardizedName;
            }
        });
        return modifiedTypedocOutput;
    }
    /**
     * Maps back each top-level TypeDoc JSON object name to the exportPath from which it was generated.
     */
    private _findExportPathGivenTypedocName(typedocName: string): string {
        const typeDocNameWithoutQuotes = _.replace(typedocName, /"/g, '');
        const sanitizedExportPathToExportPath: { [sanitizedName: string]: string } = {};
        const exportPaths = _.keys(this._exportPathToExportedItems);
        const sanitizedExportPaths = _.map(exportPaths, exportPath => {
            if (_.startsWith(exportPath, './')) {
                const sanitizedExportPath = path.join(this._packageName, 'src', exportPath);
                sanitizedExportPathToExportPath[sanitizedExportPath] = exportPath;
                return sanitizedExportPath;
            }
            const monorepoPrefix = '@0x/';
            if (_.startsWith(exportPath, monorepoPrefix)) {
                const sanitizedExportPath = exportPath.split(monorepoPrefix)[1];
                sanitizedExportPathToExportPath[sanitizedExportPath] = exportPath;
                return sanitizedExportPath;
            }
            sanitizedExportPathToExportPath[exportPath] = exportPath;
            return exportPath;
        });
        // We need to sort the exportPaths by length (longest first), so that the match finding will pick
        // longer matches before shorter matches, since it might match both, but the longer match is more
        // precisely what we are looking for.
        const sanitizedExportPathsSortedByLength = sanitizedExportPaths.sort((a: string, b: string) => {
            return b.length - a.length;
        });
        const matchingSanitizedExportPathIfExists = _.find(sanitizedExportPathsSortedByLength, p => {
            return _.startsWith(typeDocNameWithoutQuotes, p);
        });
        if (_.isUndefined(matchingSanitizedExportPathIfExists)) {
            throw new Error(`Didn't find an exportPath for ${typeDocNameWithoutQuotes}`);
        }
        const matchingExportPath = sanitizedExportPathToExportPath[matchingSanitizedExportPathIfExists];
        return matchingExportPath;
    }
    private _getAllExternalExports(): string[] {
        const externalExports: string[] = [];
        _.each(this._exportPathToExportedItems, (exportedItems, exportPath) => {
            const pathIfExists = this._monoRepoPkgNameToPath[exportPath];
            if (_.isUndefined(pathIfExists) && !_.startsWith(exportPath, './')) {
                _.each(exportedItems, exportedItem => {
                    externalExports.push(exportedItem);
                });
                return; // It's an external package
            }
        });
        return externalExports;
    }
    private _getTypeDocFileIncludesForPackage(): string[] {
        let typeDocExtraFileIncludes: string[] = [];
        _.each(this._exportPathToExportedItems, (exportedItems, exportPath) => {
            const isInternalToPkg = _.startsWith(exportPath, '.');
            if (isInternalToPkg) {
                const pathToInternalPkg = path.join(this._packagePath, 'src', `${exportPath}.ts`);
                typeDocExtraFileIncludes.push(pathToInternalPkg);
                return;
            }

            const pathIfExists = this._monoRepoPkgNameToPath[exportPath];
            if (_.isUndefined(pathIfExists)) {
                return; // It's an external package
            }

            const typeDocSourceIncludes = new Set();
            const pathToIndex = `${pathIfExists}/src/index.ts`;
            const exportInfo = DocGenerateAndUploadUtils._getExportPathToExportedItems(pathToIndex);
            const innerExportPathToExportedItems = exportInfo.exportPathToExportedItems;
            _.each(exportedItems, exportName => {
                _.each(innerExportPathToExportedItems, (innerExportItems, innerExportPath) => {
                    if (!_.includes(innerExportItems, exportName)) {
                        return;
                    }
                    if (!_.startsWith(innerExportPath, './')) {
                        throw new Error(
                            `GENERATE_UPLOAD_DOCS: WARNING - ${
                                this._packageName
                            } is exporting one of ${innerExportItems} which is
                            itself exported from an external package. To fix this, export the external dependency directly,
                            not indirectly through ${innerExportPath}.`,
                        );
                    } else {
                        const absoluteSrcPath = path.join(pathIfExists, 'src', `${innerExportPath}.ts`);
                        typeDocSourceIncludes.add(absoluteSrcPath);
                    }
                });
            });

            // @0x/types & ethereum-types are examples of packages where their index.ts exports types
            // directly, meaning no internal paths will exist to follow. Other packages also have direct exports
            // in their index.ts, so we always add it to the source files passed to TypeDoc
            if (typeDocSourceIncludes.size === 0) {
                typeDocSourceIncludes.add(pathToIndex);
            }

            typeDocExtraFileIncludes = [...typeDocExtraFileIncludes, ...Array.from(typeDocSourceIncludes)];
        });
        return typeDocExtraFileIncludes;
    }
}
