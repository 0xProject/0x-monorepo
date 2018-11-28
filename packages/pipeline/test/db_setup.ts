import * as Docker from 'dockerode';
import * as fs from 'fs';
import * as R from 'ramda';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import * as ormConfig from '../src/ormconfig';

// The name of the image to pull and use for the container. This also affects
// which version of Postgres we use.
const DOCKER_IMAGE_NAME = 'postgres:11-alpine';
// The name to use for the Docker container which will run Postgres.
const DOCKER_CONTAINER_NAME = '0x_pipeline_postgres_test';
// The port which will be exposed on the Docker container.
const POSTGRES_HOST_PORT = '15432';
// Number of milliseconds to wait for postgres to finish initializing after
// starting the docker container.
const POSTGRES_SETUP_DELAY_MS = 5000;

/**
 * Sets up the database for testing purposes. If the
 * ZEROEX_DATA_PIPELINE_TEST_DB_URL env var is specified, it will create a
 * connection using that url. Otherwise it will spin up a new Docker container
 * with a Postgres database and then create a connection to that database.
 */
export async function setUpDbAsync(): Promise<void> {
    const connection = await createDbConnectionOnceAsync();
    await connection.runMigrations({ transaction: true });
}

/**
 * Tears down the database used for testing. This completely destroys any data.
 * If a docker container was created, it destroys that container too.
 */
export async function tearDownDbAsync(): Promise<void> {
    const connection = await createDbConnectionOnceAsync();
    for (const _ of connection.migrations) {
        await connection.undoLastMigration({ transaction: true });
    }
    if (needsDocker()) {
        const docker = initDockerOnce();
        const postgresContainer = docker.getContainer(DOCKER_CONTAINER_NAME);
        await postgresContainer.kill();
        await postgresContainer.remove();
    }
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

    if (needsDocker()) {
        await initContainerAsync();
    }
    const testDbUrl =
        process.env.ZEROEX_DATA_PIPELINE_TEST_DB_URL ||
        `postgresql://postgres@localhost:${POSTGRES_HOST_PORT}/postgres`;
    const testOrmConfig = R.merge(ormConfig, { url: testDbUrl }) as ConnectionOptions;

    savedConnection = await createConnection(testOrmConfig);
    return savedConnection;
}

async function sleepAsync(ms: number): Promise<{}> {
    return new Promise<{}>(resolve => setTimeout(resolve, ms));
}

let savedDocker: Docker;

function initDockerOnce(): Docker {
    if (savedDocker !== undefined) {
        return savedDocker;
    }

    // Note(albrow): Code for determining the right socket path is partially
    // based on https://github.com/apocas/dockerode/blob/8f3aa85311fab64d58eca08fef49aa1da5b5f60b/test/spec_helper.js
    const isWin = require('os').type() === 'Windows_NT';
    const socketPath = process.env.DOCKER_SOCKET || (isWin ? '//./pipe/docker_engine' : '/var/run/docker.sock');
    const isSocket = fs.existsSync(socketPath) ? fs.statSync(socketPath).isSocket() : false;
    if (!isSocket) {
        throw new Error(`Failed to connect to Docker using socket path: "${socketPath}".

The database integration tests need to be able to connect to a Postgres database. Make sure that Docker is running and accessible at the expected socket path. If Docker isn't working you have two options:

    1) Set the DOCKER_SOCKET environment variable to a socket path that can be used to connect to Docker or
    2) Set the ZEROEX_DATA_PIPELINE_TEST_DB_URL environment variable to connect directly to an existing Postgres database instead of trying to start Postgres via Docker
`);
    }
    savedDocker = new Docker({
        socketPath,
    });
    return savedDocker;
}

// Creates the container, waits for it to initialize, and returns it.
async function initContainerAsync(): Promise<Docker.Container> {
    const docker = initDockerOnce();

    // Tear down any existing containers with the same name.
    await tearDownExistingContainerIfAnyAsync();

    // Pull the image we need.
    await pullImageAsync(docker, DOCKER_IMAGE_NAME);

    // Create the container.
    const postgresContainer = await docker.createContainer({
        name: DOCKER_CONTAINER_NAME,
        Image: DOCKER_IMAGE_NAME,
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
    return postgresContainer;
}

async function tearDownExistingContainerIfAnyAsync(): Promise<void> {
    const docker = initDockerOnce();

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
}

function needsDocker(): boolean {
    return process.env.ZEROEX_DATA_PIPELINE_TEST_DB_URL === undefined;
}

// Note(albrow): This is partially based on
// https://stackoverflow.com/questions/38258263/how-do-i-wait-for-a-pull
async function pullImageAsync(docker: Docker, imageName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        docker.pull(imageName, {}, (err, stream) => {
            if (err != null) {
                reject(err);
                return;
            }
            docker.modem.followProgress(stream, () => {
                resolve();
            });
        });
    });
}
