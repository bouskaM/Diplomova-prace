const functions = require('../instagramScraper/functions');
const shortid = require('shortid');
const low = require('lowdb');

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

downloadCorrections = async (data) => {
    asyncForEach(data, async (element) => {
        const FileSync = require('lowdb/adapters/FileSync');
        const adapter = new FileSync('../db.json');
        const db = low(adapter);
        let uniqueId = shortid.generate();
        let result = await functions.download(element[0], `../scraped/` + element[1] + `/${uniqueId}.png`);
        if (result === true) {
            await db.get('posts')
                .push({ id: uniqueId, tag: element[1], url: element[0], pwd: `./scraped/` + element[1] + `/${uniqueId}.png`, webUrl: `/${element[1]}/${uniqueId}.png` })
                .write()
            result = "";
            console.log("saved");
        } else {
            console.log('Error:', element[1], 'was not downloaded.');
            console.error(result);
        }


    });
}
module.exports = { downloadCorrections }