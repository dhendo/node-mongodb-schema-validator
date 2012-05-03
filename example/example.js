var mongo = require('mongodb');
var validator = require('../index.js');
var testCollection = null;

var client = new mongo.Db('node_mongo_schema_tester_example', new mongo.Server("127.0.0.1", 27017));
client.open(function (err, db) {
    testCollection = db.collection('exampleCollectionName');
    runExample();
});

var runExample = function () {
    testCollection.remove({});

    // Set up some test people
    var people = [];
    people.push({name:'Alice', age:29, hasCar:true, optionalProperty:42, multiTypes:"aString", nested:{inner:'value'}})
    people.push({name:'Bob', age:32, hasCar:true, multiTypes:33})

    testCollection.insert(people, function () {

        // Now we can run the validator against the data

        // Lets set some expectations
        var expectations = {
            name:{types:["string"]}, // Can use type names
            age:{types:[1]}, // or an instance of the type (other than for string)
            optionalProperty:{optional:true}, // Can specify a property as optional, and also not specify a type
            multiTypes:{types:["string", "number", "object"]},
            nested:{optional:true}, // Optional outer
            "nested.inner":{types: ["string"]} // We can ensure we have inner properties too
        }

        validator.validate(testCollection, expectations, function (err, data) {
            // We should now get one errors about hasCar:
            require('eyes').inspect(err, "errors");
            testCollection.drop();
            client.close();
            process.exit();
        });
    });
}

