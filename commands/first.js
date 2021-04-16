// first command

exports.names = ['first'];
exports.handler = function(data, args) {
  if (bot.song) {
    var trackid = "spotify:track:" + bot.song.id;
    if (args) {
      var match = args.match(/.*\/\/open.spotify\.com\/.*\/(.*?)(?=\?|$)/);
      if (match){
        trackid = "spotify:track:" + match[1];
      }
    }
    jqbx.getFirst(trackid, function(formatted) {
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
        jqbx.sendChat(data.name + ", I don't think that one has ever been played before.");
      }
    });
  } else {
    jqbx.sendChat("ummMm i just got here wtf is playing give me a second to figure that out");
  }
};
