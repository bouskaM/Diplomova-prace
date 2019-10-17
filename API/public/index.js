let idsToDelete = [];


const handleScrape = () => {
    const url = "/download-photos";
    const tag = document.getElementsByName("hashtag")[0].value;
    const numOfPhotos = document.getElementsByName("numOfPhotos")[0].value;
    const isHeadless = document.getElementsByName("isHeadless")[0].checked;
    const data = { "tag": tag, "numOfPhotos": numOfPhotos, "isHeadless": isHeadless };
    $.ajax({
        url: '/download-photos',
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

const postDeleteIds = async () => {
    await socket.emit("delIds", idsToDelete);
    window.location.reload();
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

const createPhotoTable = (data) => {
    checkForDifferences(data);
    if (($(".delButton").length == 0)) {
        let delButton = document.createElement("button");
        delButton.setAttribute("class", "delButton btn btn-danger");
        delButton.setAttribute("disabled", '');
        delButton.innerHTML = "Delte Selected";
        $("#photoTable").append(delButton);
        $(delButton).on("click", () => {
            postDeleteIds();
        })
    }
    let tags = getHashtags(data);

    tags.forEach(tag => {
        if ($("." + tag).length == 0) {
            let div = document.createElement("div")
            div.innerHTML = '<h1>#' + tag + '</h1>'
            div.setAttribute("class", tag + " tagDiv");
            $("#photoTable").append(div);
        }


        data.posts.forEach(post => {
            if (post.tag == tag) {
                if ($("#" + post.id).length == 0) {
                    let img = document.createElement("img");
                    img.setAttribute("src", post.webUrl);
                    img.setAttribute("id", post.id);
                    $("." + tag).append(img);

                    $(".tagDiv").find("#" + post.id).on("click", (event) => {
                        toggleDelete(event.target.id);
                        console.log(idsToDelete);
                    })
                }
            }
        })


    });

}
const toggleDelete = (id) => {
    if (idsToDelete.indexOf(id) == -1) {
        $("#" + id).addClass("toDelete");
        idsToDelete.push(id);
    } else {
        $("#" + id).removeClass("toDelete");
        idsToDelete.splice(idsToDelete.indexOf(id), 1);
    }
    toggleDelButton();
}

const toggleDelButton = () => {
    if (idsToDelete.length > 0) {
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

