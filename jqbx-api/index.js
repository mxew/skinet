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
    var message = "42[" + JSON.stringify(type) + "," + JSON.stringify(data) + "]";
    // console.log(message);
    ws.send(message);
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
          var currentUpvotes = votes.upvotes;
          votes.upvotes = message.currentTrack.thumbsUpUris;
          for (let i = 0; i < message.currentTrack.thumbsUpUris.length; i++) {
            if (!currentUpvotes.includes(message.currentTrack.thumbsUpUris[i])) {
              events.emit("newVote", {
                user: getUserObjFromUri(message.currentTrack.thumbsUpUris[i]),
                type: "upvote",
                track: message.currentTrack.id
              });
            }
          }
        }
        if (message.currentTrack.thumbsDownUris) {
          var currentDownvotes = votes.downvotes;
          votes.downvotes = message.currentTrack.thumbsDownUris;
          for (let i = 0; i < message.currentTrack.thumbsUpUris.length; i++) {
            if (!currentDownvotes.includes(message.currentTrack.thumbsUpUris[i])) {
              events.emit("newVote", {
                user: getUserObjFromUri(message.currentTrack.thumbsDownUris[i]),
                type: "downvote",
                track: message.currentTrack.id
              });
            }
          }
        }
        if (message.currentTrack.starUris) {
          var currentStars = votes.stars;
          votes.stars = message.currentTrack.starUris;
          for (let i = 0; i < message.currentTrack.starUris.length; i++) {
            if (!currentStars.includes(message.currentTrack.starUris[i])) {
              events.emit("newVote", {
                user: getUserObjFromUri(message.currentTrack.starUris[i]),
                type: "star",
                track: message.currentTrack.id
              });
            }
          }
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
    if (message.user) {
      events.emit("newChat", message);
    } else {
      events.emit("newMessage", message);
    }
  } else if (type == "request-next-track") {
    events.emit("trackRequested", true);
  }
};

function apiRequest(endpoint, callback) {
  request(apiUrl + endpoint, function cbfunc(error, response, body) {
    if (!error && response.statusCode == 200) {
      if (body) {
        try {
          var formatted = JSON.parse(body);
          if (formatted) {
            callback(formatted);
          } else {
            callback(false);
          }
        } catch (e) {
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
  // if (!user.socketId && sid) user.socketId = sid;

  roomid = theroomid;
  if (connected) {
    started = true;
    emitToSocket("join", joinBody);
    fetchRoom();
  }
};


function fetchRoom() {
  var body = {
    roomId: roomid
  };
  emitToSocket("fetchRoom", body);
};
/*
CHAT FUNCTIONS
*/

function sendChat(txt, expandable, interRoomData) {
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
  if (interRoomData) {
    chatBody.message.user.display_name = interRoomData.sendAsName;
    chatBody.message.user.username = interRoomData.sendAsName;
    chatBody.roomId = interRoomData.sendTo;
  }
  emitToSocket("chat", chatBody);
};

function sendMessage(txt, interRoomData) {
  var chatBody = {
    roomId: roomid,
    user: user,
    message: {
      message: txt,
      selectingEmoji: false
    }
  };
  if (interRoomData) chatBody.roomId = interRoomData.sendTo;
  emitToSocket("chat", chatBody);
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

function voteRatio(predict) {
  var up = votes.upvotes.length - 1;
  var down = votes.downvotes.length;
  var listeners = users.length;
  var ratio = (up - down) / listeners;
  if (predict) ratio = (up - (down + 1)) / listeners;
  return ratio;
};

function downStars() {
  var downstars = votes.downvotes.filter(element => votes.stars.includes(element));
  return downstars.length;
};

/*
DJ FUNCTIONS
*/

function stepUp() {
  var body = {
    roomId: roomid,
    user: user
  };
  emitToSocket("joinDjs", body);
};

function stepDown() {
  var body = {
    roomId: roomid,
    user: user
  };
  emitToSocket("leaveDjs", body);
};

function supplyTrack(trackObject) {
  var body = {
    roomId: roomid,
    user: user,
    track: trackObject
  };
  emitToSocket("getNextTrack", body);
};

/*
MOD FUNCTIONS
*/

function removeDJ(uri) {
  /*
  var kickBody = {
    roomId: roomid,
    user: user,
    dj: djObj
  };
  console.log(kickBody);
  emitToSocket("kick", kickBody);
  */
  var body = {
    roomId: roomid,
    user: getUserObjFromUri(uri)
  };
  emitToSocket("leaveDjs", body);
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

function getRoom(room, callback) {
  apiRequest("/room/" + room, function(data) {
    callback(data);
  });
};

function getActiveRooms(callback) {
  apiRequest("/active-rooms/0", function(data) {
    callback(data);
  });
};

function getAllRooms(callback) {
  //TODO: flip through pages until we get to rooms with less than 2 people in them
  apiRequest("/all-rooms/0", function(data) {
    callback(data);
  });
};

function getRole(uri) {
  var role = 0;
  if (mods.includes(uri)) role = 1;
  if (admins.includes(uri)) role = 2;
  return role;
};

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
    if (data0.data.charAt(0) == "0") {
      var startup = JSON.parse(data0.data.substring(1, data0.data.length));
      console.log("sid is set to " + startup.sid);
      joinRoom(roomid, user);
      // sid = startup.sid;
      // if (user) user.socketId = sid;
    }
    var data = data0.data;
    var code = data.substring(0, data.indexOf('['));
    if (code == "42") {
      var raw1 = data.substring(code.length + 1, data.length - 1);
      if (raw1.indexOf(',') >= 0) {
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
  supplyTrack,
  star,
  stepUp,
  stepDown,
  removeDJ,
  voteRatio,
  downStars,
  getFirst,
  getUser,
  getUserObjFromUri,
  getRoom,
  getActiveRooms,
  getAllRooms,
  getRole,
  events
};
