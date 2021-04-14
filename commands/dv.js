// dv command

exports.names = ['dv'];
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
      var uncoollist = [];
      for (var niceid in roomsToConsider) {
        if (roomsToConsider.hasOwnProperty(niceid)) {
          uncoollist.push(roomsToConsider[niceid]);
        }
      }

      uncoollist.sort(function(a, b) {
        return b.thumbsDown - a.thumbsDown;
      });

      var dvlist = "";
      var max2 = uncoollist.length;
      if (max2 > 15) max2 = 15;
      for (var i = 0; i < max2; i++) {
        var rank = i + 1;
        if (uncoollist[i].thumbsDown > 0) {
          dvlist += "#" + rank + " " + uncoollist[i].roomTitle + " (" + uncoollist[i].thumbsDown + ") | ";
        }
      }
      if (dvlist == ""){
        jqbx.sendChat("nobody has downvoted anywhere in the last 3 hours. let me fix that.");
        jqbx.downvote();
      } else {
        jqbx.sendChat("Most :-1: in last 3 hours: " + dvlist.slice(0,-3));
      }
    });
};
