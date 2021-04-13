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
var sid = null;
var roomid = null;
var connected = false;
var started = false;

var users = [];
var admins = [];
var mods = [];
var djs = [];
var djUris = [];

var votes = {
  upvotes: [],
  downvotes: [],
  stars: []
};

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
        if (message.currentTrack.thumbsUpUris) {
          for (let i = 0; i < message.currentTrack.thumbsUpUris.length; i++) {
            if (!votes.upvotes.includes(message.currentTrack.thumbsUpUris[i])) {
              events.emit("newVote", {
                user: getUserObjFromUri(message.currentTrack.thumbsUpUris[i]),
                type: "upvote",
                track: message.currentTrack.id
              });
            }
          }
          votes.upvotes = message.currentTrack.thumbsUpUris;
        }
        if (message.currentTrack.thumbsDownUris) {
          for (let i = 0; i < message.currentTrack.thumbsUpUris.length; i++) {
            if (!votes.downvotes.includes(message.currentTrack.thumbsUpUris[i])) {
              events.emit("newVote", {
                user: getUserObjFromUri(message.currentTrack.thumbsDownUris[i]),
                type: "downvote",
                track: message.currentTrack.id
              });
            }
          }
          votes.downvotes = message.currentTrack.thumbsDownUris;
        }
        if (message.currentTrack.starUris) {
          for (let i = 0; i < message.currentTrack.starUris.length; i++) {
            if (!votes.stars.includes(message.currentTrack.starUris[i])) {
              events.emit("newVote", {
                user: getUserObjFromUri(message.currentTrack.starUris[i]),
                type: "star",
                track: message.currentTrack.id
              });
            }
          }
          votes.stars = message.currentTrack.starUris;
        }
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
      if (message.djs) {
        var newUrisList = [];
        for (let i = 0; i < message.djs.length; i++) {
          newUrisList.push(message.djs[i].uri);
          if (!djUris.includes(message.djs[i].uri)) {
            events.emit("newDJ", {
              user: message.djs[i]
            });
          }
        }
        djUris = newUrisList;
        djs = message.djs;
        events.emit("djsChanged", message.djs);
      }
    } catch (e) {
      console.log(e);
    }
  } else if (type == "play-track") {
    try {
      events.emit("newSong", message);
      votes.upvotes = [];
      votes.downvotes = [];
      votes.stars = [];
    } catch (e) {
      console.log(e);
    }
  } else if (type == "push-message") {
    events.emit("newChat", message);
  } else if (type == "request-next-track"){
    events.emit("trackRequested", true);
  }
};

function apiRequest(endpoint, callback) {
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
  if (!user.socketId && sid) user.socketId = sid;
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
  emitToSocket("thumbsDown", voteBody);
};

function star() {
  var voteBody = {
    roomId: roomid,
    user: user
  };
  emitToSocket("starTrack", voteBody);
};

function voteRatio(predict){
  var up = votes.upvotes.length;
  var down = votes.downvotes.length;
  var listeners = users.length;
  var ratio = (up - down) / listeners;
  if (predict) ratio = (up - (down + 1)) / listeners;
  return ratio;
};

/*
DJ FUNCTIONS
*/

function stepUp(){
  var body = {
    roomId: roomid,
    user: user
  };
  emitToSocket("joinDjs", body);
};

function stepDown(){
  var body = {
    roomId: roomid,
    user: user
  };
  emitToSocket("leaveDjs", body);
};

function supplyTrack(trackObject){
  var body = {
    roomId: roomid,
    track: trackObject,
    user: user
  };
  emitToSocket("getNextTrack", body);
};

/*
MOD FUNCTIONS
*/

function removeDJ(djObj) {
  var kickBody = {
    roomId: roomid,
    user: user,
    dj: djObj
  };
  console.log(kickBody);
  emitToSocket("kick", kickBody);
};

/*
DATA LOOKUP FUNCTIONS
*/

function getFirst(trackid, callback) {
  apiRequest("/tracks/first/" + trackid, function(data) {
    callback(data);
  });
};

function getUser(uri, callback) {
  apiRequest("/user/" + uri, function(data) {
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
INTERNAL HELPERS
*/

function getUserObjFromUri(uri) {
  var result = false;
  for (let i = 0; i < users.length; i++) {
    if (users[i].uri == uri) {
      result = users[i];
      break;
    }
  }
  return result;
}

/*
BIND TO WS EVENTS
*/

ws.addEventListener('open', () => {
  connected = true;
  if (user && !started) {
    joinRoom(roomid, user);
  }
  setInterval(function() {
    ws.send('2');
  }, 12 * 1000);
});

ws.addEventListener('message', (data0) => {
  try {
    // console.log(data0)
    if (data0.data.charAt(0) == "0"){
      var startup = JSON.parse(data0.data.substring(1,data0.data.length));
      console.log("sid is set to "+startup.sid);
      sid = startup.sid;
      if (user) user.socketId = sid;
    }
    var data = data0.data;
    var code = data.substring(0, data.indexOf('['));
    if (code == "42") {
      var raw1 = data.substring(code.length + 1, data.length - 1);
      if (raw1.indexOf(',') >= 0){
        var type = JSON.parse(raw1.substring(0, raw1.indexOf(',')));
        var message = JSON.parse(raw1.substring(type.length + 3, raw1.length));
        handleMessage(type, message);
      } else {
        var type = JSON.parse(raw1);
        handleMessage(type, null);
      }
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
  stepUp,
  stepDown,
  removeDJ,
  voteRatio,
  getFirst,
  getUser,
  getRole,
  events
};
