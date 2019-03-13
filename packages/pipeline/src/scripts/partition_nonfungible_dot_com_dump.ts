/**
 * Needed because we store the initial dump of trades in S3, and some projects
 * (namely cryptokitties) have dumps that are too big to be transferred easily
 * as one big file to and from S3.  This script breaks apart a dump file into a
 * set of files containing segments of the data.  The number of segments is
 * based on S3_CHUNK_SIZES specified for each project, or "publisher" in their
 * parlance, in ../../data_sources/nonfungible_dot_com/index.ts.
 *
 * Usage: $ node partition_nonfungible_dot_com_dump.ts publisher
 * Example: $ node partition_nonfungible_dot_com_dump.ts cryptokitties
 *
 * Expects a to find on disk a data file named
 * `sales_summary_${publisher}.json`, as emailed by Daniel of nonfungible.com.
 *
 * Writes to disk a set of files named `sales_summary_${publisher}${N}.json`.
 *
 * Probably need to use `node` with --max-old-space-size=1024 or maybe
 * even more.
 */

import { readFileSync, writeFileSync } from 'fs';

import { splitEvery } from 'ramda';

import { logUtils } from '@0x/utils';

import {
    NonfungibleDotComHistoryResponse,
    NonfungibleDotComTradeResponse,
    S3_CHUNK_SIZES,
} from '../data_sources/nonfungible_dot_com';

(() => {
    const publisher = process.argv[2];

    const sourceJson: NonfungibleDotComHistoryResponse = JSON.parse(
        readFileSync(`sales_summary_${publisher}.json`).toString(),
    );

    const chunks: NonfungibleDotComTradeResponse[][] = splitEvery(S3_CHUNK_SIZES[publisher], sourceJson.data);

    logUtils.log(`${chunks.length} chunks`);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        writeFileSync(`sales_summary_${publisher}${chunkIndex}.json`, JSON.stringify(chunks[chunkIndex]));
    }
})();
