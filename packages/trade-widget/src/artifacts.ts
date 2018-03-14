/* tslint:disable */
import { Artifact } from './types';
import { zeroExArtifacts } from './zeroex_artifacts';

const Forwarder = require('./artifacts/Forwarder.json');

export const artifacts = {
    ...zeroExArtifacts,
    Forwarder: (Forwarder as any) as Artifact,
};
