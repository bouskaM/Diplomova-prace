const puppeteer = require('puppeteer');
const https = require('https');
const fs = require("fs");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const shortid = require('shortid');


module.exports = function (numOfPhotos, hashtag, isHeadless = false) {
    const INSTAGRAM_URL = (tag) => `https://www.instagram.com/explore/tags/${tag}/`;
    const TAG = hashtag;

    const asyncBrowser = async (url, headless = false, viewPort = { width: 1366, height: 1440 }) => {
        /* Initiate the Puppeteer browser */
        const browser = await puppeteer.launch({
            headless: headless
        });
        const page = await browser.newPage();
        await page.setViewport(viewPort);
        await page.goto(url, { waitUntil: 'networkidle0' });
        return { "browser": browser, "firstPage": page };

    }
    const asyncgetIstaPosts = async (page, selector, reqPostCount) => {
        let posts = await page.evaluate(async ({ selector, reqPostCount }) => {
            let links = [];
            counter = 0;
            return new Promise((resolve, reject) => {
                var i = setInterval(() => {
                    let selElement = document.querySelector(selector);
                    selElement.scrollIntoView();
                    links.push(selElement.href);
                    selElement.remove();
                    counter++;
                    if (counter >= reqPostCount) {
                        clearInterval(i);
                        resolve(links);
                    }
                }, 50);
            }).then((data) => {
                return data;
            });

        }, { selector, reqPostCount });
        return posts;
    }


    const newTab = async (browser, url) => {
        let tab = await browser.newPage();
        await tab.goto(url, { waitUntil: 'networkidle0' });
        return tab;
    }

    const getInstaPostSrc = async (page) => {
        let imageUrl = await page.evaluate(() => {
            let img = document.querySelector("img[srcset]");
            if (img.alt != "Instagram" && img != undefined) {
                return img.src
            }
        });
        return imageUrl;
    }

    const downloadPosts = async (browser, posts, count) => {
        let i = 0;
        let counter = 0;
        while (counter < count) {
            i++;
            const photoTab = await newTab(browser, posts[i]);
            const src = await getInstaPostSrc(photoTab);
            photoTab.close();
            if (src) {
                counter++;
                if (!fs.existsSync(TAG)) {
                    fs.mkdirSync(TAG);
                }

                let uniqueId = shortid.generate();


                result = await download(src, `./${TAG}/image-${uniqueId}.png`);
                if (result === true) {
                    console.log('Success:', posts[i], 'has been downloaded successfully.');
                    i++;
                    // Add a post
                    db.get('posts')
                        .push({ id: uniqueId, tag: TAG, url: src, pwd: `./${TAG}/image-${uniqueId}.png` })
                        .write()
                } else {
                    console.log('Error:', posts[i], 'was not downloaded.');
                    console.error(result);
                }
            }
        }
    }

    const download = (url, destination) => new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve(true));
            });
        })
            .on('error', error => {
                fs.unlink(destination);
                reject(error.message);
            });
    });

    (async () => {
        db.defaults({ posts: [], user: {} })
            .write();
        const browser = await asyncBrowser(INSTAGRAM_URL(TAG), isHeadless);
        const posts = await asyncgetIstaPosts(browser.firstPage, 'article > div:nth-child(3) a', 150);
        downloadPosts(browser.browser, posts, numOfPhotos);
    })();
}