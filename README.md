node-mongo-schema-tester
========================

Use variety.js to validate the schema found in a mongodb collection using node.

Node-mongo-schema-tester allows you to perform some actions against a mongo database, then test the shape of the resulting data against a set of expectations.

For example if you have a collection of people, you can check that all of the objects contain a field "name" and that they are all strings.


Usage
=====

First you need to have a handle to a mongo collection:

```
var testCollection;
var client = new mongo.Db('collectionName', new mongo.Server("127.0.0.1", 27017));
client.open(function (err, db) {
  testCollection = db.collection('node_mongo_schema_tester_tests');
});
```

Now lets put some test data in:

```
 var people = [];
    people.push({name:'Alice', age:29, hasCar:true, optionalProperty:42, multiTypes:"aString", nested:{inner:'value'}})
    people.push({name:'Bob', age:32, hasCar:true, multiTypes:33})

    testCollection.insert(people);
```

We can define a set of expectations in the form:

```
{'keyName': {types : ['string', 'number'], optional : true}
{'outerObject': {types : ['string', 'number'], optional : true}
```

and run it against the database:

```
validator.validate(testCollection, expectations, function (err, data) {});
```

The callback will return a list of errors if there are any unexpected keys or they have wrong data types e.g.

    errors: [ 'Found unexpected key: "hasCar" of type(s) ["boolean"]' ]

