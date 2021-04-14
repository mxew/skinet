// trigger list

exports.names = ['triggers'];
exports.handler = function(data, args) {
  var getTriggers = firebase.app("bot").database().ref("triggers");
  getTriggers.once("value")
    .then(function(snap) {
      var data = snap.val();
      console.log(data);
      if (data) {
        var allTriggers = "The triggers are: ";
        for (var key in data){
          if (data.hasOwnProperty(key)){
            allTriggers += "/" + key + ", ";
          }
        }
        jqbx.sendChat(allTriggers.slice(0,-2), true);
      } else {
        jqbx.sendChat("No triggers.", true);
      }
    });
};
