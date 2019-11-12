
// const scraper = require("./instagramScraper/scraper");
// scraper(5, "car", false, false);


// Example function that returns a Promise that will resolve after 2 seconds
var getGenres = () => {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(['comedy', 'drama', 'action']);
        }, 2000);
    });
}

(async () => {
    console.log(await getGenres());
})();