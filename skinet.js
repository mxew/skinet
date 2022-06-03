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

  jqbx.getRoom(bot.roomid, function(formatted) {
    if (formatted) {
      bot.roomName = formatted.title;
      bot.roomSlug = formatted._id;
      if (formatted.handle) bot.roomSlug = formatted.handle;
    }
  });
  // init afk check
  bot.afkTimer = setInterval(function() {
    if (bot.afkLimit && !process.env.GUEST_BOT) afkCheck();
  }, 3 * 60000);

  // load bot's playlist
  plLoad();
};

const reduceTrack = (track) => ({
  id: track.id,
  album: {
    images: track.album.images,
    name: track.album.name,
    uri: track.album.uri,
  },
  artists: track.artists,
  duration_ms: track.duration_ms,
  startedAt: track.startedAt,
  href: track.href,
  name: track.name,
  popularity: track.popularity,
  uri: track.uri,
});

bot.treatUserUri = function(uri) {
  let newUri = uri.replace(".", "--");
  return newUri;
};

const plLoad = function(url) {
  if (!url) url = "https://api.spotify.com/v1/playlists/" + process.env.SPOTIFY_PLAYLIST + "/tracks?offset=0&limit=100&market=US"
  spotify
    .request(url)
    .then(function(list) {
      function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
      }
      if (list.items) {
        if (list.items.length) {
          var tracks = [];
          for (let i = 0; i < list.items.length; i++) {
            tracks.push(list.items[i].track);
          }
          tracks = tracks.map(reduceTrack);
          shuffleArray(tracks);
          bot.playlist = bot.playlist.concat(tracks);
          console.log(bot.playlist.length + "tracks loaded.");
        }
      }
      if (list.next) plLoad(list.next);
    })
    .catch(function(err) {
      console.log(err);
    });
};

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
  if (process.env.LASTFM_SESSIONKEY) lastfm.scrobble();
  bot.song = message;
  bot.voted = false;
  bot.coinIssued = false;
  console.log(moment(Date.now()).format("HH:mm") + " " + message.username + " is playing " + message.artists[0].name + " - " + message.name);
  lastfm.duration = bot.song.duration_ms / 1000;
  lastfm.songStart = Math.floor((new Date()).getTime() / 1000);
  if (process.env.LASTFM_SESSIONKEY) lastfm.nowPlaying();
  jqbx.getFirst("spotify:track:"+ bot.song.id, function(formatted) {
    if (!formatted){
      jqbx.sendChat(":first_place_medal: first (probably?)");
    } else {
      var dif = Date.now() - new Date(formatted.track.startedAt).getTime();
      if (dif <= 10000) jqbx.sendChat(":first_place_medal: first! (almost for sure)");
    }
  });
  // VERY IMPORTANT HORN INTRO TRACKING:
  if (message.artists[0].name == "Modest Mouse" && message.name == "Horn Intro") {
    bot.hornchain++;
    if (bot.hornchain <= 10) {
      var hornstring = "";
      for (var i = 0; i < bot.hornchain; i++) {
        hornstring += ":trumpet:";
      }
      jqbx.sendChat(hornstring);
    } else {
      jqbx.sendChat(":trumpet: x" + bot.hornchain);
    }
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
  var countries = [];
  for (var i = 0; i < users.length; i++) {
    ppl.push(users[i]._id);
    if (!countries.includes(users[i].country)) {
      countries.push(users[i].country);
    }
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
  bot.regions = countries;
});

jqbx.events.on("newVote", function(data) {
  //console.log("DOWNSTARS: "+jqbx.downStars());
  if (!bot.coinIssued) {
    if (jqbx.downStars() > 4) {
      // issue mrdrcoin
      bot.coinIssued = true;
      if (process.env.LASTFM_SESSIONKEY) lastfm.love();
      var coinRef = firebase.app("bot").database().ref("bank/" + bot.treatUserUri(bot.song.userUri));
      coinRef.once("value")
        .then(function(snap) {
          var data = snap.val();
          var bal = 1
          if (data) {
            bal = data.bal + 1;
          }
          coinRef.set({
            bal: bal,
            name: bot.song.username
          });
          jqbx.sendMessage(bot.song.username + " has been issued 1 mrdrcoin and now has a total of " + bal + ".");
        });
    }
  }
  if (bot.song.userUri !== data.user.uri) bot.lastActive[data.user.uri] = Date.now();
  var skipCheck = jqbx.voteRatio(true);
  if ((skipCheck <= -0.25 && !bot.voted) && (bot.users.length >= 5)) {
    jqbx.sendChat(":anchor:");
    jqbx.upvote();
    bot.voted = true;
  }
});

