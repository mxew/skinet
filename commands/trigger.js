// trigger add

exports.names = ['trigger'];
exports.handler = function(data, args) {
  if (args && jqbx.getRole(data.uri) > 0) {
    var trigger = args.substr(0, args.indexOf(" "));
    var response = args.substr(args.indexOf(" ") + 1);
    if (trigger && response) {
      var newtrigger = firebase.app("bot").database().ref("triggers/" + trigger);
      newtrigger.set(response);
      jqbx.sendChat("OK. /"+trigger+" does "+response+" now.");
    }
  }
};
