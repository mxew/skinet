/*
skinet for jqbx.fm
INDIE WHILE YOU MURDER
*/

require('dotenv').config({
  silent: process.env.NODE_ENV === 'production'
});

const fs = require('fs');
const path = require('path');

//load context
require(path.resolve(__dirname, 'context.js'))();

try {
  fs.readdirSync(path.resolve(__dirname, 'commands')).forEach(function(file) {
    var command = require(path.resolve(__dirname, 'commands/' + file));
    bot.commands.push({
      names: command.names,
      handler: command.handler
    });
  });
} catch (e) {
  console.error('Unable to load command: ', e);
}

bot.init = function() {
  jqbx.joinRoom(bot.roomid, bot.user);

  // init afk check
  bot.afkTimer = setInterval(function() {
    if (bot.afkLimit) afkCheck();
  }, 3 * 60000);

  // load bot's playlist
  spotify
    .request("https://api.spotify.com/v1/playlists/" + process.env.SPOTIFY_PLAYLIST)
    .then(function(list) {
      function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
      }
      if (list.tracks) {
        if (list.tracks.items) {
          if (list.tracks.items.length) {
            var tracks = [];
            for (let i = 0; i < list.tracks.items.length; i++) {
              tracks.push(list.tracks.items[i].track);
            }
            shuffleArray(tracks);
            bot.playlist = tracks;
          }
        }
      }
    })
    .catch(function(err) {
      console.log(err);
    });
};

imgur.setClientId(process.env.IMGUR_ID);
imgur.setAPIUrl('https://api.imgur.com/3/');
imgur.setMashapeKey('https://imgur-apiv3.p.mashape.com/');

// Matt's jqbx.fm leaderboard data htts://thompsn.com/jqbx/leaderboard
var configs = {
  apiKey: "AIzaSyDjEaajJFUXk1WL51YJJMDGypGweRieUNg",
  authDomain: "jqbxstats.firebaseapp.com",
  databaseURL: "https://jqbxstats.firebaseio.com"
};

firebase.initializeApp(configs);

// INIT BOT DB
var configs2 = {
  apiKey: process.env.FIREBASE_KEY,
  authDomain: process.env.FIREBASE_AUTH,
  databaseURL: process.env.FIREBASE_DATABASE
};

firebase.initializeApp(configs2, "bot");

firebase.app("bot").auth().signInWithEmailAndPassword(process.env.FB_DB_LOGIN, process.env.FB_DB_PASS).catch(function(error) {
  console.log(error);
});

firebase.app("bot").auth().onAuthStateChanged(function(user) {
  if (!bot.dbLoaded && user) {
    var triggersInit = firebase.app("bot").database().ref("triggersInit");
    triggersInit.once("value")
      .then(function(snap) {
        var data = snap.val();
        if (!data) {
          var now = Date.now();
          triggersInit.set(now);
          var triggers = firebase.app("bot").database().ref("triggers");
          for (var key in bot.phrases) {
            if (bot.phrases.hasOwnProperty(key)) {
              triggers.child(key).set(bot.phrases[key])
            }
          }
        }
      });
    bot.dbLoaded = Date.now();
  }
});

jqbx.events.on("newSong", function(message) {
  bot.song = message;
  bot.voted = false;

  console.log(moment(Date.now()).format("HH:mm") + " " + message.username + " is playing " + message.artists[0].name + " - " + message.name);
  // VERY IMPORTANT HORN INTRO TRACKING:
  if (message.artists[0].name == "Modest Mouse" && message.name == "Horn Intro") {
    bot.hornchain++;
    var hornstring = "";
    for (var i = 0; i < bot.hornchain; i++) {
      hornstring += ":trumpet:";
    }
    jqbx.sendChat(hornstring);
  } else {
    if (bot.hornchain > 0) {
      jqbx.sendChat(":x: hey great work " + message.username + ". Chain was " + bot.hornchain);
      jqbx.downvote();
    }
    bot.hornchain = 0;
  }
});

jqbx.events.on("songUpdated", function(song) {
  bot.song = song;
});

