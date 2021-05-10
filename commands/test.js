// test command

exports.names = ['test', 'test2'];
exports.handler = function(data, args) {
  let isDjing = false;
  for (let i = 0; i<bot.djs.length; i++){
    if (bot.djs[i].uri == data.uri){
      isDjing = true;
      break;
    }
  }
  if (isDjing){
    jqbx.removeDJ(data.uri);
  } else {
    jqbx.sendChat(data.name + ", bad test thanks");
  }
};
