const functions = require('../instagramScraper/functions');
const shortid = require('shortid');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('../db.json');
const db = low(adapter);

downloadCorrections = async (data) => {
    data.forEach(async (element, i) => {
        let uniqueId = shortid.generate();
        let result = await functions.download(element[0], `../scraped/` + element[1] + `/${uniqueId}.png`);
        if (result === true) {
            db.get('posts')
                .push({ id: uniqueId, tag: element[1], url: element[0], pwd: `./scraped/` + element[1] + `/${uniqueId}.png`, webUrl: `/${element[1]}/${uniqueId}.png` })
                .write()
            result = "";
        } else {
            console.log('Error:', element[1], 'was not downloaded.');
            console.error(result);
        }
    });

}

module.exports = { downloadCorrections }