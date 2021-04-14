// relink command

exports.names = ['relink'];
exports.handler = function(data, args) {
  if (bot.song) {
    spotify
      .request('https://api.spotify.com/v1/tracks/' + bot.song.id)
      .then(function(song) {
        var regions = song.available_markets;
        var blocked = [];
        for (let i = 0; i < bot.regions.length; i++){
          if (!regions.includes(bot.regions[i])) blocked.push(bot.regions[i]);
        }
        if (blocked.length){
          jqbx.sendChat(bot.song.name + " is not available in the following regions: " + blocked.join(", ") + ".");
        } else {
          jqbx.sendChat(bot.song.name + " should in theory be playing for everyone here. ("+bot.regions.join(", ") + ").")
        }
      })
      .catch(function(err) {
        jqbx.sendChat("there's some sort of problem thanks.")
      });
  } else {
    jqbx.sendChat("i just reconnected. no idea what song is playing thanks.")
  }
};
