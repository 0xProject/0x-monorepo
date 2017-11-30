import {Artifacts} from '../util/artifacts';
const {Migrations} = new Artifacts(artifacts);

module.exports = (deployer: any) => {
  deployer.deploy(Migrations);
};
