'use strict';
module.exports.node_env = function() {
  return process.env.NODE_ENV;
};

module.exports.name = function() {
  return process.env.name;
};