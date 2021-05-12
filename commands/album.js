// album command

exports.names = ['album'];
exports.handler = function(data, args) {
  if (bot.song) {
    var trackid = bot.song.id;
    if (args) {
      var match = args.match(/.*\/\/open.spotify\.com\/.*\/(.*?)(?=\?|$)/);
      if (match){
        trackid = match[1];
      }
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
          jqbx.sendChat(song.name + " was released on the album " + song.album.name + "" + withOther + " on " + moment(releaseDate).format("MMMM Do YYYY"));
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
};
