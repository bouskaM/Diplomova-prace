
const scraper = require("./instagramScraper/scraper");
//Download 4 images of
//car
//headless (false)
//fastMode (true)
scraper(4, "car", false, true);

//Files are in ./scraped/car folder
//Data is in db.json file
