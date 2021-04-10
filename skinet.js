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

jqbx.events.on("newSong", function(message) {
  bot.song = message;
  console.log(moment(Date.now()).format("HH:mm") + " " + message.username + " is playing " + message.artists[0].name + " - " + message.name);
  if (message.artists[0].name == "Modest Mouse" && message.name == "Horn Intro") {
    bot.hornchain++;
    var hornstring = "";
    for (var i = 0; i < bot.hornchain; i++) {
      hornstring += ":trumpet:";
    }
    sendChat(hornstring);
  } else {
    if (bot.hornchain > 0) {
      sendChat(":x: hey great work " + message.username + ". Chain was " + bot.hornchain);
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
  console.log(moment(Date.now()).format("HH:mm") + " " + name + ": " + txt);

  var matches = txt.match(/^(?:[/])(\w+)\s*(.*)/i);
  if (matches) {
    var command = matches[1].toLowerCase();
    var args = matches[2];

    if (bot.phrases[command]) {
      jqbx.sendChat(bot.phrases[command]);
    } else {
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
        //run command
        thecommand.handler(commandData, args);
      }
    }

  }
});

bot.init();
