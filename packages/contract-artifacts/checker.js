const fs = require('fs');
const artifacts = fs.readdirSync('./artifacts')

let prefixes = '';

for (const artifact of artifacts) {
    const _path = `./artifacts/${artifact}`;
    const artifactObj = JSON.parse(fs.readFileSync(_path));
    const foundIndex = artifactObj.compilerOutput.evm.bytecode.object.indexOf(artifactObj.compilerOutput.evm.deployedBytecode.object.substr(2));
    console.log(`Found at ${foundIndex} in ${artifact}`);
    const prefix = artifactObj.compilerOutput.evm.bytecode.object.substr(0, foundIndex);
    prefixes = prefixes + prefix + '\n';
}

console.log('============== PREFIXES ============');
console.log(prefixes);
