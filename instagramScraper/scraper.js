
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const functions = require('./functions')

module.exports = function (
    numOfPhotos, hashtag,
    isHeadless = false,
    fastDownload = true) {
    const INSTAGRAM_URL = (tag) => `https://www.instagram.com/explore/tags/${tag}/`;
    const TAG = hashtag;
    (async () => {
        db.defaults({ posts: [] })
            .write();
        const browser = await functions.asyncBrowser(INSTAGRAM_URL(TAG), isHeadless);
        if (fastDownload) {
            await functions.downloadIstaThumbs(
                browser.browser,
                browser.firstPage,
                'article > div:nth-child(3) img',
                numOfPhotos,
                hashtag);
            // let thumbSrcs = await functions.asyncdownloadIstaThumbs(browser.firstPage, 'article > div:nth-child(3) img', numOfPhotos, hashtag);
            // functions.downloadAll(thumbSrcs, hashtag);
        } else {
            const posts = await functions.asyncgetIstaPosts(browser.firstPage,
                'article > div:nth-child(3) a',
                150);
            await functions.downloadPosts(browser.browser, posts, numOfPhotos, TAG);
            await browser.browser.close();
        }
    })();
}