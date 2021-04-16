// gift command

exports.names = ['gift'];
exports.handler = function(data, args) {
  var giftAmount = 1;
  if (args) {
    var amt = parseInt(args);
    if (Number.isInteger(amt)) {
      giftAmount = amt;
    }
  }
  if (!bot.song) {
    jqbx.sendChat("i just got here and dont know who the dj is right now hold on thanks.");
  } else if (giftAmount <= 0){
    jqbx.sendChat("that's a terrible gift");
  } else {
    var coinRef = firebase.app("bot").database().ref("bank/" + data.uri);
    coinRef.once("value")
      .then(function(snap) {
        var info = snap.val();
        var bal = 0;
        if (info) {
          bal = info.bal;
        }
        var balAfter = bal - giftAmount;
        if (balAfter >= 0) {
          // begin gift
          coinRef.set({
            name: data.name,
            bal: balAfter
          });

          var coinRef2 = firebase.app("bot").database().ref("bank/" + bot.song.userUri);
          coinRef2.once("value")
            .then(function(snap2) {
              var info2 = snap2.val();
              var bal2 = 0;
              if (info2) {
                bal2 = info2.bal;
              }
              var newAmount = bal2 + giftAmount;
              coinRef2.set({
                name: bot.song.username,
                bal: newAmount
              });

              jqbx.sendChat(data.name + " has gifted " + giftAmount + " mrdrcoin to DJ " + bot.song.username + "!");

            });
        } else {
          jqbx.sendChat(data.name + " you don't have enough mrdrcoin to gift.");
        }
      });
  }

};
