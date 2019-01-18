import { fetchAsync } from '@0x/utils';
import { exec as execAsync } from 'promisify-child-process';

import { utils } from './utils';

const API_ENDPOINT = 'https://hub.docker.com/v2';
const HTTP_OK_STATUS = 200;

export const dockerHubUtils = {
    async getTokenAsync(): Promise<string> {
        const payload = {
            username: process.env.DOCKER_USERNAME,
            password: process.env.DOCKER_PASS,
        };
        const response = await fetchAsync(`${API_ENDPOINT}/users/login`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (response.status !== HTTP_OK_STATUS) {
            throw new Error(
                `DockerHub user login failed (status code: ${
                    response.status
                }). Make sure you have environment variables 'DOCKER_USERNAME; and 'DOCKER_PASS' set`,
            );
        }
        const respPayload = await response.json();
        const token = respPayload.token;
        return token;
    },
    async checkUserAddedToOrganizationOrThrowAsync(organization: string): Promise<void> {
        utils.log('Checking that the user was added to the 0xorg DockerHub organization...');
        const token = await dockerHubUtils.getTokenAsync();
        const response = await fetchAsync(`${API_ENDPOINT}/repositories/${organization}/?page_size=10`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: `JWT ${token}`,
            },
        });
        const respPayload = await response.json();
        if (response.status !== HTTP_OK_STATUS || respPayload.count === 0) {
            throw new Error(
                `Failed to fetch org: ${organization}'s list of repos (status code: ${
                    response.status
                }). Make sure your account has been added to the '${organization}' org on DockerHub`,
            );
        }
    },
    async loginUserToDockerCommandlineOrThrowAsync(): Promise<void> {
        try {
            utils.log('Checking that the user is logged in to docker command...');
            await execAsync(`echo "$DOCKER_PASS" | docker login -u $DOCKER_USERNAME --password-stdin`);
        } catch (err) {
            throw new Error(
                `Failed to log you into the 'docker' commandline tool. Make sure you have the 'docker' commandline tool installed. Full error: ${
                    err.message
                }`,
            );
        }
    },
};
