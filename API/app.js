const express = require('express')
const app = express()
const path = require('path');

app.use(express.json())

app.use(express.static('public'));
app.use(express.static('images'));

const port = 3000


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/web/index.html'));
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// add a document to the DB collection recording the click event
app.post('/download-photos', (req, res) => {
    res.status(200).send({ success: true })
    console.log(req.body);
    let tag = req.body.tag;
    let photoNum = req.body.numOfPhotos;
    const { exec } = require('child_process');
    exec('cd .. && node index.js -t ' + tag + ' -n ' + photoNum + ' -h', (err, stdout, stderr) => {
        if (err) {
            // node couldn't execute the command
            return;
        }
        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });

});

app.get('/show-photos', (req, res) => {
    console.log(req.body);
})
