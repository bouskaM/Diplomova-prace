const puppeteer = require('puppeteer');

const INSTAGRAM_URL = (tag) => `https://www.instagram.com/explore/tags/${tag}/`;
const TAG = "bmw";

(async () => {
    /* Initiate the Puppeteer browser */
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 1440 });
    /* Go to the Instagram page and wait for it to load */
    await page.goto(INSTAGRAM_URL(TAG), { waitUntil: 'networkidle0' });
    await autoScroll(page);

    var a = await page.evaluate((sel) => {
        let elements = Array.from(document.querySelectorAll(sel));
        let links = elements.map(element => {
            return element.href
        })
        return links;
    }, 'article > div:nth-child(3) a');
    console.log(a);
})();

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}