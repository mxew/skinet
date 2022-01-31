// mrdrcoin command

exports.names = ['mrdrcoin', 'mc'];
exports.handler = function(data, args) {
  var limit = 10;
  if (args){
    var num = parseInt(args);
    console.log(num)
    if (num){
      if (num <= 100 & num > 0){
        limit = num;
      }
    }
  }
  var coinRef = firebase.app("bot").database().ref("bank").orderByChild("bal").limitToLast(limit);
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
      var collapseOrNot = false;
      if (limit > 15) collapseOrNot = true;
      jqbx.sendChat(":bank: mrdrcoin TOP "+limit+": " + arry.join(" | "), collapseOrNot);
    });
};
