const https = require('https');
const fs = require("fs");
const puppeteer = require('puppeteer');
const shortid = require('shortid');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

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
        let counter = 0;
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
const asyncdownloadIstaThumbs = async (page, selector, reqPostCount, TAG) => {
    let posts = await page.evaluate(async ({ selector, reqPostCount }) => {
        let links = [];
        let counter = 0;
        return new Promise((resolve, reject) => {
            var i = setInterval(() => {
                let selElement = document.querySelector(selector);
                selElement.scrollIntoView();
                links.push(selElement.src);
                selElement.remove();
                counter++;
                if (counter >= reqPostCount) {
                    clearInterval(i);
                    resolve(links);
                }
            }, 200);
        }).then((data) => {
            return data;
        });

    }, { selector, reqPostCount });
    return posts;
}


const downloadIstaThumbs = async (browser, page, selector, reqPostCount, TAG) => {
    let photosDownloaded = 0;
    let maxcounter = 0;
    let interval = setInterval(async () => {
        maxcounter++;
        if (photosDownloaded >= reqPostCount) {
            clearInterval(interval);
            browser.close();
        }
        let post = await page.evaluate(async ({ selector, reqPostCount }) => {
            return new Promise((resolve, reject) => {
                let selElement = document.querySelector(selector);
                selElement.scrollIntoView();
                let link = selElement.src;
                selElement.remove();
                resolve(link);
            }).then((data) => {
                return data;
            });
        }, { selector, reqPostCount });
        if (post && maxcounter <= reqPostCount) {
            if (!fs.existsSync('./scraped/' + TAG)) {
                fs.mkdirSync('./scraped/' + TAG);
            }
            let uniqueId = shortid.generate();
            result = await download(post, `./scraped/${TAG}/${uniqueId}.png`);
            if (result === true) {
                photosDownloaded++;
                db.get('posts')
                    .push({ id: uniqueId, tag: TAG, url: post, pwd: `./scraped/${TAG}/${uniqueId}.png`, webUrl: `/${TAG}/${uniqueId}.png` })
                    .write()
                result = "";
            } else {
                console.log('Error:', post, 'was not downloaded.');
                console.error(result);
            }
        }
    }, 150);
}

const getIstaThumbs = async (browser, page, selector, reqPostCount, TAG) => {
    let counter = 0;
    let result = [];
    return new Promise(async function (resolve) {
        let interval = setInterval(async () => {
            if (counter >= reqPostCount) {
                browser.close();
                clearInterval(interval);
                resolve(result);
            }
            try {
                let post = await page.evaluate(async ({ selector, reqPostCount }) => {
                    return new Promise((resolve, reject) => {
                        let selElement = document.querySelector(selector);
                        selElement.scrollIntoView();
                        let link = selElement.src;
                        selElement.remove();
                        resolve(link);
                    });
                }, { selector, reqPostCount });
                if (post) {
                    counter++;
                    result.push(post);
                }
            } catch (error) {
            }

        }, 150);
    })
}

const newTab = async (browser, url) => {
    let tab = await browser.newPage();
    await tab.goto(url, { waitUntil: 'networkidle0' });
    return tab;
}
const downloadPosts = async (browser, posts, count, TAG) => {
    let i = 0;
    let counter = 0;
    while (counter < count) {
        i++;
        const photoTab = await newTab(browser, posts[i]);
        const src = await getInstaPostSrc(photoTab);
        const postTags = await getInstaPostTags(photoTab);
        photoTab.close();

        if (src) {
            counter++;
            if (!fs.existsSync('./scraped/' + TAG)) {
                fs.mkdirSync('./scraped/' + TAG);
            }

            let uniqueId = shortid.generate();


            result = await download(src, `./scraped/${TAG}/${uniqueId}.png`);
            if (result === true) {
                console.log('Success:', posts[i], 'has been downloaded successfully.');
                i++;
                db.get('posts')
                    .push({ id: uniqueId, tag: TAG, url: src, pwd: `./scraped/${TAG}/${uniqueId}.png`, webUrl: `/${TAG}/${uniqueId}.png`, allTags: postTags })
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
const downloadAll = (arrOfLinks, TAG) => new Promise((resolve, reject) => {
    arrOfLinks.forEach(async (element) => {
        if (!fs.existsSync('./scraped/' + TAG)) {
            fs.mkdirSync('./scraped/' + TAG);
        }

        let uniqueId = shortid.generate();

        result = await download(element, `./scraped/${TAG}/${uniqueId}.png`);

        if (result === true) {
            // Add a post
            await db.get('posts')
                .push({ id: uniqueId, tag: TAG, url: element, pwd: `./scraped/${TAG}/${uniqueId}.png`, webUrl: `/${TAG}/${uniqueId}.png` })
                .write()
        } else {
            console.error(result);
        }
    });
});

const getInstaPostSrc = async (page) => {
    let imageUrl = await page.evaluate(() => {
        let img = document.querySelector("img[srcset]");
        if (img != undefined && img.alt != "Instagram") {
            return img.src
        } else {
            return undefined;
        }
    });
    return imageUrl;
}

const getInstaPostTags = async (page) => {
    let tags = await page.evaluate(() => {
        let tags = [].slice.call(document.querySelectorAll(`[href*="/explore/tags/"`));
        tags = tags.map((tag) => {
            return tag.innerText;
        });
        if (tags != undefined) {
            return tags
        } else {
            return undefined;
        }
    });
    return tags;
}

module.exports = {
    asyncBrowser, asyncgetIstaPosts, newTab, getInstaPostSrc, downloadPosts, download, asyncdownloadIstaThumbs, downloadAll, downloadIstaThumbs, getIstaThumbs
}