const functions = require('../instagramScraper/functions');

getSrcs = async (numOfPhotos, hashtag, isHeadless = false, isFast) => {
    const INSTAGRAM_URL = (tag) => `https://www.instagram.com/explore/tags/${tag}/`;
    const TAG = hashtag;
    let urls;
    const browser = await functions.asyncBrowser(INSTAGRAM_URL(TAG), isHeadless);
    if (isFast) {
        return new Promise(async function (resolve) {
            let test = await functions.getIstaThumbs(
                browser.browser,
                browser.firstPage,
                'article > div:nth-child(3) img',
                numOfPhotos,
                hashtag);
           // console.log(test);
            resolve(test);
        })
    } else {
        const posts = await functions.asyncgetIstaPosts(browser.firstPage, 'article > div:nth-child(3) a', 200);
        let i = 0;
        let counter = 0;
        urls = [];
        while (counter < numOfPhotos) {
            i++;
            const postTab = await functions.newTab(browser.browser, posts[i]);
            const src = await functions.getInstaPostSrc(postTab);
            await postTab.close();
            if (src) {
                counter++;
                urls.push(src);
            }
        };
        await browser.browser.close();
        return urls;
    }

}
module.exports = { getSrcs }