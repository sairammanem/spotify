//client id =498eda237ede41448107c4ada8232fa5
//client secret = 709932c73b184ac1b4f1453225cd940e



var client_id = '';
var client_secret = '';
var redirect_uri = 'http://127.0.0.1:5500/spotify/index.html';

var AUTHORIZE = 'https://accounts.spotify.com/authorize';
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const followplaylists = 'https://api.spotify.com/v1/playlists/{playlist_id}/followers';
const unfollowplaylists = 'https://api.spotify.com/v1/playlists/{playlist_id}/followers';

function onPageLoad() {
    client_id = localStorage.getItem("client_id");
    client_secret = localStorage.getItem("client_secret");
    if (window.location.search.length > 0) {
        handleRedirect();
    }
}

function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode() {
    let code = null;
    const queryString = window.location.search;
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization() {
    client_id = document.getElementById("clientId").value;
    client_secret = document.getElementById("clientSecret").value;
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret); // In a real app you should not expose your client_secret to the user

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private playlist-modify-public playlist-modify-private";
    window.location.href = url; // Show Spotify's authorization screen
}

function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken() {
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if (data.access_token != undefined) {
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if (data.refresh_token != undefined) {
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function refreshDevices() {
    callApi("GET", DEVICES, null, handleDevicesResponse);
}

function handleDevicesResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems("devices");
        data.devices.forEach(item => addDevice(item));
    } else if (this.status == 401) {
        refreshAccessToken()
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addDevice(item) {
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById("devices").appendChild(node);
}

function callApi(method, url, body, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function refreshPlaylists() {
    callApi("GET", PLAYLISTS, null, handlePlaylistsResponse);
}

function handlePlaylistsResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems("playlists");
        data.items.forEach(item => addPlaylist(item));
        document.getElementById('playlists').value = currentPlaylist;
    } else if (this.status == 401) {
        refreshAccessToken()
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addPlaylist(item) {
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name + " (" + item.tracks.total + ")";
    document.getElementById("playlists").appendChild(node);
}

function removeAllItems(elementId) {
    let node = document.getElementById(elementId);
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function replaceplaylist(newitem) {
    let node = document.createElement('option');
    node.value = item.id;
    item.id = newitem.id;
    newitem = item.id;
    return newitem;
}

function reorderplaylist() {
    callApi("PUT", SHUFFLE + "?state=true&device_id=" + deviceId(), null, handleApiResponse);
    play();
}

function handleApiResponse() {
    if (this.status == 200) {
        console.log(this.responseText);
        setTimeout(currentlyPlaying, 2000);
    } else if (this.status == 204) {
        setTimeout(currentlyPlaying, 2000);
    } else if (this.status == 401) {
        refreshAccessToken()
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function deviceId() {
    return document.getElementById("devices").value;
}

function play() {
    let playlist_id = document.getElementById("playlists").value;
    let trackindex = document.getElementById("tracks").value;
    let album = document.getElementById("album").value;
    let body = {};
    if (album.length > 0) {
        body.context_uri = album;
    } else {
        body.context_uri = "spotify:playlist:" + playlist_id;
    }
    body.offset = {};
    body.offset.position = trackindex.length > 0 ? Number(trackindex) : 0;
    body.offset.position_ms = 0;
    callApi("PUT", PLAY + "?device_id=" + deviceId(), JSON.stringify(body), handleApiResponse);
}

function followplaylist(body) {
    let playlist_id = document.getElementById("playlists").value;
    fetch("https://api.spotify.com/v1/playlists/{playlist_id}/followers", {
            'method': 'put',
            'body': JSON.stringify({ playlist_id }),
            'Authorization': 'user-follow-modify',
            header: {
                'content-type': 'application/json'
            }
        })
        .then(x => {
            console.log(body.context_uri = "spotify:playlist:" + playlist_id)
        }, handleApiResponse);
}

function unfollowPlaylist() {
    let playlist_id = document.getElementById("playlists").value;
    fetch("https://api.spotify.com/v1/playlists/{playlist_id}/followers", {
            ' method': 'delete',
            ' body': JSON.stringify({ playlist_id }),
            'Authorization': 'playlist-follow-public, playlist-follow-private',
            header: {
                'content-type': 'application/json'
            }
        })
        .then(x => {
            console.log(body.context_uri = "spotify:playlist:" + playlist_id)
        }, handleApiResponse);
}