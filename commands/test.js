// test command

exports.names = ['test', 'test2'];
exports.handler = function(data, args) {
  jqbx.removeDJ(data.uri);
};
