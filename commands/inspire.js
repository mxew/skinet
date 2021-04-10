// inspire command

exports.names = ['inspire'];
exports.handler = function(data, args) {
  request('https://inspirobot.me/api?generate=true', function cbfunc(error, response, body) {
    //If call returned correctly, continue
    if (!error && response.statusCode == 200) {
      if (body) {
        jqbx.sendChat(body);
      }
    }
  });
};
