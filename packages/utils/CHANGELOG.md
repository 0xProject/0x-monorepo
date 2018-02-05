# CHANGELOG

## v0.x.x - _TBD, 2018_

    * Fix a bug related to event signature collisions (argument indexes aren't included in event signatures) in the abi_decoder. The decoder used to throw on unknown events with identical signatures as a known event (except indexes). (#366)

## v0.2.0 - _January 17, 2018_

    * Add `onError` parameter to `intervalUtils.setAsyncExcludingInterval` (#312)
    * Add `intervalUtils.setInterval` (#312)
