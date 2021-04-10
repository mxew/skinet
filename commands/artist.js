// artist command

exports.names = ['artist'];
exports.handler = function(data, args) {
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
                jqbx.sendChat(data.name + ", dont know this artist");
              }
            } else {
              jqbx.sendChat(data.name + ", i have no information about this artist.");
            }
          } catch (e) {
            console.log(e);
            jqbx.sendChat(data.name + ", i have no information on this artist and/or last.fm is on fire.");
          }
        }
      } else {
        console.log(error);
      }
    });
  } else {
    jqbx.sendChat("i just reconnected. no idea what song is playing thanks.")
  }
};
