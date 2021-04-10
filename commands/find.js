// find command

exports.names = ['find'];
exports.handler = function(data, args) {
  if (args) {
    var name = args.trim();
    var niceref = firebase.database().ref("people");
    var ppl = [];
    niceref.orderByChild('username').equalTo(name).once("value")
      .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          var childData = childSnapshot.val();
          childData.userid = key;
          ppl.push(childData);
        });

        niceref.orderByChild('uri').equalTo("spotify:user:" + name).once("value")
          .then(function(snapshot2) {
            snapshot2.forEach(function(childSnapshot2) {
              var key2 = childSnapshot2.key;
              var childData2 = childSnapshot2.val();
              childData2.userid = key2;
              ppl.push(childData2);
            });
            if (!ppl.length) {
              jqbx.sendChat("No results found for " + name + ". This search is case sensitive, so maybe check that.");
            } else {
              var spotifyname = ppl[0].uri.slice(13, ppl[0].uri.length);
              if (ppl[0].username == "Unknown") ppl[0].username = ppl[0].uri.replace("spotify:user:", "");
              jqbx.sendChat(ppl[0].username + " was last seen in " + ppl[0].roomTitle + " " + moment(ppl[0].lastSeen).fromNow() + ".");
              if (ppl.length > 1) {
                var morethings = ppl.length - 1;
                jqbx.sendMessage("There are " + morethings + " additional results for " + name + ": https://thompsn.com/jqbx/directory/?q=" + encodeURIComponent(name));
              }
            }
          });

      });

  } else {
    jqbx.sendChat("who are you trying to find ?");
  }
};
