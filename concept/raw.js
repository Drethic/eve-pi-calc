var https = require('https');
var fs = require('fs');
var crest = 'crest-tq.eveonline.com';

var itemCache = [];
var marketGroups = {};
var rawPlanetMap = {};

/*
{ '2073': 'Microorganisms',
  '2267': 'Base Metals',
  '2268': 'Aqueous Liquids',
  '2270': 'Noble Metals',
  '2272': 'Heavy Metals',
  '2286': 'Planktic Colonies',
  '2287': 'Complex Organisms',
  '2288': 'Carbon Compounds',
  '2305': 'Autotrophs',
  '2306': 'Non-CS Crystals',
  '2307': 'Felsic Magma',
  '2308': 'Suspended Plasma',
  '2309': 'Ionic Solutions',
  '2310': 'Noble Gas',
  '2311': 'Reactive Gas' }

 */

function getEveCrest(path, callback) {
    var options = {
        host: crest,
        port: 443,
        path: path,
        method: 'GET'
    };
    var getReq = https.request(options, function(response) {
        response.setEncoding('utf8');

        //incrementally capture the incoming response data
        var body = '';
        response.on('data', function(data) {
            body += data;
        });

        // process the response once it's done
        response.on('end', function() {
            var parsed;
            try {
                parsed = JSON.parse(body);
            } catch (error) {
                console.error('Unalbe to parse response as JSON', error);
                return callback(error);
            }

            // pass back the data if there is no error
            callback(null, parsed);
        });
    });

    getReq.end();
    getReq.on('error', function(error) {
        //handle errors with the request
        console.error('Error with the request: ', error.message);
        callback(error);
    });
}

function getEveMarketGroupByName(name, callback) {
    if (!marketGroups) {
        return callback('marketGroups empty');
    }
    for(var i = 0; i < marketGroups.length; i++) {
        if (name === marketGroups[i].name) {
            return callback(null, marketGroups[i]);
        }
    }
}

function getEveMarketParentGroupById(id, callback) {
    if (!marketGroups) {
        return callback('marketGroups empty');
    }
    var groupWithParent = [];
    for(var i = 0; i < marketGroups.length; i++) {
        if (marketGroups[i].parentGroup && id === marketGroups[i].parentGroup.id) {
            groupWithParent.push(marketGroups[i]);
        }
    }
    return callback(null, groupWithParent);
}

function cacheEveMarketGroups() {
    // getEveCrest('/market/groups/', function(error, response) {
    //     if (error) {
    //         console.log('Cache Market Groups Error: ', error);
    //     }
    //     marketGroups = response.items;
    // });
    fs.readFile('./market-groups-cache.json', 'utf-8', function(error, data) {
        if (error) {
            throw error;
        }
        marketGroups = JSON.parse(data);
    });
}

function cacheEveItems() {
    // var maxPage = 31;
    // var callback = function(error, response) {
    //     if (error) {
    //         console.log('Cache Items Error: ', error);
    //     }
    //     if (response.pageCount + 1 !== maxPage) {
    //         maxPage = response.pageCount + 1;
    //     }
    //     for (var i = 0; i < response.items.length; i++) {
    //         itemCache.push(response.items[i]);
    //     }
    // };
    // for (var page = 1; page < maxPage; page++) {
    //     getEveCrest('/inventory/types/?page=' + page, callback);
    // }
    fs.readFile('./item-cache.json', 'utf-8', function(error, data) {
        if (error) {
            throw error;
        }
        itemCache = JSON.parse(data);
    });
}

function cacheEveRawPlanetMap() {
    fs.readFile('./raw-planet-map.json', 'utf-8', function(error, data) {
        if (error) {
            throw error;
        }
        rawPlanetMap = JSON.parse(data);
    });
}

function getPiSubMarketGroups(group, callback) {
    getEveCrest(group.types.href.replace('https://' + crest, ''), function(error, response) {
        if (error) {
            return callback(error);
        }
        return callback(null, response.items);
    });
}

function listEvePiMarketGroups() {
    // var rawMaterial = [
    //     "Aqueous Liquids",
    //     "Autotrophs",
    //     "Base Metals",
    //     "Carbon Compounds",
    //     "Complex Organisms",
    //     "Felsic Magma",
    //     "Heavy Metals",
    //     "Ionic Solutions",
    //     "Microorganisms",
    //     "Noble Gas",
    //     "Noble Metals",
    //     "Non-CS Crystals",
    //     "Planktic Colonies",
    //     "Reactive Gas",
    //     "Suspended Plasma"
    // ];
    // var rawMatTypeId = {};
    // for (var rawMatItem = 0; rawMatItem < rawMaterial.length; rawMatItem++) {
    //     for (var cacheItem = 0; cacheItem < itemCache.length; cacheItem++) {
    //         if (rawMaterial[rawMatItem] === itemCache[cacheItem].name) {
    //             rawMatTypeId[itemCache[cacheItem].id] = rawMaterial[rawMatItem];
    //         }
    //     }
    // }
    // console.log(rawMatTypeId);
    // fs.writeFile('./item-cache.json', JSON.stringify(itemCache, null, 4), 'utf-8');
    // fs.writeFile('./market-groups-cache.json', JSON.stringify(marketGroups, null, 4), 'utf-8');
    getEveMarketGroupByName('Planetary Materials', function(error, response) {
        if (error) {
            console.log('Error: ', error);
        }
        getPiSubMarketGroups(response, function(piError, piItems) {
            if (piError) {
                console.log('getPiSubMarketGroups Error: ', piError);
            }
            getEveMarketParentGroupById(response.id, function(err, res) {
                if (err) {
                    console.log('GroupById Error: ', err);
                }
                console.log('Planetary Materials');
                for (var i = 0; i < res.length; i++) {
                    var r0 = false;
                    if (res[i].name === 'Raw Planetary Materials') {
                        r0 = true;
                    }
                    console.log('- ' + res[i].name + ' (P' + i + ')');
                    for (var j = 0; j < piItems.length; j++) {
                        if (res[i].id === piItems[j].marketGroup.id) {
                            console.log('--', piItems[j].type.name);
                            if (r0) {
                                for (var rawMat = 0; rawMat < rawPlanetMap.length; rawMat++) {
                                    if (rawPlanetMap[rawMat].typeID === piItems[j].type.id) {
                                        for (var rawPlanets = 0; rawPlanets < rawPlanetMap[rawMat].planets.length; rawPlanets++) {
                                            for (var planetName = 0; planetName < itemCache.length; planetName++) {
                                                if (itemCache[planetName].id === rawPlanetMap[rawMat].planets[rawPlanets]) {
                                                    console.log('---' + itemCache[planetName].name);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            // getEveCrest(piItems[j].type.href.replace('https://' + crest, ''), function(descErr, descRes) {
                            //     console.log('---' + descRes.description);
                            // });
                        }
                    }
                }
            });
        });
    });
}

cacheEveMarketGroups();
cacheEveRawPlanetMap();
cacheEveItems();
setTimeout(listEvePiMarketGroups, 2000);
