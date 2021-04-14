// uv command

exports.names = ['uv'];
exports.handler = function(data, args) {
  var roomChanges = firebase.database().ref("roomChanges");
  roomChanges.once("value")
    .then(function(snapshot) {
      var val = snapshot.val();
      var roomsToConsider = {};
      for (var key in val) {
        if (val.hasOwnProperty(key)) {
          var changes = val[key].increases;
          if (changes) {
            for (var roomid in changes) {
              if (changes.hasOwnProperty(roomid)) {
                if (!roomsToConsider[roomid]) {
                  roomsToConsider[roomid] = changes[roomid];
                } else {
                  roomsToConsider[roomid].thumbsUp += changes[roomid].thumbsUp;
                  roomsToConsider[roomid].thumbsDown += changes[roomid].thumbsDown;
                  roomsToConsider[roomid].stars += changes[roomid].stars;
                }
              }
            }
          }
        }
      }
      var coollist = [];
      for (var niceid in roomsToConsider) {
        if (roomsToConsider.hasOwnProperty(niceid)) {
          coollist.push(roomsToConsider[niceid]);
        }
      }

      coollist.sort(function(a, b) {
        return b.thumbsUp - a.thumbsUp;
      });

      var uvlist = "";
      var max2 = coollist.length;
      if (max2 > 15) max2 = 15;
      for (var i = 0; i < max2; i++) {
        var rank = i + 1;
        if (coollist[i].thumbsUp > 0) {
          uvlist += "#" + rank + " " + coollist[i].roomTitle + " (" + coollist[i].thumbsUp + ") | ";
        }
      }
      if (uvlist == ""){
        jqbx.sendChat("nobody has upvoted anywhere in the last 3 hours. let me not fix that.");
        jqbx.downvote();
      } else {
        jqbx.sendChat("Most :+1: in last 3 hours: " + uvlist.slice(0,-3), true);
      }
    });
};
