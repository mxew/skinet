// FUN CHECK command

exports.names = ['check'];
exports.handler = function(data, args) {
  jqbx.getUser(data.uri, function(formatted) {
    if (formatted.disableConfetti) {
      jqbx.sendChat(data.name + " hates fun.");
    } else {
      jqbx.sendChat(data.name + " does not hate fun.");
    }
  });
};
