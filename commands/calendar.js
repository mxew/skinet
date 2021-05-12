// calendar command

exports.names = ['today'];
exports.handler = function(data, args) {
  request({
    headers: {
      'Teamup-Token': process.env.TEAMUP_KEY
    },
    method: 'GET',
    url: 'https://api.teamup.com/' + process.env.TEAMUP_CALID + '/events'
  }, function cbfunc(error, response, body) {
    //If call returned correctly, continue
    if (!error && response.statusCode == 200) {
      if (body) {
          try{
            var formatted = JSON.parse(body);
            if (formatted.events.length){
              var response = ":calendar: " + formatted.events.length + " things happening today: ";
              for (let i = 0; i < formatted.events.length; i ++){
                response += "<br>" + formatted.events[i].title + " (" + moment(formatted.events[i].start_dt).fromNow() + ")";
              }
              jqbx.sendChat(response, true);
            } else {
              jqbx.sendChat("i do not think there are any things happening today probably");
            }
          } catch (e){
            console.log(e);
            jqbx.sendChat("either nothing is happening today or i do not know how to read");
          }
      }
    }
  });
};
