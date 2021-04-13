// ratio command

exports.names = ['ratio'];
exports.handler = function(data, args) {
    jqbx.sendChat("Current ratio: " + jqbx.voteRatio().toFixed(2) + " | After one more downvote: " + jqbx.voteRatio(true).toFixed(2));
};
