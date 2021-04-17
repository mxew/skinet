// mrdrcoin command

exports.names = ['mrdrcoin'];
exports.handler = function(data, args) {
  var coinRef = firebase.app("bot").database().ref("bank").orderByChild("bal").limitToLast(10);
  coinRef.once("value")
    .then(function(snap) {
      var info = snap.val();
      var rank = 0;
      for (var keys in info){
        rank++;
      }
      var arry = [];
      snap.forEach(function(childSnapshot) {
        var key = childSnapshot.key;
        var childData = childSnapshot.val();
        arry.push("#" + rank + " " + childData.name + " (" + childData.bal + ")");
        rank--;
      });
      arry.reverse();
      jqbx.sendChat(":bank: mrdrcoin TOP 10: " + arry.join(" | "));
    });
};
