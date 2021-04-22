// hay command

exports.names = ['hay'];
exports.handler = function(data, args) {
  if (args) {
    var roomString = args.substr(0, args.indexOf(" "));
    var messageString = args.substr(args.indexOf(" ") + 1);
    if (roomString && messageString) {
      jqbx.getRoom(roomString, function(formatted) {
        if (formatted) {

          // do they have a bot?
          var hasBot = false;
          for (let i = 0; i < formatted.users.length; i++) {
            if (formatted.users[i].device == "bot") hasBot = true;
          }

          if (formatted.visibility == "private") {
            jqbx.sendChat("WALKIE TALKIE SIGNAL CAN NOT REACH PRIVATE ROOMS OOPS THANKS.");
          } else if (hasBot && !formatted.banned.includes(bot.user.uri)) {
            var sendTo = formatted._id;
            if (sendTo == bot.roomid) {
              jqbx.sendChat("ANTI FEEDBACK LOOP SYSTEMS HAVE BEEN ACTIVATED. THREAT ELIMINATED.");
            } else {
              // ALL CONDITIONS MET. SEND WALKIE TALKIE MESSAGE
              jqbx.sendMessage("Message sent to " + formatted.title + ".");

              jqbx.sendChat(messageString, false, {
                sendAsName: data.name + " (" + bot.roomName + ")",
                sendTo: sendTo
              });
              jqbx.sendMessage("Message from " + bot.roomName + ". Reply with /hay " + bot.roomSlug + " your message", {
                sendTo: sendTo
              });
            }
          } else {
            jqbx.sendChat(formatted.title + " can't receive walkie talkie message at this time!");
          }
        } else {
          jqbx.sendChat("I don't know what room that is. Their room-id will be the part after /join/ in their url.");
        }
      });
    } else {
      jqbx.sendChat("To use the walkie talkie, type /hay room-id (the part after app.jqbx.fm/join/ in their url) followed by some sort of message.");
    }
  } else {
    jqbx.sendChat("To use the walkie talkie, type /hay room-id some sort of message.");
  }
};
