// bal command

  exports.names = ['bal'];
  exports.handler = function(data, args) {
    var coinRef = firebase.app("bot").database().ref("bank/"+data.uri);
    coinRef.once("value")
      .then(function(snap) {
        var info = snap.val();
        var bal = 0;
        if (info){
          bal = info.bal;
        }
        jqbx.sendChat(data.name + " you have "+bal+" mrdrcoin.");
      });
};
