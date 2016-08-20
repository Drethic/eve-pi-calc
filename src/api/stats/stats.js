'use strict';
module.exports.node_env = function() {
  return process.env.NODE_ENV;
};

module.exports.node_port = function() {
  return process.env.PORT;
};