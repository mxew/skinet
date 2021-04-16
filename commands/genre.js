// genre command

exports.names = ['genre'];
exports.handler = function(data, args) {
  if (bot.song) {
    var artistid = bot.song.artists[0].id;
    if (args) {
      var match = args.match(/.*\/\/open.spotify\.com\/.*\/(.*?)(?=\?|$)/);
      if (match){
        artistid = match[1];
        console.log(artistid)
      }
    }
    spotify
      .request('https://api.spotify.com/v1/artists/' + artistid)
      .then(function(artist) {
        if (artist) {
          if (artist.genres.length){
            jqbx.sendChat(artist.name + " is classified by Spotify as: " + artist.genres.join(", "));
          } else {
            jqbx.sendChat("spotify hasn't decided what this is yet.");
          }
        } else {
          jqbx.sendChat(name + ", what artist is that?");
        }
      })
      .catch(function(err) {
        jqbx.sendChat("don't know that one thanks")
      });
  } else {
    jqbx.sendChat("ummMm i just got here wtf is playing give me a second to figure that out");
  }
};
