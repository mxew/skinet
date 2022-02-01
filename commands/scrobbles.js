// scrobbles command

exports.names = ['scrobbles', 'scroobles'];
exports.handler = function(data, args) {
  if (bot.song) {
    let lastfmUsername = null;
    if (args) {
      lastfmUsername = args;
    } else if (process.env.LASTFM_USERNAME) {
      lastfmUsername = process.env.LASTFM_USERNAME;
    }
    if (!lastfmUsername) {
      jqbx.sendChat("scrobbles for who thanks? please feed me last.fm username this is very important.");
    } else {
      request("https://ws.audioscrobbler.com/2.0/?method=track.getInfo&track=" + encodeURIComponent(bot.song.name) + "&artist=" + encodeURIComponent(bot.song.artists[0].name) + "&username=" + lastfmUsername + "&api_key=" + process.env.LASTFM_KEY + "&format=json", function cbfunc(error, response, body) {
        if (!error && response.statusCode == 200) {
          if (body) {
            try {
              let formatted = JSON.parse(body);
              console.log(formatted);
              if (formatted.track) {
                if (formatted.track.userplaycount) {
                  var thelabel = "scrobbles";
                  if (formatted.track.userplaycount == 1) thelabel = "scrobble";
                  jqbx.sendChat(lastfmUsername + " has " + formatted.track.userplaycount + " " + thelabel + " of " +bot.song.name+". Also, " + formatted.track.listeners + " last.fm listeners have scrobbled it "+formatted.track.playcount+" times.");
                } else {
                  jqbx.sendChat(bot.song.name + " has never been scrobbled to "+lastfmUsername+ " i think.");
                }
              } else {
                jqbx.sendChat(data.name + ", no scrobbles for this one (at least under this particular song metadata)");
              }
            } catch (e) {
              console.log(e);
              jqbx.sendChat(data.name + ", i have no information on this song and/or last.fm is on fire.");
            }
          }
        } else {
          console.log(error);
        }
      });
    }
  } else {
    jqbx.sendChat("i just reconnected. no idea what song is playing thanks.")
  }
};
