import * as Docker from 'dockerode';
import * as R from 'ramda';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import * as ormConfig from '../../src/ormconfig';

// The name to use for the Docker container which will run Postgres.
const DOCKER_CONTAINER_NAME = '0x_pipeline_postgres_test';
// The port which will be exposed on the Docker container.
const POSTGRES_HOST_PORT = '15432';
// Number of milliseconds to wait for postgres to finish initializing after
// starting the docker container.
const POSTGRES_SETUP_DELAY_MS = 5000;

// We need to replace the normal url in ormConfig with the db url we use for
// testing.
const testDbUrl = `postgresql://postgres@localhost:${POSTGRES_HOST_PORT}/postgres`;
const testOrmConfig = R.merge(ormConfig, { url: testDbUrl }) as ConnectionOptions;

const docker = new Docker({
    // TODO(albrow): Handle different Docker configurations and different OSes
    // more gracefully here.
    socketPath: '/var/run/docker.sock',
});

/**
 * Sets up a Docker container with Postgres running for testing purposes and
 * runs the migrations.
 */
export async function setUpDbAsync(): Promise<void> {
    // Check if a container with the desired name already exists. If so, this
    // probably means we didn't clean up properly on the last test run.
    const existingContainer = docker.getContainer(DOCKER_CONTAINER_NAME);
    if (existingContainer != null) {
        try {
            await existingContainer.kill();
        } catch {
            // If this fails, it's fine. The container was probably already
            // killed.
        }
        try {
            await existingContainer.remove();
        } catch {
            // If this fails, it's fine. The container was probably already
            // removed.
        }
    }

    // Create the container we need.
    const postgresContainer = await docker.createContainer({
        name: DOCKER_CONTAINER_NAME,
        Image: 'postgres:11-alpine',
        ExposedPorts: {
            '5432': {},
        },
        HostConfig: {
            PortBindings: {
                '5432': [
                    {
                        HostPort: POSTGRES_HOST_PORT,
                    },
                ],
            },
        },
    });
    await postgresContainer.start();
    await sleepAsync(POSTGRES_SETUP_DELAY_MS);

    // Run the migrations.
    const connection = await createDbConnectionOnceAsync();
    await connection.runMigrations({ transaction: true });
}

/**
 * Tears down the Docker container used for testing. This completely destroys
 * any data.
 */
export async function tearDownDbAsync(): Promise<void> {
    const postgresContainer = docker.getContainer(DOCKER_CONTAINER_NAME);
    await postgresContainer.kill();
    await postgresContainer.remove();
}

let savedConnection: Connection;

/**
 * The first time this is run, it creates and returns a new TypeORM connection.
 * Each subsequent time, it returns the existing connection. This is helpful
 * because only one TypeORM connection can be active at a time.
 */
export async function createDbConnectionOnceAsync(): Promise<Connection> {
    if (savedConnection !== undefined) {
        return savedConnection;
    }
    savedConnection = await createConnection(testOrmConfig);
    return savedConnection;
}

async function sleepAsync(ms: number): Promise<{}> {
    return new Promise<{}>(resolve => setTimeout(resolve, ms));
}
