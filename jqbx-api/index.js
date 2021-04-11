/*
JQBX.fm api wrapper
*/

const socketAddress = "ws://jqbx.fm/socket.io/?EIO=3&transport=websocket";
const apiUrl = "https://jqbx.fm";

const WebSocket = require("ws");
const ReconnectingWebSocket = require("reconnecting-websocket");
const ws = new ReconnectingWebSocket(socketAddress, [], {
  WebSocket: WebSocket
});
const request = require("request");
const EventEmitter = require("events");
const events = new EventEmitter();

var user = null;
var roomid = null;
var connected = false;
var started = false;

var users = [];
var admins = [];
var mods = [];

function emitToSocket(type, data) {
  try {
    ws.send("42[\"" + type + "\"," + JSON.stringify(data) + "]");
  } catch (e) {
    console.log(e);
  }
};

function handleMessage(type, message) {
  if (type == "keepAwake") {
    var now = Date.now();
    emitToSocket("stayAwake", {
      date: now
    });
  } else if (type == "update-room") {
    try {
      if (message.currentTrack) {
        events.emit("songUpdated", message.currentTrack);
      }
      if (message.users) {
        users = message.users;
        events.emit("usersChanged", message.users);
      }
      if (message.mods) {
        mods = message.mods;
      }
      if (message.admin) {
        admins = message.admin;
      }
    } catch (e) {
      console.log(e);
    }
  } else if (type == "play-track") {
    try {
      events.emit("newSong", message);
    } catch (e) {
      console.log(e);
    }
  } else if (type == "push-message") {
    events.emit("newChat", message);
  }
};

function apiRequest(endpoint, callback){
  request(apiUrl + endpoint, function cbfunc(error, response, body) {
    if (!error && response.statusCode == 200) {
      if (body) {
        var formatted = JSON.parse(body);
        if (formatted) {
          callback(formatted);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

/*
JOIN FUNCTIONS
*/

function joinRoom(theroomid, theuser) {
  var joinBody = {
    roomId: theroomid,
    user: theuser
  };
  user = theuser;
  roomid = theroomid;
  if (connected) {
    started = true;
    emitToSocket("join", joinBody);
  }
};

/*
CHAT FUNCTIONS
*/

function sendChat(txt, expandable) {
  var chatBody = {
    roomId: roomid,
    user: user,
    message: {
      message: txt,
      user: {
        display_name: user.username,
        id: user.id,
        uri: user.uri,
        username: user.username,
        active: false
      },
      selectingEmoji: false
    }
  };
  if (expandable) {
    chatBody.message.type = "expandable";
    chatBody.message.html = txt;
    chatBody.message.text = txt;
  }
  emitToSocket("chat", chatBody);
};

function sendMessage(txt) {
  var chatBody = {
    roomId: roomid,
    user: user,
    message: {
      message: txt,
      selectingEmoji: false
    }
  };
  emitToSocket("chat", chatBody)
};

/*
VOTE FUNCTIONS
*/

function upvote() {
  var voteBody = {
    roomId: roomid,
    user: user
  };
  emitToSocket("thumbsUp", voteBody);
};

function downvote() {
  var voteBody = {
    roomId: roomid,
    user: user
  };
  emitToSocket("thumbsDown", votebody);
};

function star() {
  var voteBody = {
    roomId: roomid,
    user: user
  };
  emitToSocket("starTrack", voteBody);
};

/*
DATA LOOKUP FUNCTIONS
*/

function getFirst(trackid, callback) {
  apiRequest("/tracks/first/" + trackid, function(data){
    callback(data);
  });
};

function getUser(uri, callback) {
  apiRequest("/user/" + uri, function(data){
    callback(data);
  });
};

function getRole(uri) {
  var role = 0;
  if (mods.includes(uri)) role = 1;
  if (admins.includes(uri)) role = 2;
  return role;
};

/*
BIND TO WS EVENTS
*/

ws.addEventListener('open', () => {
  connected = true;
  if (user && !started) {
    jqbx.joinRoom(roomid, user);
  }
  setInterval(function() {
    ws.send('2');
  }, 12 * 1000);
});

ws.addEventListener('message', (data0) => {
  try {
    var data = data0.data;
    var code = data.substring(0, data.indexOf('['));
    if (code == "42") {
      var raw1 = data.substring(code.length + 1, data.length - 1);
      var type = JSON.parse(raw1.substring(0, raw1.indexOf(',')));
      var message = JSON.parse(raw1.substring(type.length + 3, raw1.length));
      handleMessage(type, message);
    }
  } catch (e) {
    // console.log(e);
  }
});

/*
EXPORTS
*/

module.exports = {
  joinRoom,
  sendMessage,
  sendChat,
  upvote,
  downvote,
  star,
  getFirst,
  getUser,
  getRole,
  events
};
