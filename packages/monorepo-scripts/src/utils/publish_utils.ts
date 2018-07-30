import * as _ from 'lodash';
import * as promisify from 'es6-promisify';
import * as publishRelease from 'publish-release';

import { constants } from '../constants';
import { Package } from '../types';
import { utils } from './utils';

import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as ts from 'typescript';

import { ExportPathToExportedItems } from '../types';

const publishReleaseAsync = promisify(publishRelease);
export async function publishReleaseNotesAsync(updatedPublishPackages: Package[]): Promise<void> {
    // Git push a tag representing this publish (publish-{commit-hash}) (truncate hash)
    const result = await execAsync('git log -n 1 --pretty=format:"%H"', { cwd: constants.monorepoRootPath });
    const latestGitCommit = result.stdout;
    const shortenedGitCommit = latestGitCommit.slice(0, 7);
    const tagName = `monorepo@${shortenedGitCommit}`;

    await execAsync(`git rev-parse ${tagName}`);
    await execAsync('git tag ${tagName}');

    await execAsync('git push origin ${tagName}');
    const releaseName = `0x monorepo - ${shortenedGitCommit}`;

    let assets: string[] = [];
    let aggregateNotes = '';
    _.each(updatedPublishPackages, pkg => {
        const notes = getReleaseNotesForPackage(pkg.packageJson.name, pkg.packageJson.version);
        if (_.isEmpty(notes)) {
            return; // don't include it
        }
        aggregateNotes += `### ${pkg.packageJson.name}@${pkg.packageJson.version}\n${notes}\n\n`;

        const packageAssets = _.get(pkg.packageJson, 'config.postpublish.assets');
        if (!_.isUndefined(packageAssets)) {
            assets = [...assets, ...packageAssets];
        }
    });
    const finalAssets = adjustAssetPaths(assets);

    utils.log('Publishing release notes ', releaseName, '...');
    // TODO: Currently publish-release doesn't let you specify the labels for each asset uploaded
    // Ideally we would like to name the assets after the package they are from
    // Source: https://github.com/remixz/publish-release/issues/39
    await publishReleaseAsync({
        token: constants.githubPersonalAccessToken,
        owner: '0xProject',
        tag: tagName,
        repo: '0x-monorepo',
        name: releaseName,
        notes: aggregateNotes,
        draft: false,
        prerelease: false,
        reuseRelease: true,
        reuseDraftOnly: false,
        assets: finalAssets,
    });
}

// Asset paths should described from the monorepo root. This method prefixes
// the supplied path with the absolute path to the monorepo root.
function adjustAssetPaths(assets: string[]): string[] {
    const finalAssets: string[] = [];
    _.each(assets, (asset: string) => {
        const finalAsset = `${constants.monorepoRootPath}/${asset}`;
        finalAssets.push(finalAsset);
    });
    return finalAssets;
}

function getReleaseNotesForPackage(packageName: string, version: string): string {
    const packageNameWithoutNamespace = packageName.replace('@0xproject/', '');
    const changelogJSONPath = path.join(
        constants.monorepoRootPath,
        'packages',
        packageNameWithoutNamespace,
        'CHANGELOG.json',
    );
    const changelogJSON = readFileSync(changelogJSONPath, 'utf-8');
    const changelogs = JSON.parse(changelogJSON);
    const latestLog = changelogs[0];
    // If only has a `Dependencies updated` changelog, we don't include it in release notes
    if (latestLog.changes.length === 1 && latestLog.changes[0].note === constants.dependenciesUpdatedMessage) {
        return '';
    }
    // We sanity check that the version for the changelog notes we are about to publish to Github
    // correspond to the new version of the package.
    // if (version !== latestLog.version) {
    //     throw new Error('Expected CHANGELOG.json latest entry version to coincide with published version.');
    // }
    let notes = '';
    _.each(latestLog.changes, change => {
        notes += `* ${change.note}`;
        if (change.pr) {
            notes += ` (#${change.pr})`;
        }
        notes += `\n`;
    });
    return notes;
}

