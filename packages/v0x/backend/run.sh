#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

export DATABASE_URL="postgresql:///v0x"
export DATABASE_SSL_ENABLED=0
export PORT=5000

if ! pg_isready -q; then
    echo "Postgresql isn't running! you need to start it..."
    exit 1
fi

if ! psql $DATABASE_URL -c "SELECT 1" > /dev/null; then
    createdb v0x
fi

if [ ! -d env ]; then
    virtualenv -p python3.7 env
    env/bin/pip install -r requirements.txt
fi

env/bin/python -m v0x
