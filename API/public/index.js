let selectedIDs = [];
const handleScrape = () => {
    const url = "/download-photos";
    const tag = document.getElementsByName("hashtag")[0].value;
    const numOfPhotos = document.getElementsByName("numOfPhotos")[0].value;
    const isHeadless = document.getElementsByName("isHeadless")[0].checked;
    const isFast = document.getElementsByName("isFast")[0].checked;
    const data = { "tag": tag, "numOfPhotos": numOfPhotos, "isHeadless": isHeadless, "isFast": isFast };
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (data) {
            $(".loader").show();
        },
    });
}
var socket = io.connect('http://localhost');
socket.on('dbChange', function (data) {
    createPhotoTable(data);
});
socket.on('initLoadPhotos', function (data) {
    createPhotoTable(data);
});
socket.on('downloadingDone', function () {
    $(".loader").hide();
});
socket.on('savedClassifiers', function (data) {
    console.log(data);
    savedClassifiersData = data;
});
socket.on('testClassifier', function (cls) {
    console.log(cls);
});

const postDeleteIds = async () => {
    await socket.emit("delIds", selectedIDs);
    window.location.reload();
}

const moveSelected = async (destination) => {
    await socket.emit("moveIds", { selectedIDs, destination });
    window.location.reload();
}
const createNewFolder = async (name) => {
    if (name != "") {
        newFolder(name);
    }
}

const getHashtags = (data) => {
    let tags = [];
    data.posts.forEach(element => {
        tags.push(element.tag);
    });
    tags = [...new Set(tags)];
    return tags;
}
const getIds = (data) => {
    let ids = [];
    data.posts.forEach(element => {
        ids.push(element.id);
    });
    ids = [...new Set(ids)];
    return ids;
}
const getCurrentIds = () => {
    let ids = [];
    $(".tagDiv").find("img").each((i, el) => { ids.push(el.id) })
    ids = [...new Set(ids)];
    return ids;
}
const newFolder = (tag) => {
    if ($("." + tag).length == 0) {
        let div = document.createElement("div")
        div.innerHTML = `<div id="tagRepresent` + tag + `"><h1>#` + tag + `</h1></div> <h3 class="postCount"></h3> <form action="/photos/upload" enctype="multipart/form-data" method="post"><label>Upload own photos: </label><input name="tag" type="hidden" value="` + tag + `"> <input name="ownPhotos" class="multipleFiles filesFor` + tag + `" type="file" multiple /> <input type="submit" class="btn btn-info" value="Upload"></form>`
        div.setAttribute("class", tag + " tagDiv");
        $("#photoTable").append(div);
        $("#tagRepresent" + tag).on("click", () => {
            $("." + tag).find("img").each((i, el) => {
                toggleDelete(el.id);
            })
        })
    }
}
const toggleWebcam = async () => {
    $(".webcamDiv").toggle();
    if ($("#webcam").length == 0) {
        $(".webcamDiv").append(`<video autoplay playsinline muted id="webcam" width="224" height="224"></video>`);
        let webcamElement = document.getElementById("webcam");
        await setupWebcam(webcamElement);
        webcamPredict()
    } else {
        vidStop();
        $("#webcam").remove();
    }
}

async function setupWebcam(webcamElement) {
    return new Promise((resolve, reject) => {
        const navigatorAny = navigator;
        navigator.getUserMedia = navigator.getUserMedia ||
            navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
            navigatorAny.msGetUserMedia;
        if (navigator.getUserMedia) {
            navigator.getUserMedia({ video: true },
                stream => {
                    webcamElement.srcObject = stream;
                    webcamElement.addEventListener('loadeddata', () => resolve(), false);
                },
                error => reject());
        } else {
            reject();
        }
    });
}
const vidStop = () => {
    var video = document.getElementById('webcam');
    video.pause();
    video.srcObject = null;
}

