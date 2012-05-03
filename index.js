var variety = require('fs').readFileSync(__dirname +'/lib/variety.js', 'utf8');
var mongo = require('mongodb');

var checkResults = function (collection, expected, callback) {
    collection.find().toArray(function (err, data) {

        var foundItem, key, type, errors = [], exItem;

        while(data.length) {
            foundItem = data.pop();

            key = foundItem._id.key;
            type = foundItem.value.type || foundItem.value.types;

            if(key === '_id') {
                break;
            }

            if(typeof type == 'string') {
                type = [type];
            }

            if(typeof expected[key] !== 'undefined') {
                // Check that the types are right.
                exItem = expected[key];

                if(exItem.types) {
                    for(var i = 0; i < exItem.types.length; i++) {
                        var extype = exItem.types[i];
                        if(typeof extype !== 'string') {
                            exItem.types[i] = varietyTypeOf(extype);
                        }
                    }

                    for(var j = 0; j < type.length; j++) {
                        var acttype = type[j];
                        if(exItem.types.indexOf(acttype) == -1){
                            errors.push('Bad type for key: "'+key+'" - "'+acttype+'" was expecting one of ' + JSON.stringify(exItem.types));
                        }
                    }
                }

                delete expected[key];
            } else {
                errors.push('Found unexpected key: "' + key + '" of type(s) ' + JSON.stringify(type))
            }
        }

        for (var k in expected) {
            if(expected.hasOwnProperty(k)){
                exItem = expected[k];
                if(typeof exItem.optional === 'undefined' || !exItem.optional){
                    errors.push('Expected item not found in collection: "'+k + '"');
                }
            }
        }

        if(!errors.length) {
            errors = null;
        }

        callback(errors, data);
    });
}

var varietyTypeOf = function (thing) {
    if(typeof thing === "undefined") {
        throw "varietyTypeOf() requires an argument";
    }

    if(typeof thing !== "object") {
        return typeof thing;
    } else {
        if(thing && thing.constructor === Array) {
            return "array";
        } else if(thing === null) {
            return "null";
        } else {
            return "object";
        }
    }
}

module.exports = {
    validate:function (collection, expected, callback) {
        if(!collection) {
            callback(new Error('You must supply a collection'));
            return;
        }

        if(!expected) {
            callback(new Error('You must supply an expected schema'));
            return;
        }

        var db = collection.db;

        var evalStr = "var collection = '" + collection.collectionName + "'; " + variety;

        db.eval(evalStr, function (err, result) {
            if(err) {
                callback(err, result);
                return;
            }

            // Now load the results
            var resultsDB = db.db('varietyResults')
            resultsDB.collection(collection.collectionName + 'Keys', function (err, resultsCollection) {
                checkResults(resultsCollection, expected, function (err, data) {
                    callback(err, data);
                });
            });
        });

    }
}