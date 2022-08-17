// dog command

exports.names = ['dog'];
exports.handler = function(data, args) {
  request('https://api.thedogapi.com/v1/images/search', function cbfunc(error, response, body) {
    //If call returned correctly, continue
    if (!error && response.statusCode == 200) {
      if (body) {
        try {
          var formatted = JSON.parse(body);
          var response = "yes hello " + data.name + " is this your dog?: " + formatted[0].url;
          jqbx.sendChat(response);
        } catch (e) {
          console.log(e);
          jqbx.sendChat(data.name + ", dog error");
        }
      }
    }
  });
};