const createPhotoTable = (data) => {
    checkForDifferences(data);
    if (($(".delButton").length == 0)) {
        let delButton = document.createElement("button");
        delButton.setAttribute("class", "delButton btn btn-danger");
        delButton.setAttribute("disabled", '');
        delButton.innerHTML = "Delete Selected";
        $("#controlButtons").append(delButton);
        $(delButton).on("click", () => {
            postDeleteIds();
        })
    }
    if (($(".teachAllButton").length == 0)) {
        let teachAllButton = document.createElement("button");
        teachAllButton.setAttribute("class", "teachAllButton btn btn-success");
        teachAllButton.innerHTML = "Teach All Hashtags!";
        $("#teachButtons").append(teachAllButton);
        $(teachAllButton).on("click", () => {
            teachAll(getHashtags(data));
        })
    }

    if (($(".moveSelectedBtn").length == 0)) {
        let moveSelectedBtn = document.createElement("button");
        moveSelectedBtn.setAttribute("class", "moveSelectedBtn btn btn-info");
        moveSelectedBtn.innerHTML = "Move selected to: ";
        $("#controlButtons").append(moveSelectedBtn);
        $(moveSelectedBtn).on("click", () => {
            moveSelected($(".moveTo").val());
        })
    }
    if (($(".moveTo").length == 0)) {
        let moveTo = document.createElement("input");
        moveTo.setAttribute("class", "moveTo smallInput");
        $("#controlButtons").append(moveTo);
    }

    if (($(".createNewFolderBtn").length == 0)) {
        let createNewFolderBtn = document.createElement("button");
        createNewFolderBtn.setAttribute("class", "createNewFolderBtn btn btn-info m-2");
        createNewFolderBtn.innerHTML = "Create new folder: ";
        $("#controlButtons").append(createNewFolderBtn);
        $(createNewFolderBtn).on("click", () => {
            createNewFolder($(".newFolder").val());
        })
    }

    if (($(".newFolder").length == 0)) {
        let newFolder = document.createElement("input");
        newFolder.setAttribute("class", "newFolder smallInput");
        $("#controlButtons").append(newFolder);
    }



    let tags = getHashtags(data);


    tags.forEach(tag => {
        newFolder(tag);
        data.posts.forEach(post => {
            if (post.tag == tag) {
                if ($("#" + post.id).length == 0) {
                    let img = document.createElement("img");
                    img.setAttribute("src", post.webUrl);
                    img.setAttribute("id", post.id);
                    $("." + tag).append(img);
                    $(".tagDiv").find("#" + post.id).on("click", (event) => {
                        toggleDelete(event.target.id);
                    })
                    $("#tagRepresent" + tag).siblings(".postCount").html($("." + tag + " img").length + " posts");

                }
            }

        })

        $(".teachButtonFor" + tag).remove();
        let teachButton = document.createElement("button");
        teachButton.setAttribute("class", "teachButtonFor" + tag + " btn btn-info");
        teachButton.innerHTML = "Teach hashtag " + tag;
        $("." + tag).append(teachButton);
        $("#teachButtons").append(teachButton);
        $(teachButton).on("click", () => {
            teach(tag);
        })

    });

}
const toggleDelete = (id) => {
    if (selectedIDs.indexOf(id) == -1) {
        $("#" + id).addClass("toDelete");
        selectedIDs.push(id);
    } else {
        $("#" + id).removeClass("toDelete");
        selectedIDs.splice(selectedIDs.indexOf(id), 1);
    }
    toggleDelButton();
}
const toggleDelButton = () => {
    if (selectedIDs.length > 0) {
        $(".delButton").removeAttr("disabled")
    } else {
        $(".delButton").attr("disabled", "")
    }
}
const checkForDifferences = (data) => {
    getCurrentIds().forEach((el) => {
        if (getIds(data).indexOf(el) == -1) {
            $("#" + el).remove();
        }
    })
}
$(document).ready(() => {
    $("#photoDownloadForm").submit(function (e) {
        e.preventDefault();
    });

});


