import coloredlogs
import logging
import os
from aiohttp import web
from v0x.app import create_app

if __name__ == '__main__':
    coloredlogs.install()
    logging.getLogger('aiohttp.access').setLevel(logging.DEBUG)
    logging.getLogger('aiohttp.server').setLevel(logging.DEBUG)

    app = create_app()
    web.run_app(app, port=os.environ.get('PORT', 5000))
