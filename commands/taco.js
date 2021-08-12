// taco command

exports.names = ['taco'];
exports.handler = function(data, args) {
  request('http://taco-randomizer.herokuapp.com/random/', function cbfunc(error, response, body) {
    //If call returned correctly, continue
    if (!error && response.statusCode == 200) {
      if (body) {
        try {
          var formatted = JSON.parse(body);
          if (formatted.shell) {
            jqbx.sendChat(":taco: yes ok hello "+data.name+", your taco today features "+formatted.base_layer.name+" with "+formatted.mixin.name+", garnished with "+formatted.condiment.name+", topped off with "+formatted.seasoning.name+", and wrapped in delicious "+formatted.shell.name+". https://taco-randomizer.herokuapp.com/"+formatted.base_layer.slug+"/"+formatted.mixin.slug+"/"+formatted.condiment.slug+"/"+formatted.seasoning.slug+"/"+formatted.shell.slug+"/");
          } else {
            jqbx.sendChat(data.name + ", i think i am out of tacos");
          }
        } catch (e) {
          console.log(e);
          jqbx.sendChat(data.name + ", there might be a taco emergency at the taco factory...");
        }
      }
    } else {
      console.log(error);
    }
  });
};
