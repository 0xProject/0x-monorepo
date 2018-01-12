import { cli } from './command-line';
import { createTableScripts } from './scripts/create-tables';
import { scrapeDataScripts } from './scripts/scrape-data';

if (cli.script) {
    if (cli.script === 'createAllTables') {
        createTableScripts.createEventsTable();
    } else if(cli.script === 'scrapeData') {
        //scrapeDataScripts.getAllEventsAfterBlock(1);
    }
}
