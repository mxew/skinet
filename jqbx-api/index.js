const WebSocket = require('ws');
const ReconnectingWebSocket = require('reconnecting-websocket');
// const ws = new WebSocket('ws://jqbx.fm/socket.io/?EIO=3&transport=websocket');
const ws = new ReconnectingWebSocket('ws://jqbx.fm/socket.io/?EIO=3&transport=websocket', [], {
  WebSocket: WebSocket
});
const request = require('request');
const EventEmitter = require('events');
const events = new EventEmitter();

var user = null;
var roomid = null;

function joinRoom(theroomid, theuser) {
  var joinBody = {
    roomId: theroomid,
    user: theuser
  };
  user = theuser;
  roomid = theroomid;
  ws.send("42[\"join\"," + JSON.stringify(joinBody) + "]");
};

function sendChat(txt, expandable) {
  try {
    if (expandable) {
      var chatBody = {
        roomId: roomid,
        user: user,
        message: {
          type: "expandable",
          message: txt,
          html: txt,
          text: txt,
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
      ws.send("42[\"chat\"," + JSON.stringify(chatBody) + "]");
    } else {
      var chatBody = {
        roomId: "5909cdd47f0129009e1a4ad8",
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
      ws.send("42[\"chat\"," + JSON.stringify(chatBody) + "]");
    }
  } catch (e) {
    console.log(e);
  }
};

function sendMessage(txt) {
  try {
    var chatBody = {
      roomId: "5909cdd47f0129009e1a4ad8",
      user: user,
      message: {
        message: txt,
        selectingEmoji: false
      }
    };
    ws.send("42[\"chat\"," + JSON.stringify(chatBody) + "]");
  } catch (e) {
    console.log(e);
  }
};

function getFirst(trackid, callback){
  request('https://jqbx.fm/tracks/first/' + trackid, function cbfunc(error, response, body) {
    //If call returned correctly, continue
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
          console.log(e);
          callback(false);
        }
      }
    }
  });
};

function getUser(uri, callback){
  request('https://jqbx.fm/user/' + uri, function cbfunc(error, response, body) {
    //If call returned correctly, continue
    if (!error && response.statusCode == 200) {
      if (body) {
        var formatted = JSON.parse(body);
        if (formatted) {
          callback(formatted);
        } else {
          callback(false);
        }
      }
    }
  });
};

ws.addEventListener('open', () => {
  console.log("socket connection open");
  setInterval(function() {
    ws.send('2');
  }, 12 * 1000);
  events.emit("ready", true);
});

ws.addEventListener('message', (data0) => {

  try {
    var data = data0.data;
    var code = data.substring(0, data.indexOf('['));
    if (code == "42") {
      var raw1 = data.substring(code.length + 1, data.length - 1);
      var type = JSON.parse(raw1.substring(0, raw1.indexOf(',')));
      var message = JSON.parse(raw1.substring(type.length + 3, raw1.length));
      if (type == "keepAwake") {
        try {
          var now = Date.now();
          ws.send('42["stayAwake",{"date":"' + now + '"}]');
        } catch (e) {
          console.log(e);
        }
      } else if (type == "update-room") {
        try {
          if (message.currentTrack) {
            // console.log(message.currentTrack);
            events.emit("songUpdated", message.currentTrack);
          }
          if (message.users) {
            //console.log(message.users);
            events.emit("usersChanged", message.users);
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
    }

  } catch (e) {
    // console.log(e);
  }

});


module.exports = {
  joinRoom,
  sendMessage,
  sendChat,
  getFirst,
  getUser,
  events
};
