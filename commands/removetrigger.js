// trigger remove

exports.names = ['removetrigger'];
exports.handler = function(data, args) {
  if (!process.env.GUEST_BOT) {
    if (args && jqbx.getRole(data.uri) > 0) {
      var trigger = firebase.app("bot").database().ref("triggers/" + args);
      trigger.once("value")
        .then(function(snap) {
          var data = snap.val();
          if (data) {
            trigger.remove();
            jqbx.sendChat("OK. /" + args + " is gone now.");
          }
        });
    }
  } else {
    jqbx.sendChat("i can't");
  }
};
