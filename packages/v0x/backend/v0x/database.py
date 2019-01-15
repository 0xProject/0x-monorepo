import asyncpg
import os
import ssl
from aiohttp import web
from distutils.util import strtobool

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

async def init_database(app: web.Application):
    pool = await asyncpg.create_pool(
        dsn=os.environ.get('DATABASE_URL'),
        ssl=SSL_CTX if strtobool(os.environ.get('DATABASE_SSL_ENABLED', '0')) else None)
    async with pool.acquire() as con:
        await con.execute(
            """
            CREATE TABLE IF NOT EXISTS votes (
                campaign_id BIGINT,
                voter_address VARCHAR, -- hex
                preference VARCHAR,
                comment VARCHAR,
                zrx VARCHAR, -- hex
                timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                signature VARCHAR, -- hex

                PRIMARY KEY (campaign_id, voter_address)
            );

            CREATE TABLE IF NOT EXISTS campaigns (
                campaign_id BIGSERIAL PRIMARY KEY,
                open_date TIMESTAMP WITHOUT TIME ZONE,
                close_date TIMESTAMP WITHOUT TIME ZONE,
                open_block BIGINT
            );
            """)
        # TODO: make an admin way to add this
        from datetime import datetime
        await con.execute(
            """
            INSERT INTO campaigns (campaign_id, open_date, close_date, open_block)
            VALUES ($1, $2, $3, $4) ON CONFLICT (campaign_id) DO NOTHING;
            """,
            1, datetime.utcnow(), datetime.utcnow(), 0x6be328)
    app['pool'] = pool