jqbx.events.on("djsChanged", function(data) {
  bot.djs = data;
  // console.log("DJS CHANGED:" +bot.djs.length);
});

jqbx.events.on("newDJ", function(data) {
  bot.lastActive[data.uri] = Date.now();
});

jqbx.events.on("trackRequested", function() {
  // FEED JQBX A TRACK
  var track = bot.playlist.shift();
  jqbx.supplyTrack(track);
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

  var isHere = jqbx.getUserObjFromUri(uri);
  if (isHere) {
    if (isHere.device == "bot") isHere = false;
  }

  console.log(moment(Date.now()).format("HH:mm") + " " + name + ": " + txt);

  var matches = txt.match(/^(?:[!*./])(\w+)\s*(.*)/i);
  if (matches) {
    var command = matches[1].toLowerCase();
    var args = matches[2];
    if (args) args = args.trim();

    var thecommand = bot.commands.filter(function(cmd) {
      var found = false;
      for (i = 0; i < cmd.names.length; i++) {
        if (!found) {
          found = (cmd.names[i] == command.toLowerCase());
        }
      }
      return found;
    })[0];

    if (thecommand && uri !== bot.user.uri && isHere) {
      // run command
      thecommand.handler(commandData, args);
    } else if (uri !== bot.user.uri && isHere) {
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
  if (!bot.users.includes(bot.user._id)) {
    console.log("BOT APPEARS TO NOT BE HERE?");
  } else {
    var numberDjs = bot.djs.length;
    for (let i = 0; i < numberDjs; i++) {
      if (bot.djs[i].uri !== bot.user.uri) {
        if (bot.lastActive[bot.djs[i].uri]) {
          var timeSince = Math.floor((Date.now() - bot.lastActive[bot.djs[i].uri]) / 1000 / 60);
          console.log("AFK CHECK: " + bot.djs[i].uri + ": " + timeSince);
          if (timeSince >= bot.afkLimit) {
            if (bot.warned[bot.djs[i].uri]) {
              if (bot.song.userUri == bot.djs[i].uri) {
                // this person is current dj ... wait for now
              } else {
                jqbx.removeDJ(bot.djs[i].uri);
                bot.warned[bot.djs[i].uri] = false;
              }
            } else if (numberDjs > 1) {
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
  }
};

var lastfm = {
  sk: process.env.LASTFM_SESSIONKEY,
  key: process.env.LASTFM_KEY,
  songStart: null,
  duration: null,
  scrobble: function() {
    var artist = bot.song.artists[0].name;
    var track = bot.song.name;
    var album = bot.song.album.name;
    if (!lastfm.duration) lastfm.duration = bot.song.duration_ms / 1000;
    if (!lastfm.songStart) lastfm.songStart = Math.floor((new Date()).getTime() / 1000) - lastfm.duration;
    var params = {
      artist: artist,
      track: track,
      album: album,
      timestamp: lastfm.songStart,
      api_key: lastfm.key,
      sk: lastfm.sk,
      method: "track.scrobble"
    };

    var sig = lastfm.getApiSignature(params);
    params.api_sig = sig;

    var request_url = 'https://ws.audioscrobbler.com/2.0/?' + serialize(params);

    var request_url = 'https://ws.audioscrobbler.com/2.0/?' + serialize(params);
    var options = {
      method: "POST",
      url: request_url
    };

    request(options, function(err1, res1, body1) {
      if (err1) console.log(err1);
      console.log(body1);
    });
  },
  love: function() {
    var artist = bot.song.artists[0].name;
    var track = bot.song.name;

    var params = {
      artist: artist,
      track: track,
      api_key: lastfm.key,
      sk: lastfm.sk,
      method: "track.love"
    };

    var sig = lastfm.getApiSignature(params);
    params.api_sig = sig;

    var request_url = 'https://ws.audioscrobbler.com/2.0/?' + serialize(params);
    var options = {
      method: "POST",
      url: request_url
    };

    request(options, function(err1, res1, body1) {
      if (err1) console.log(err1);
      console.log(body1);
    });

  },
  _onAjaxError: function(xhr, status, error) {
    console.log(xhr);
    console.log(status);
    console.log(error);
  },
  nowPlaying: function() {
    var artist = bot.song.artists[0].name;
    var track = bot.song.name;
    var album = bot.song.album.name;

    var params = {
      artist: artist,
      track: track,
      album: album,
      duration: lastfm.duration,
      api_key: lastfm.key,
      sk: lastfm.sk,
      method: "track.updateNowPlaying"
    };

    var sig = lastfm.getApiSignature(params);
    params.api_sig = sig;

    var request_url = 'https://ws.audioscrobbler.com/2.0/?' + serialize(params);

    var request_url = 'https://ws.audioscrobbler.com/2.0/?' + serialize(params);
    var options = {
      method: "POST",
      url: request_url
    };

    request(options, function(err1, res1, body1) {
      if (err1) console.log(err1);
      console.log(body1);
    });

  },
  getApiSignature: function(params) {
    var i, key, keys, max, paramString;

    keys = [];
    paramString = "";

    for(key in params) {
      if (params.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    keys.sort();

    for (i = 0, max = keys.length; i < max; i += 1) {
      key = keys[i];
      paramString += key + params[key];
    }

    return calcMD5(paramString + process.env.LASTFM_APISECRET);
  }
};

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Copyright (C) Paul Johnston 1999 - 2000.
 * Updated by Greg Holt 2000 - 2001.
 * See http://pajhome.org.uk/site/legal.html for details.
 */

/*
 * Convert a 32-bit number to a hex string with ls-byte first
 */
var hex_chr = "0123456789abcdef";

function rhex(num) {
  str = "";
  for (j = 0; j <= 3; j++)
    str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) +
    hex_chr.charAt((num >> (j * 8)) & 0x0F);
  return str;
}

/*
 * Convert a string to a sequence of 16-word blocks, stored as an array.
 * Append padding bits and the length, as described in the MD5 standard.
 */
function str2blks_MD5(str) {
  nblk = ((str.length + 8) >> 6) + 1;
  blks = new Array(nblk * 16);
  for (i = 0; i < nblk * 16; i++) blks[i] = 0;
  for (i = 0; i < str.length; i++)
    blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  blks[i >> 2] |= 0x80 << ((i % 4) * 8);
  blks[nblk * 16 - 2] = str.length * 8;
  return blks;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function add(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left
 */
function rol(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * These functions implement the basic operation for each round of the
 * algorithm.
 */
function cmn(q, a, b, x, s, t) {
  return add(rol(add(add(a, q), add(x, t)), s), b);
}

function ff(a, b, c, d, x, s, t) {
  return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t) {
  return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Take a string and return the hex representation of its MD5.
 */
function calcMD5(str) {
  x = str2blks_MD5(str);
  a = 1732584193;
  b = -271733879;
  c = -1732584194;
  d = 271733878;

  for (i = 0; i < x.length; i += 16) {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;

    a = ff(a, b, c, d, x[i + 0], 7, -680876936);
    d = ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i + 10], 17, -42063);
    b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = hh(a, b, c, d, x[i + 5], 4, -378558);
    d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = ii(a, b, c, d, x[i + 0], 6, -198630844);
    d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = add(a, olda);
    b = add(b, oldb);
    c = add(c, oldc);
    d = add(d, oldd);
  }
  return rhex(a) + rhex(b) + rhex(c) + rhex(d);
}

var serialize = function(obj, prefix) {
  var str = [];
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p,
        v = obj[p];
      str.push(typeof v == "object" ?
        serialize(v, k) :
        encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
}

bot.init();
