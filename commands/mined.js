// mined command

exports.names = ['mined'];
exports.handler = function(data, args) {
  var coinRef = firebase.app("bot").database().ref("bank");
  coinRef.once("value")
    .then(function(snap) {
      var info = snap.val();
      var coins = 0;
      var accounts = 0;
      for (var key in info) {
        accounts++;
        if (info[key].bal) coins = coins + info[key].bal;
      }
      jqbx.sendChat("it looks like " + coins + " total mrdrcoin have been mined so far, and " + accounts + " total bank accounts have been opened.");
    });

};
