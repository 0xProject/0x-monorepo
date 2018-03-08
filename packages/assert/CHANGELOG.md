# CHANGELOG

## v0.2.0 - _TBD, 2018_

    * Rename `isHttpUrl` to `isWebUri` (#412)

## v0.1.0 - _March 4, 2018_

    * Remove isETHAddressHex checksum address check and assume address will be lowercased  (#373)
    * Add an optional parameter `subSchemas` to `doesConformToSchema` method (#385)

## v0.0.18 - _February 9, 2017_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.0.4 - _November 14, 2017_

    * Re-publish Assert previously published under NPM package @0xproject/0x-assert
    * Added assertion isValidBaseUnitAmount which checks both that the value is a valid bigNumber and that it does not contain decimals.
