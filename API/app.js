const express = require('express')
const app = express()
const path = require('path');
const scraper = require("../instagramScraper/scraper");
const test = require("../test.js")


app.use(express.static('public'));
app.use(express.static('images'));

const port = 3000


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/web/index.html'));
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// add a document to the DB collection recording the click event
app.post('/clicked', (req, res) => {
    console.log("Clicked");
    test();
});
