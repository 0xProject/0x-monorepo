import { getVersionsByDependency, hasAnyMultipleVersions, printVersionsByDependency } from './deps_versions';

const versions = getVersionsByDependency();
const hasMultiples = hasAnyMultipleVersions(versions);

if (hasMultiples) {
    printVersionsByDependency(versions);
    throw new Error(
        'Detected multiple dependency versions. Add exceptions to root package.json config.dependenciesWithMultipleVersions',
    );
}
