var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const express = require('express');
const fs = require("fs");
var path = require("path");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const shortid = require('shortid');
const getSrcs = require('./getSrcs');
var multer = require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //req.body.tag
        if (!fs.existsSync('../scraped/' + req.body.tag)) {
            fs.mkdirSync('../scraped/' + req.body.tag);
        }
        cb(null, __dirname + '/../scraped/' + req.body.tag)
    },
    filename: function async(req, file, cb) {
        const uniqueUploadId = shortid.generate();
        const adapter = new FileSync('../db.json');
        const db = low(adapter);
        db.get('posts')
            .push({ id: uniqueUploadId, tag: req.body.tag, url: "uploaded_by_user", pwd: `./scraped/${req.body.tag}/${uniqueUploadId}.png`, webUrl: `/${req.body.tag}/${uniqueUploadId}.png` })
            .write()
        cb(null, uniqueUploadId + '.png')
    }
})

var upload = multer({ storage: storage })

server.listen(80);
// WARNING: app.listen(80) will NOT work here!

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/web/index.html');
});

app.post('/photos/upload', upload.array('ownPhotos', 500), function (req, res, next) {
    res.redirect('/');
});



io.on('connection', function (socket) {
    socket.emit('initLoadPhotos', getDb());
    socket.on('delIds', function (idArray) {
        deleteByIds(idArray);
    });
    socket.on('moveIds', function (data) {
        if (data.selectedIDs && data.destination) {
            moveIds(data.selectedIDs, data.destination);
        }
    });
    socket.on('saveClassifier', function (data) {
        const adapter = new FileSync('../classifiers.json');
        const classifierDB = low(adapter);
        let uniqueId = shortid.generate();
        classifierDB.defaults({ classifiers: [] })
            .write();

        classifierDB.get('classifiers')
            .push(data)
            .write()
    });
    socket.on('testPhotos', async (data) => {
        let photoCount = data.testPhotoCount;
        let tag = data.testTag;
        if (data.testTag) {
            let tag = data.testTag;
        }
        let isHeadless = data.isHeadless;
        let photoSrcs = await getSrcs.getSrcs(photoCount, tag, isHeadless);
        socket.emit('testPhotos', { photoSrcs });
    });
});



app.get('/ts', function (req, res) {
    res.sendFile(__dirname + '/web/TS.html');
});

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../scraped/')));
app.use(express.json());


app.post('/download-photos', (req, res) => {
    res.status(200).send({ success: true })
    console.log(req.body);
    let tag = req.body.tag;
    let photoNum = req.body.numOfPhotos;
    let isHeadless = req.body.isHeadless;
    let isFast = req.body.isFast;
    let headLessMode;
    let fastMode;
    (!isHeadless) ? headLessMode = "-h" : headLessMode = "";
    (!isFast) ? fastMode = "-f" : fastMode = "";

    var child = require('child_process');
    child.exec('cd .. && node index.js -t ' + tag + ' -n ' + photoNum + ' ' + headLessMode + ' ' + fastMode, [
        'arg1', 'arg2', 'arg3',
    ], function (err, stdout, stderr) {
        io.sockets.emit('downloadingDone');
        console.log(stdout);
    });
});

fs.watchFile('../db.json', function (event, filename) {
    io.sockets.emit('dbChange', getDb());

});

const getDb = () => {
    try {
        let dbFile = fs.readFileSync("../db.json");
        let dbFileJson = JSON.parse(dbFile);
        return dbFileJson;
    } catch (error) {

    }

}

const deleteByIds = (ids) => {
    const adapter = new FileSync('../db.json');
    const db = low(adapter);
    ids.forEach(ID => {
        const post = db.get('posts').find({ id: ID }).value()
        db.get('posts').remove({ id: ID }).write();
        fs.unlink('../scraped/' + post.tag + '/' + ID + ".png", () => { console.log("Image " + ID + " was deleted") });
    });
}

const moveIds = (ids, dest) => {
    const adapter = new FileSync('../db.json');
    const db = low(adapter);
    ids.forEach(ID => {
        let post = db.get('posts').find({ id: ID }).value();
        if (!fs.existsSync('../scraped/' + dest)) {
            fs.mkdirSync('../scraped/' + dest);
        }
        fs.rename('../scraped/' + post.tag + '/' + ID + ".png", '../scraped/' + dest + '/' + ID + ".png", (err) => {
            if (err) throw err;
            console.log('Rename complete!');
        });
        db.get('posts').find({ id: ID })
            .assign({ tag: dest, pwd: "/scraped/" + dest + "/" + ID + ".png", webUrl: dest + "/" + ID + ".png" }).write();
    })
}

const getClassifiers = () => {
    let dbFile = fs.readFileSync("../classifiers.json");
    let dbFileJson = JSON.parse(dbFile);
    return dbFileJson;
}