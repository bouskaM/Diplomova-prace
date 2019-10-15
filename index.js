const scraper = require("./instagramScraper/scraper");

var argv = require('minimist')(process.argv.slice(2));
scraper(argv.n, argv.t, !argv.h);