export async function generateAndUploadDocsAsync(packageName: string, isStaging: boolean): Promise<void> {
    const pathToPackage = `${constants.monorepoRootPath}/packages/${packageName}`;
    const indexPath = `${pathToPackage}/src/index.ts`;
    const exportPathToExportedItems = getExportPathToExportedItems(indexPath);

    const monorepoPackages = utils.getPackages(constants.monorepoRootPath);
    const pkg = _.find(monorepoPackages, monorepoPackage => {
        return _.includes(monorepoPackage.packageJson.name, packageName);
    });
    if (_.isUndefined(pkg)) {
        throw new Error(`Couldn't find a package.json for ${packageName}`);
    }

    const packageJson = pkg.packageJson;
    const shouldPublishDocs = !!_.get(packageJson, 'config.postpublish.shouldPublishDocs');
    if (!shouldPublishDocs) {
        utils.log(
            `GENERATE_UPLOAD_DOCS: ${
                packageJson.name
            } packageJson.config.postpublish.shouldPublishDocs is false. Skipping doc JSON generation.`,
        );
        return;
    }

    const pkgNameToPath: { [name: string]: string } = {};
    _.each(monorepoPackages, pkg => {
        pkgNameToPath[pkg.packageJson.name] = pkg.location;
    });

    // For each dep that is another one of our monorepo packages, we fetch it's index.ts
    // and see which specific files we must pass to TypeDoc.
    let typeDocExtraFileIncludes: string[] = [];
    _.each(exportPathToExportedItems, (exportedItems, exportPath) => {
        const isInternalToPkg = _.startsWith(exportPath, '.');
        if (isInternalToPkg) {
            const pathToInternalPkg = path.join(pathToPackage, 'src', `${exportPath}.ts`);
            typeDocExtraFileIncludes.push(pathToInternalPkg);
            return; // Right?
        }

        const pathIfExists = pkgNameToPath[exportPath];
        if (_.isUndefined(pathIfExists)) {
            return; // It's an external package
        }

        const typeDocSourceIncludes = new Set();
        const pathToIndex = `${pathIfExists}/src/index.ts`;
        const innerExportPathToExportedItems = getExportPathToExportedItems(pathToIndex);
        _.each(exportedItems, exportName => {
            _.each(innerExportPathToExportedItems, (innerExportItems, innerExportPath) => {
                if (!_.includes(innerExportItems, exportName)) {
                    return;
                }
                if (!_.startsWith(innerExportPath, './')) {
                    throw new Error(
                        `GENERATE_UPLOAD_DOCS: WARNING - ${packageName} is exporting one of ${innerExportItems} which is 
                        itself exported from an external package. To fix this, export the external dependency directly, 
                        not indirectly through ${innerExportPath}.`,
                    );
                } else {
                    const absoluteSrcPath = path.join(pathIfExists, 'src', `${innerExportPath}.ts`);
                    typeDocSourceIncludes.add(absoluteSrcPath);
                }
            });
        });
        // @0xproject/types & ethereum-types are examples of packages where their index.ts exports types
        // directly, meaning no internal paths will exist to follow. Other packages also have direct exports
        // in their index.ts, so we always add it to the source files passed to TypeDoc
        if (typeDocSourceIncludes.size === 0) {
            typeDocSourceIncludes.add(pathToIndex);
        }

        typeDocExtraFileIncludes = [...typeDocExtraFileIncludes, ...Array.from(typeDocSourceIncludes)];
    });

    // Generate Typedoc JSON file
    const jsonFilePath = path.join(pathToPackage, 'generated_docs', 'index.json');
    const projectFiles = typeDocExtraFileIncludes.join(' ');
    const cwd = path.join(constants.monorepoRootPath, 'packages', packageName);
    // HACK: For some reason calling `typedoc` command directly from here, even with `cwd` set to the
    // packages root dir, does not work. It only works when called via a `package.json` script located
    // in the package's root.
    await execAsync(`JSON_FILE_PATH=${jsonFilePath} PROJECT_FILES="${projectFiles}" yarn docs:json`, {
        cwd,
    });

    // Unfortunately TypeDoc children names will only be prefixed with the name of the package _if_ we passed
    // TypeDoc files outside of the packages root path (i.e this package exports another package found in our
    // monorepo). In order to enforce that the names are always prefixed with the package's name, we check and add
    // it here when necessary.
    const typedocOutputString = readFileSync(jsonFilePath).toString();
    const typedocOutput = JSON.parse(typedocOutputString);
    const finalTypeDocOutput = _.clone(typedocOutput);
    _.each(typedocOutput.children, (child, i) => {
        if (!_.includes(child.name, '/src/')) {
            const nameWithoutQuotes = child.name.replace(/"/g, '');
            finalTypeDocOutput.children[i].name = `"${packageName}/src/${nameWithoutQuotes}"`;
        }
    });

    // For each entry, see if it was exported in index.ts. If not, remove it.
    _.each(typedocOutput.children, (file, i) => {
        const exportItems = findExportItemsGivenTypedocName(exportPathToExportedItems, packageName, file.name);
        _.each(file.children, (child, j) => {
            if (!_.includes(exportItems, child.name)) {
                delete finalTypeDocOutput.children[i].children[j];
            }
        });
        finalTypeDocOutput.children[i].children = _.compact(finalTypeDocOutput.children[i].children);
    });
    // Write modified TypeDoc JSON, without all the unexported stuff
    writeFileSync(jsonFilePath, JSON.stringify(finalTypeDocOutput, null, 2));

    const fileName = `v${packageJson.version}.json`;
    utils.log(`GENERATE_UPLOAD_DOCS: Doc generation successful, uploading docs... as ${fileName}`);
    const S3BucketPath = isStaging ? `s3://staging-doc-jsons/${packageName}/` : `s3://doc-jsons/${packageName}/`;
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

function findExportItemsGivenTypedocName(
    exportPathToExportedItems: ExportPathToExportedItems,
    packageName: string,
    typedocName: string,
): string[] {
    const typeDocNameWithoutQuotes = _.replace(typedocName, '"', '');
    const sanitizedExportPathToExportPath: { [sanitizedName: string]: string } = {};
    const exportPaths = _.keys(exportPathToExportedItems);
    const sanitizedExportPaths = _.map(exportPaths, exportPath => {
        if (_.startsWith(exportPath, './')) {
            const sanitizedExportPath = path.join(packageName, 'src', exportPath);
            sanitizedExportPathToExportPath[sanitizedExportPath] = exportPath;
            return sanitizedExportPath;
        }
        const monorepoPrefix = '@0xproject/';
        if (_.startsWith(exportPath, monorepoPrefix)) {
            const sanitizedExportPath = exportPath.split(monorepoPrefix)[1];
            sanitizedExportPathToExportPath[sanitizedExportPath] = exportPath;
            return sanitizedExportPath;
        }
        sanitizedExportPathToExportPath[exportPath] = exportPath;
        return exportPath;
    });
    const matchingSanitizedExportPathIfExists = _.find(sanitizedExportPaths, p => {
        return _.startsWith(typeDocNameWithoutQuotes, p);
    });
    if (_.isUndefined(matchingSanitizedExportPathIfExists)) {
        throw new Error(`Didn't find an exportPath for ${typeDocNameWithoutQuotes}`);
    }
    const matchingExportPath = sanitizedExportPathToExportPath[matchingSanitizedExportPathIfExists];
    return exportPathToExportedItems[matchingExportPath];
}

function getExportPathToExportedItems(pkgPath: string): ExportPathToExportedItems {
    const sourceFile = ts.createSourceFile(
        'indexFile',
        readFileSync(pkgPath).toString(),
        ts.ScriptTarget.ES2017,
        /*setParentNodes */ true,
    );
    const exportPathToExportedItems = _getExportPathToExportedItems(sourceFile);
    return exportPathToExportedItems;
}

function _getExportPathToExportedItems(sf: ts.SourceFile): ExportPathToExportedItems {
    const exportPathToExportedItems: ExportPathToExportedItems = {};
    processNode(sf);

    function processNode(node: ts.Node): void {
        switch (node.kind) {
            case ts.SyntaxKind.ExportDeclaration:
                // console.log(node);
                const exportClause = (node as any).exportClause;
                const pkgName = exportClause.parent.moduleSpecifier.text;
                _.each(exportClause.elements, element => {
                    exportPathToExportedItems[pkgName] = _.isUndefined(exportPathToExportedItems[pkgName])
                        ? [element.name.escapedText]
                        : [...exportPathToExportedItems[pkgName], element.name.escapedText];
                });
                break;

            default:
                // noop
                break;
        }

        ts.forEachChild(node, processNode);
    }
    return exportPathToExportedItems;
}