jqbx.events.on("usersChanged", function(users) {
  var ppl = [];
  for (var i = 0; i < users.length; i++) {
    ppl.push(users[i]._id);
    if (!bot.lastActive[users[i].uri]) bot.lastActive[users[i].uri] = Date.now();
    if (bot.users) {
      if (!bot.users.includes(users[i]._id) && users[i].device !== "bot") {
        // this person must be new
        if (!users[i].username) users[i].username = users[i].id;
        console.log("new person joined: " + users[i].username);
        jqbx.sendMessage(users[i].username + " has joined thanks.");
      }
    }
  }
  // rewrite bot.users with new list
  bot.users = ppl;
});

jqbx.events.on("newVote", function(data) {
  if (bot.song.userUri !== data.user.uri) bot.lastActive[data.user.uri] = Date.now();
  var skipCheck = jqbx.voteRatio(true);
  if ((skipCheck <= -0.25 && !bot.voted) && (bot.users.length >= 5)) {
    jqbx.sendChat("https://media.giphy.com/media/3ohze1LSWrEGCML02Y/giphy.gif");
    jqbx.upvote();
    bot.voted = true;
  }
});

jqbx.events.on("djsChanged", function(data) {
  bot.djs = data;
});

jqbx.events.on("newDJ", function(data) {
  bot.lastActive[data.uri] = Date.now();
});

jqbx.events.on("trackRequested", function() {
  // FEED JQBX A TRACK
  var track = bot.playlist.shift();
  var now = Date.now();
  var reducedTrack = {
    id: track.id,
    album: {
      images: track.album.images,
      name: track.album.name,
      uri: track.album.uri
    },
    artists: track.artists,
    duration_ms: track.duration_ms,
    href: track.href,
    name: track.name,
    popularity: track.popularity,
    uri: track.uri
  };
  console.log(reducedTrack)
  jqbx.supplyTrack(reducedTrack);
  bot.playlist.push(track);
});

jqbx.events.on("newChat", function(message) {
  var id = message._id;
  var uri = message.user.uri;
  var userid = message.user.id;
  var name = message.user.username;
  var txt = message.message;
  var commandData = {
    id: id,
    uri: uri,
    userid: userid,
    name: name,
    txt: txt
  };
  bot.lastActive[uri] = Date.now();
  console.log(moment(Date.now()).format("HH:mm") + " " + name + ": " + txt);

  var matches = txt.match(/^(?:[/])(\w+)\s*(.*)/i);
  if (matches) {
    var command = matches[1].toLowerCase();
    var args = matches[2];

    var thecommand = bot.commands.filter(function(cmd) {
      var found = false;
      for (i = 0; i < cmd.names.length; i++) {
        if (!found) {
          found = (cmd.names[i] == command.toLowerCase());
        }
      }
      return found;
    })[0];

    if (thecommand) {
      // run command
      thecommand.handler(commandData, args);
    } else if (uri !== bot.user.uri){
      // check db for single string triggers
      var trigger = firebase.app("bot").database().ref("triggers/" + command);
      trigger.once("value")
        .then(function(snap) {
          var data = snap.val();
          if (data) {
            jqbx.sendChat(data);
          }
        });
    }

  }
});

function afkCheck() {
  for (let i = 0; i < bot.djs.length; i++) {
    if (bot.djs[i].uri !== bot.user.uri) {
      if (bot.lastActive[bot.djs[i].uri]) {
        var timeSince = Math.floor((Date.now() - bot.lastActive[bot.djs[i].uri]) / 1000 / 60);
        console.log("AFK CHECK: " + bot.djs[i].uri + ": " + timeSince);
        if (timeSince >= bot.afkLimit) {
          if (bot.warned[bot.djs[i].uri]) {
            if (bot.song.userUri == bot.djs[i].uri){
              // this person is current dj ... wait for now
            } else {
              jqbx.removeDJ(bot.djs[i].uri);
              bot.warned[bot.djs[i].uri] = false;
            }
          } else {
            // warn DJ
            var nameToUse = bot.djs[i].id;
            if (bot.djs[i].username) nameToUse = bot.djs[i].username;
            jqbx.sendChat("@" + nameToUse + " you have been afk for " + timeSince + " minutes. Engage now or prepare to be destroyed.");
            bot.warned[bot.djs[i].uri] = true;
          }
        }
      } else {
        console.log("AFK CHECK: new DJ detected: " + bot.djs[i].uri)
        bot.lastActive[bot.djs[i].uri] = Date.now();
      }
    }
  }
};

bot.init();
