from aiohttp import web
from v0x.vote_utils import verify_signature


routes = web.RouteTableDef()


@routes.post('/api/vote')
async def vote(request: web.Request) -> web.Response:
    data = await request.json()
    try:
        campaign_id = int(data['campaignId'])
        preference = data['preference']
        voter_address = data['voterAddress']
        signature = data['signature']
        comment = data.get('comment', '').strip()
    except KeyError as ke:
        return web.json_response({'error': 'Bad Arguments',
                                  'missingKeys': list(ke.args)}, status=400)
    except AttributeError:
        # raised if comments is not a string
        return web.json_response({
            'error': 'Bad Arguments',
            'invalidKeys': ['comment']
        }, status=400)
    except ValueError:
        # raised if campaignId is not convertable to an integer
        return web.json_response({
            'error': 'Bad Arguments',
            'invalidKeys': ['campaignId']
        }, status=400)

    # signature validation
    try:
        signature_bytes = bytes.fromhex(signature[2:])
        if len(signature_bytes) != 65:
            return web.json_response({
                'error': 'Bad Arguments',
                'invalidKeys': ['signature']
            }, status=400)
    except (ValueError, TypeError):
        return web.json_response({
            'error': 'Bad Arguments',
            'invalidKeys': ['signature']
        }, status=400)

    # address validation
    try:
        if len(bytes.fromhex(voter_address[2:])) != 20:
            return web.json_response({
                'error': 'Bad Arguments',
                'invalidKeys': ['voterAddress']
            }, status=400)
        voter_address = voter_address.lower()
    except (ValueError, TypeError):
        return web.json_response({
            'error': 'Bad Arguments',
            'invalidKeys': ['voterAddress']
        }, status=400)

    # validate preference
    if preference != 'Yes' and preference != 'No':
        return web.json_response({
            'error': 'Bad Arguments',
            'invalidKeys': ['preference']
        }, status=400)

    if not verify_signature(campaign_id, voter_address, preference, signature_bytes):
        return web.json_response({
            'error': 'Bad Arguments',
            'message': 'signature does not match voterAddress'
        }, status=400)

    # TODO: verify campaign can be voted on now

    async with request.app['pool'].acquire() as con:
        await con.execute("INSERT INTO votes "
                          "(campaign_id, voter_address, preference, comment, signature) "
                          "VALUES ($1, $2, $3, $4, $5) "
                          "ON CONFLICT (campaign_id, voter_address) "
                          "DO UPDATE SET "
                          "preference = EXCLUDED.preference, "
                          "comment = EXCLUDED.comment, "
                          "signature = EXCLUDED.signature",
                          campaign_id, voter_address, preference, comment, signature)

    return web.json_response({'ok': True})


@routes.get('/api/votes/{campaign_id}')
async def list_votes(request: web.Request) -> web.Response:
    try:
        campaign_id = int(request.match_info['campaign_id'])
    except ValueError:
        return web.json_response({
            'error': 'Bad Arguments',
            'message': 'Invalid campaign Id'
        }, status=400)
    async with request.app['pool'].acquire() as con:
        votes = await con.fetch("SELECT * FROM votes "
                                "WHERE campaign_id = $1 "
                                "ORDER BY timestamp DESC",
                                campaign_id)
    return web.json_response({'votes': [
        {
            'voterAddress': v['voter_address'],
            'preference': v['preference'],
            'comment': v['comment'],
            'timestamp': v['timestamp'].isoformat() + "Z",
            'zrx': v['zrx']
        } for v in votes
    ]})
