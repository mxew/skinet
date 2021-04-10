// metrics command

exports.names = ['metrics'];
exports.handler = function(data, args) {
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
};
