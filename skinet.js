/*
skinet for jqbx.fm
INDIE WHILE YOU MURDER
*/
require('dotenv').config({
  silent: process.env.NODE_ENV === 'production'
});
const jqbx = require("./jqbx-api");
const {
  createCanvas,
  loadImage,
  Image
} = require('canvas');
require('moment-timezone');
const canvas = createCanvas(400, 220);
const ctx = canvas.getContext('2d');
const request = require('request');
const moment = require('moment');
const firebase = require('firebase');
const Spotify = require('node-spotify-api');
const striptags = require('striptags');
const imgur = require('imgur');
const spotify = new Spotify({
  id: process.env.SPOTIFY_ID,
  secret: process.env.SPOTIFY_SECRET
});

var bot = {
  user: {
    username: process.env.JQBX_NAME,
    id: process.env.JQBX_USERID,
    _id: process.env.JQBX_ID,
    uri: "spotify:user:" + process.env.JQBX_USERID,
    image: process.env.JQBX_IMAGE,
    device: "bot",
    status: "active",
    country: "US",
    socketId: process.env.JQBX_SOCKETID
  },
  roomid: process.env.JQBX_ROOMID,
  song: null,
  hornchain: 0,
  phrases: {
    "rawr": "RAWR",
    "clap": ":clap: :clap: :clap:",
    "sheesh": "sheeeeeeeeeeesh",
    "shrug": "¯\\_(ツ)_/¯",
    "shots": "SHOTS",
    "wait": "wait",
    "ro": "no",
    "secretcodeword": "http://bandsdirtiehates.online",
    "leaderboard": "https://thompsn.com/jqbx/leaderboard/?board=down",
    "help": "please download our rules pdf",
    "want": "Get a bot for your own room by filling out the request form: https://thompsn.com/iwym.org/rules.pdf",
    "x": "JASON!",
    "1": "Never outshine the master",
    "2": "Never put too much trust in friends, learn how to use enemies",
    "3": "Conceal your intentions",
    "4": "Always say less than necessary",
    "5": "So much depends on reputation — guard it with your life.",
    "6": "Court attention at all cost",
    "7": "Get others to do the work for you, but always take the credit.",
    "8": "Make other people come to you — use bait if necessary.",
    "9": "Win through your actions, never through argument",
    "10": "Infection — avoid the unhappy and unlucky",
    "11": "Learn to keep people dependent on you",
    "12": "Use selective honesty and generosity to disarm your victim",
    "13": "When asking for help, appeal to people's self-interest, never to their mercy or gratitude",
    "14": "Pose as a friend, work as a spy",
    "15": "Crush your enemy totally.",
    "16": "Use absence to increase respect and honor",
    "17": "Keep others in suspended terror — cultivate an air of unpredictability.",
    "18": "Do not build fortresses to protect yourself — isolation is dangerous.",
    "19": "Know who you are dealing with — do not offend the wrong person",
    "20": "Do not commit to anyone",
    "21": "Play a sucker to catch a sucker — seem dumber than your mark",
    "22": "Use the surrender tactic — transform weakness into power.",
    "23": "Concentrate your forces",
    "24": "Play the perfect courtier",
    "25": "Re-create your life.",
    "26": "Keep your hands clean",
    "27": "Play on people's need to believe to create a cultlike following",
    "28": "Enter action with boldness",
    "29": "Plan all the way to the end",
    "30": "Make your accomplishments seem effortless",
    "31": "Control the options — get others to play with the cards you deal",
    "32": "Play to people's fantasies",
    "33": "Discover each employee's thumbscrew.",
    "34": "Be royal in your own fashion — act like a king or queen to be treated like one.",
    "35": "Master the art of timing",
    "36": "Disdain things you cannot have — ignoring them is the best revenge.",
    "37": "Create compelling spectacles",
    "38": "Think as you like but behave like others",
    "39": "Stir up waters to catch fish.",
    "40": "Despise the free lunch",
    "41": "Avoid stepping into a great man's shoes",
    "42": "Strike the shepherd and the sheep will scatter",
    "43": "Work on the hearts and minds of others.",
    "44": "Disarm and infuriate with the 'mirror effect'",
    "45": "Preach the need for change, but never reform too much at once.",
    "46": "Never appear too perfect. — Only gods and the dead can seem perfect with impunity.",
    "47": "Do not go past the mark you aimed for — in victory, learn when to stop.",
    "48": "Assume formlessness."
  },
  users: null

};

