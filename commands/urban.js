// urban command

exports.names = ['urban'];
exports.handler = function(data, args) {
    if (args){
      request('https://api.urbandictionary.com/v0/define?term='+encodeURIComponent(args), function cbfunc(error, response, body) {
        //If call returned correctly, continue
        if (!error && response.statusCode == 200) {
          if (body) {
            try {
              var formatted = JSON.parse(body);
              if (formatted.list.length){
                jqbx.sendChat(formatted.list[0].word + ": " + formatted.list[0].definition + "<br><br>Example: "+formatted.list[0].example, true);
              } else {
                jqbx.sendChat(data.name + ", i dont know what "+args+" is thanks");
              }
            } catch (e) {
              console.log(e);
              jqbx.sendChat(data.name + ", pretty sure urban dict is mad at me for something.");
            }
          }
        } else {
          console.log(error);
        }
      });
    }
};
