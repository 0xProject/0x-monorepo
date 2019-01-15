from aiohttp import web
from v0x.database import init_database
from v0x.handlers import routes


def create_app():
    app = web.Application()
    app.add_routes(routes)
    app.on_startup.append(init_database)
    return app
