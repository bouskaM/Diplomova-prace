var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const express = require('express');
const fs = require("fs");
var path = require("path");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');


server.listen(80);
// WARNING: app.listen(80) will NOT work here!

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/web/index.html');
});

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../scraped/')));
app.use(express.json());

io.on('connection', function (socket) {
    socket.emit('initLoadPhotos', getDb());
    socket.on('delIds', function (idArray) {
        deleteByIds(idArray);
    });
});

app.post('/download-photos', (req, res) => {
    res.status(200).send({ success: true })
    console.log(req.body);
    let tag = req.body.tag;
    let photoNum = req.body.numOfPhotos;
    let isHeadless = req.body.isHeadless;
    let headLessMode;
    (!isHeadless) ? headLessMode = "-h" : headLessMode = ""

    var child = require('child_process');
    child.exec('cd .. && node index.js -t ' + tag + ' -n ' + photoNum + ' ' + headLessMode, [
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
    let dbFile = fs.readFileSync("../db.json");
    let dbFileJson = JSON.parse(dbFile);
    return dbFileJson;
}

const deleteByIds = (ids) => {
    const adapter = new FileSync('../db.json');
    const db = low(adapter);
    ids.forEach(ID => {
        const post = db
            .get('posts')
            .find({ id: ID })
            .value()

        db.get('posts')
            .remove({ id: ID })
            .write();
        fs.unlink('../scraped/' + post.tag + '/' + ID +".png", () => { console.log("Image " + ID + " was deleted") });
    });
}