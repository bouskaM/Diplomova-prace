
const handleScrape = () => {
    const url = "/download-photos";
    const tag = document.getElementsByName("hashtag")[0].value;
    const numOfPhotos = document.getElementsByName("numOfPhotos")[0].value;
    const data = { "tag": tag, "numOfPhotos": numOfPhotos };
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
$(document).ready(() => {
    $("#photoDownloadForm").submit(function (e) {
        e.preventDefault();
    });
});