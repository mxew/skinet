// commands command

exports.names = ['commands'];
exports.handler = function(data, args) {
  var commandList = "My commands are: ";
  for (var i=0; i<bot.commands.length; i++){
    commandList += "/" + bot.commands[i].names[0];
    var lastone = bot.commands.length - 1;
    if (i !== lastone) commandList += ", ";
  }
  jqbx.sendChat(commandList);
};
