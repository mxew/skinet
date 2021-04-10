// test command

exports.names = ['test', 'test2'];
exports.handler = function(data, args) {
  console.log(data);
  jqbx.sendChat("good test "+data.name);
};
