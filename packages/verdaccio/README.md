## 0x Verdaccio

This package contains a Dockerfile and conf.yaml file for configuring our own
Docker image for Verdaccio.

See https://verdaccio.org/docs/en/configuration for more information.

## Build

In the root directory for _this package_, run:

`sudo docker build . -t 0x-verdaccio`

## Run

To start Verdaccio run:

`sudo docker run --rm -i -p 4873:4873 0x-verdaccio`
