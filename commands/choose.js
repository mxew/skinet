// choose command

exports.names = ['choose'];
exports.handler = function(data, args) {
  if (args) {
    var list = args.split(", ");
    if (list.length > 1) {
      jqbx.sendChat(data.name + " i am calculating the best option out of the " + list.length + " you provided. Your ticket # is " + data.id + " please stay on the line thanks.");
      var choice = list[Math.floor(Math.random() * list.length)];
      var seconds = Math.floor(Math.random() * 120) + 1;
      setTimeout(function() {
        jqbx.sendChat("TICKET #"+data.id+" [RESOLVED]: "+choice);
      }, 1000 * seconds);
    } else {
      jqbx.sendChat("feed me more options thanks (example: /choose ham, bacon, something else)");
    }
  }
};
