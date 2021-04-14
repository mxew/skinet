// stars command

exports.names = ['stars'];
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

      var starlist = [];
      for (var niceid in roomsToConsider) {
        if (roomsToConsider.hasOwnProperty(niceid)) {
          starlist.push(roomsToConsider[niceid]);
        }
      }

      starlist.sort(function(a, b) {
        return b.stars - a.stars;
      });
      var starliststr = "";
      var max2 = starlist.length;
      if (max2 > 15) max2 = 15;
      for (var i = 0; i < max2; i++) {
        var rank = i + 1;
        if (starlist[i].stars > 0) {
          starliststr += "#" + rank + " " + starlist[i].roomTitle + " (" + starlist[i].stars + ") | ";
        }
      }
      if (starlist == ""){
        jqbx.sendChat("nobody has starred anywhere in the last 3 hours. let me not fix that.");
        jqbx.downvote();
      } else {
        jqbx.sendChat("Most :star: in last 3 hours: " + starliststr.slice(0,-3), true);
      }
    });
};