bot.init = function() {
  jqbx.events.once("ready", function() {
    jqbx.joinRoom(bot.roomid, bot.user);
  });
};

const getConditionFillColor = (temperature, units) => {
  let color = '#000000';
  switch (units) {
    case 'imperial':
      if (temperature < 20) color = '#463763';
      else if (temperature < 40) color = '#33426b';
      else if (temperature < 60) color = '#32642e';
      else if (temperature < 80) color = '#7d7d2f';
      else if (temperature < 100) color = '#855d32';
      else color = '#682b2e';
      break;
    default:
      if (temperature < -6) color = '#463763';
      else if (temperature < 5) color = '#33426b';
      else if (temperature < 16) color = '#32642e';
      else if (temperature < 27) color = '#7d7d2f';
      else if (temperature < 38) color = '#855d32';
      else color = '#682b2e';
      break;
  }

  return color;
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
  console.log(moment(Date.now()).format("HH:mm") + " " + name + ": " + txt);
  if (txt == "test") {
    jqbx.sendChat("very good test " + name + " thanksssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss  ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss ssssssssssssssssssssssssssssssssssssssss sssssssssssssssssssssssssssssssssssssssssssssssssssss sssssssssssssssssssssssssssssssssssssssssssssssssss sssssssssssssssssssssssssssssssssssssssssssssss sssssssssssssssssssssssssssssssssssssss", true);
  }
  var matches = txt.match(/^(?:[/])(\w+)\s*(.*)/i);
  if (matches) {
    var command = matches[1].toLowerCase();
    var args = matches[2];
    if (command == "wx2" || command == "weather2") {
      if (!args) args = "ames";
      if (args) {
        request('https://www.mapquestapi.com/geocoding/v1/address?key=' + process.env.MAPQUEST_KEY + '&location=' + args, function cbfunc(error, response, body) {
          //If call returned correctly, continue
          if (!error && response.statusCode == 200) {
            var formatted = JSON.parse(body);
            console.log(formatted);

            if (formatted.results[0].locations[0].adminArea5 != "") {
              var locationStr = formatted.results[0].locations[0].adminArea5 + " " + formatted.results[0].locations[0].adminArea3 + " (" + formatted.results[0].locations[0].adminArea1 + ")";
              var units = "metric";
              if (formatted.results[0].locations[0].adminArea1 == "US") units = "imperial";
              var lat = formatted.results[0].locations[0].latLng.lat;
              var lng = formatted.results[0].locations[0].latLng.lng;
              request("https://api.openweathermap.org/data/2.5/onecall?appid=" + process.env.OPENWEATHERMAP_KEY + "&lat=" + lat + "&lon=" + lng + "&units=" + units, function cbfunc(error2, response2, body2) {
                //If call returned correctly, continue
                if (!error2 && response2.statusCode == 200) {
                  var wdata = JSON.parse(body2);
                  console.log(wdata.current.weather[0]);
                  if (wdata) {
                    var ukMix = false;
                    var timeFormat = "HH:mm";
                    var twelvehour = {
                      US: true,
                      GB: true,
                      PH: true,
                      CA: true,
                      AU: true,
                      NZ: true,
                      IN: true,
                      EG: true,
                      SA: true,
                      CO: true,
                      PK: true,
                      MY: true
                    };
                    if (twelvehour[formatted.results[0].locations[0].adminArea1]) timeFormat = "h:mm A";
                    if (formatted.results[0].locations[0].adminArea1 == "GB") ukMix = true;
                    console.log(ukMix + " " + ukMix);
                    var tempBoy = "°C";
                    if (units == "imperial") tempBoy = "°F";
                    var windBoy = "km/h"
                    if (units == "imperial" || ukMix) windBoy = "mph";
                    var pressureBoy = "hPa";
                    if (units == "imperial") pressureBoy = "inHg";
                    var visBoy = "km";
                    if (units == "imperial" || ukMix) visBoy = "mi";
                    var dateFormat = "ddd D/M";
                    if (units == "imperial") dateFormat = "ddd M/D";

                    // https://openweathermap.org/img/wn/11n@2x.png
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.textAlign = 'left';
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    //begin current weather box thing
                    ctx.fillStyle = getConditionFillColor(wdata.current.temp, units);
                    ctx.fillRect(0, 0, 400, 35);
                    ctx.fillRect(0, 120, 400, 3);

                    //LOCATION
                    ctx.textAlign = 'left';
                    ctx.fillStyle = "#ffffff";
                    ctx.font = '400 18px Open Sans, Helvetica, Arial, sans-serif'
                    ctx.fillText(locationStr, 10, 25);

                    //LOCAL TIME
                    ctx.textAlign = 'right';
                    ctx.font = '400 12px Open Sans, Helvetica, Arial, sans-serif'
                    ctx.fillText(moment(Date.now()).tz(wdata.timezone).format(timeFormat), 390, 22);

                    ctx.textAlign = 'left';
                    ctx.fillStyle = "#ffffff";
                    // CURRENT TEMP
                    var tempBig = Math.round(wdata.current.temp);
                    ctx.font = '700 45px Open Sans, Helvetica, Arial, sans-serif';
                    var bigtempwidth = ctx.measureText(tempBig).width;
                    ctx.fillText(tempBig, 85, 80);
                    ctx.font = '400 22px Open Sans, Helvetica, Arial, sans-serif';
                    var spaceit = 87 + bigtempwidth;
                    bigtempwidth += (87 + ctx.measureText(tempBoy).width + 18);
                    ctx.fillText(tempBoy, spaceit, 65);
                    //CURRENT STATUS
                    ctx.font = '700 22px Open Sans, Helvetica, Arial, sans-serif';
                    var statusWidth = ctx.measureText(wdata.current.weather[0].description).width;
                    if (statusWidth > 210) {
                      ctx.font = '700 18px Open Sans, Helvetica, Arial, sans-serif';
                      var statusWidth2 = ctx.measureText(wdata.current.weather[0].description).width;
                      if (statusWidth2 > 210) {
                        ctx.font = '700 15px Open Sans, Helvetica, Arial, sans-serif';
                      }
                    }
                    ctx.fillText(wdata.current.weather[0].description, bigtempwidth, 70);

                    //CURRENT DATA LABELS
                    ctx.font = '400 italic 11px Open Sans, Helvetica, Arial, sans-serif';
                    ctx.fillText('Feels like', 90, 97);
                    ctx.fillText('Wind', 90, 113);

                    ctx.fillText('Humidity', 190, 97);
                    ctx.fillText('Pressure', 190, 113);

                    ctx.fillText('Visibility', 300, 97);
                    ctx.fillText('UV Index', 300, 113);

                    //DATA VALUES NOW
                    ctx.font = '400 11px Open Sans, Helvetica, Arial, sans-serif';
                    ctx.fillText(Math.round(wdata.current.feels_like) + ' ' + tempBoy, 141, 97); //feels like
                    var windSpeed = "N/A";
                    if (units == "imperial") {
                      windSpeed = Math.round(wdata.current.wind_speed);
                    } else {
                      var kph = 3.6 * wdata.current.wind_speed;
                      var mph = 2.237 * wdata.current.wind_speed;
                      if (ukMix) {
                        windSpeed = Math.round(mph);
                      } else {
                        windSpeed = Math.round(kph);
                      }
                    }
                    ctx.fillText(windSpeed + ' ' + windBoy, 141, 113); //wind

                    ctx.fillText(Math.round(wdata.current.humidity) + "%", 238, 97); //humid
                    var presStr = 'N/A';
                    if (wdata.current.pressure) {
                      if (units == 'imperial') {
                        presStr = (wdata.current.pressure / 33.86).toFixed(2);
                      } else {
                        presStr = (wdata.current.pressure);
                      }
                      presStr += ' ' + pressureBoy
                    }
                    ctx.fillText(presStr, 238, 113); //pressure
                    var visStr = 'N/A';
                    if (wdata.current.visibility) {
                      if (units == "imperial" || ukMix) {
                        visStr = Math.round(wdata.current.visibility / 1609);
                      } else {
                        visStr = Math.round(wdata.current.visibility / 1000);
                      }
                      visStr += ' ' + visBoy;
                    }
                    ctx.fillText(visStr, 350, 97); //vis
                    ctx.fillText(wdata.current.uvi, 350, 113); //uv

                    //THREE DAY
                    ctx.textAlign = 'center';
                    ctx.font = '400 14px Open Sans, Helvetica, Arial, sans-serif';
                    ctx.fillText(moment(wdata.daily[0].dt * 1000).tz(wdata.timezone).format(dateFormat), 80, 142);
                    ctx.fillText(moment(wdata.daily[1].dt * 1000).tz(wdata.timezone).format(dateFormat), 200, 142);
                    ctx.fillText(moment(wdata.daily[2].dt * 1000).tz(wdata.timezone).format(dateFormat), 320, 142);

                    ctx.textAlign = 'left';
                    ctx.font = '400 italic 11px Open Sans, Helvetica, Arial, sans-serif';
                    ctx.fillText('Sunrise: ' + moment(wdata.daily[0].sunrise * 1000).tz(wdata.timezone).format(timeFormat), 40, 200);
                    ctx.fillText('Sunset: ' + moment(wdata.daily[0].sunset * 1000).tz(wdata.timezone).format(timeFormat), 40, 215);

                    ctx.fillText('Sunrise: ' + moment(wdata.daily[1].sunrise * 1000).tz(wdata.timezone).format(timeFormat), 160, 200);
                    ctx.fillText('Sunset: ' + moment(wdata.daily[1].sunset * 1000).tz(wdata.timezone).format(timeFormat), 160, 215);

                    ctx.fillText('Sunrise: ' + moment(wdata.daily[2].sunrise * 1000).tz(wdata.timezone).format(timeFormat), 280, 200);
                    ctx.fillText('Sunset: ' + moment(wdata.daily[2].sunset * 1000).tz(wdata.timezone).format(timeFormat), 280, 215);

                    //BEGIN 3DAY HIGHS AND LOWS
                    ctx.textAlign = 'right';
                    ctx.font = '700 16px Open Sans, Helvetica, Arial, sans-serif';
                    ctx.fillText(Math.round(wdata.daily[0].temp.max) + ' ' + tempBoy, 120, 166);
                    ctx.fillText(Math.round(wdata.daily[0].temp.min) + ' ' + tempBoy, 120, 185);

                    ctx.fillText(Math.round(wdata.daily[1].temp.max) + ' ' + tempBoy, 240, 166);
                    ctx.fillText(Math.round(wdata.daily[1].temp.min) + ' ' + tempBoy, 240, 185);

                    ctx.fillText(Math.round(wdata.daily[2].temp.max) + ' ' + tempBoy, 360, 166);
                    ctx.fillText(Math.round(wdata.daily[2].temp.min) + ' ' + tempBoy, 360, 185);


                    // ICONS ICONS ICONS
                    var picboy = new Image();
                    picboy.onload = function() {
                      ctx.drawImage(picboy, -7, 30, 100, 100);

                      var picboy2 = new Image();
                      picboy2.onload = function() {
                        ctx.drawImage(picboy2, 25, 142, 60, 60);

                        var picboy3 = new Image();
                        picboy3.onload = function() {
                          ctx.drawImage(picboy3, 145, 142, 60, 60);
                          var picboy4 = new Image();
                          picboy4.onload = function() {
                            ctx.drawImage(picboy4, 265, 142, 60, 60);
                            var img;
                            try {
                              img = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                            } catch (e) {
                              img = canvas.toDataURL().split(',')[1];
                            }
                            imgur.uploadBase64(img)
                              .then(function(json) {
                                console.log(json.data.link);
                                jqbx.sendChat(json.data.link);
                              })
                              .catch(function(err) {
                                console.error(err.message);
                                jqbx.sendChat("imgur upload error...");
                              });
                          };
                          picboy4.onerror = err => {
                            throw err
                          }
                          picboy4.src = 'https://openweathermap.org/img/wn/' + wdata.daily[2].weather[0].icon + '@2x.png';
                        };
                        picboy3.onerror = err => {
                          throw err
                        }
                        picboy3.src = 'https://openweathermap.org/img/wn/' + wdata.daily[1].weather[0].icon + '@2x.png';
                      };
                      picboy2.onerror = err => {
                        throw err
                      }
                      picboy2.src = 'https://openweathermap.org/img/wn/' + wdata.daily[0].weather[0].icon + '@2x.png';
                    };
                    picboy.onerror = err => {
                      throw err
                    }
                    picboy.src = 'https://openweathermap.org/img/wn/' + wdata.current.weather[0].icon + '@2x.png';

                  } else {
                    jqbx.sendChat("E R R O R with my weather sensors!");
                  }
                } else {
                  jqbx.sendChat("HMMMMMMMMMMMMM RATE LIMIT?");
                }
              });
            } else {
              jqbx.sendChat("where is that? i'm using mapquest idk");
            }
          }
        });
      }

    } else if (command == "inspire") {
      request('https://inspirobot.me/api?generate=true', function cbfunc(error, response, body) {
        //If call returned correctly, continue
        if (!error && response.statusCode == 200) {
          if (body) {
            jqbx.sendChat(body);
          }
        }
      });

    } else if (command == "album") {
      if (bot.song) {
        var trackid = bot.song.id;
        if (args) {
          trackid = args.trim().replace("spotify:track:", "");
        }
        spotify
          .request('https://api.spotify.com/v1/tracks/' + trackid)
          .then(function(song) {
            if (song) {
              var withOther = "";
              if (song.album.total_tracks > 1) {
                var thismany = song.album.total_tracks - 1;
                withOther = " along with " + thismany + " other tracks";
              }
              var releaseDate = new Date(song.album.release_date);
              jqbx.sendChat(song.name + " was released to Spotify on the album " + song.album.name + "" + withOther + " on " + moment(releaseDate).format("MMMM Do YYYY"));
            } else {
              jqbx.sendChat(name + ", what song is that?");
            }
          })
          .catch(function(err) {
            jqbx.sendChat("don't know that one thanks")
          });
      } else {
        jqbx.sendChat("ummMm i just got here wtf is playing give me a second to figure that out");
      }
    } else if (command == "first") {
      if (bot.song) {
        var trackid = "spotify:track:" + bot.song.id;
        if (args) {
          trackid = args.trim();
        }
        jqbx.getFirst(trackid, function(formatted) {
          console.log(formatted);
          if (formatted) {
            var prsn = formatted.track.username;
            if (!formatted.track.username) prsn = formatted.track.userUri.replace("spotify:user:", "");
            if (formatted.user.username !== prsn) {
              if (!formatted.user.username) formatted.user.username = formatted.user.uri.replace("spotify:user:", "");
              prsn += " (now known as " + formatted.user.username + ")";
            }
            var stars = 0;
            if (formatted.track.stars) stars = formatted.track.stars;
            var uplab = "upvotes";
            var downlab = "downvotes";
            var starlab = "stars";
            if (formatted.track.thumbsUp == 1) uplab = "upvote";
            if (formatted.track.thumbsDown == 1) downlab = "downvote";
            if (stars == 1) starlab = "star";

            jqbx.sendChat(formatted.track.name + " was first played " + moment(formatted.track.startedAt).fromNow() + " by " + prsn + " in " + formatted.room.title + ". It got " + formatted.track.thumbsUp + " " + uplab + ", " + formatted.track.thumbsDown + " " + downlab + ", and " + stars + " " + starlab + ".");
          } else {
            jqbx.sendChat(name + ", I don't think that one has ever been played before.");
          }
        });
      } else {
        jqbx.sendChat("ummMm i just got here wtf is playing give me a second to figure that out");
      }
    } else if (command == "artist") {
      if (bot.song) {
        request('http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + encodeURIComponent(bot.song.artists[0].name) + '&api_key=' + process.env.LASTFM_KEY + '&format=json', function cbfunc(error, response, body) {
          //If call returned correctly, continue
          if (!error && response.statusCode == 200) {
            if (body) {
              try {
                var formatted = JSON.parse(body);
                if (formatted) {
                  if (formatted.artist) {
                    if (formatted.artist.bio) {
                      if (formatted.artist.bio.content == "") {
                        jqbx.sendChat("i know of this artist, but they don't have a bio on last.fm yet.");
                      } else {
                        var thingtosay = striptags(formatted.artist.bio.content);
                        console.log(thingtosay);

                        jqbx.sendChat(thingtosay, true);
                      }
                      if (formatted.artist.similar) {
                        if (formatted.artist.similar.artist) {
                          if (formatted.artist.similar.artist.length) {
                            var similar = "Similar artists include: ";
                            for (var i = 0; i < formatted.artist.similar.artist.length; i++) {
                              similar += formatted.artist.similar.artist[i].name;
                              var lastone = formatted.artist.similar.artist.length - 1;
                              if (i !== lastone) similar += ", ";
                            }
                            jqbx.sendMessage(similar);
                          }
                        }
                      }
                    } else {
                      jqbx.sendChat("i've heard of this artist, but they don't have a last.fm bio");
                    }
                  } else {
                    jqbx.sendChat(name + ", dont know this artist");
                  }
                } else {
                  jqbx.sendChat(name + ", i have no information about this artist.");
                }
              } catch (e) {
                console.log(e);
                jqbx.sendChat(name + ", i have no information on this artist and/or last.fm is on fire.");
              }
            }
          } else {
            console.log(error);
          }
        });
      } else {
        jqbx.sendChat("i just reconnected. no idea what song is playing thanks.")
      }
    } else if (command == "check") {
      jqbx.getUser(uri, function(formatted){
        if (formatted.disableConfetti) {
          jqbx.sendChat(name + " hates fun.");
        } else {
          jqbx.sendChat(name + " does not hate fun.");
        }
      });
    } else if (command == "find") {
      if (args) {
        var name = args.trim();
        var niceref = firebase.database().ref("people");
        var ppl = [];
        niceref.orderByChild('username').equalTo(name).once("value")
          .then(function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
              var key = childSnapshot.key;
              var childData = childSnapshot.val();
              childData.userid = key;
              ppl.push(childData);
            });

            niceref.orderByChild('uri').equalTo("spotify:user:" + name).once("value")
              .then(function(snapshot2) {
                snapshot2.forEach(function(childSnapshot2) {
                  var key2 = childSnapshot2.key;
                  var childData2 = childSnapshot2.val();
                  childData2.userid = key2;
                  ppl.push(childData2);
                });
                console.log(ppl);
                if (!ppl.length) {
                  jqbx.sendChat("No results found for " + name + ". This search is case sensitive, so maybe check that.");
                } else {
                  var spotifyname = ppl[0].uri.slice(13, ppl[0].uri.length);
                  if (ppl[0].username == "Unknown") ppl[0].username = ppl[0].uri.replace("spotify:user:", "");
                  jqbx.sendChat(ppl[0].username + " was last seen in " + ppl[0].roomTitle + " " + moment(ppl[0].lastSeen).fromNow() + ".");
                  if (ppl.length > 1) {
                    var morethings = ppl.length - 1;
                    jqbx.sendMessage("There are " + morethings + " additional results for " + name + ": https://thompsn.com/jqbx/directory/?q=" + encodeURIComponent(name));
                  }
                }
              });

          });

      } else {
        jqbx.sendChat("who are you trying to find ?");
      }
    } else if (command == "metrics") {
      if (bot.song) {
        spotify
          .request('https://api.spotify.com/v1/audio-features/' + bot.song.id)
          .then(function(song) {
            if (song.key == 0) {
              song.key = "c"
            }
            if (song.key == 1) {
              song.key = "c-sharp"
            }
            if (song.key == 2) {
              song.key = "d"
            }
            if (song.key == 3) {
              song.key = "e-flat"
            }
            if (song.key == 4) {
              song.key = "e"
            }
            if (song.key == 5) {
              song.key = "f"
            }
            if (song.key == 6) {
              song.key = "f-sharp"
            }
            if (song.key == 7) {
              song.key = "g"
            }
            if (song.key == 8) {
              song.key = "a-flat"
            }
            if (song.key == 9) {
              song.key = "a"
            }
            if (song.key == 10) {
              song.key = "b-flat"
            }
            if (song.key == 11) {
              song.key = "b"
            }
            if (song.mode == 0) {
              song.mode = "minor"
            }
            if (song.mode == 1) {
              song.mode = "major"
            }
            song.timesig = song.time_signature;
            song.tempo = Math.floor(song.tempo);
            song.energy = Math.floor(song.energy * 100);
            song.danceability = Math.floor(song.danceability * 100);
            jqbx.sendChat("Key: " + song.key + " " + song.mode + " | Time Sig: " + song.timesig + " | Tempo: " + song.tempo + " | Energy: " + song.energy + "% | Danceability: " + song.danceability + "% | Loudness: " + song.loudness);
          })
          .catch(function(err) {
            jqbx.sendChat("there's some sort of problem thanks.")
          });
      } else {
        jqbx.sendChat("i just reconnected. no idea what song is playing thanks.")
      }
    } else {
      if (bot.phrases[command]) {
        jqbx.sendChat(bot.phrases[command]);
      }
    }
  }
});

bot.init();
