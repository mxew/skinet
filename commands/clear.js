// clear command

exports.names = ['clear'];
exports.handler = function(data, args) {
    if (jqbx.getRole(data.uri) > 0) {
      for (let i = 0; i < 100; i++){
        setTimeout(function(){ jqbx.sendChat(" <br>"); }, 500);
      }
      jqbx.sendChat("Cleared.");
    }
};
