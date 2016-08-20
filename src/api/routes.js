module.exports = (function() {
    'use strict';
    var router = require('express').Router();
    var stats = require('./stats/stats');

    router.get('/', function(req, res) {
        res.json({ message: 'hooray! welcome to our api!' });
    });

    router.get('/stats', function(req, res) {
      res.json({ node_env: stats.node_env });
    });

    return router;
})();
