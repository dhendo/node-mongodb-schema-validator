var should = require('should');
var mongo = require('mongodb');
var validator = require('../index.js');
var testCollection = null;
var client = null;
suite('The validator', function () {
    suiteSetup(function (done) {

        client = new mongo.Db('node_mongo_schema_tester_tests', new mongo.Server("127.0.0.1", 27017));
        client.open(function (err, db) {
            should.not.exist(err);
            testCollection = db.collection('node_mongo_schema_tester_tests');
            should.exist(testCollection);
            done();
        });
    });

    setup(function (done) {
        if(testCollection) {
            testCollection.remove(function () {
                done();
            });
        } else {
            done();
        }
    });

    test('should exist', function (done) {
        should.equal(typeof validator, 'object')
        should.equal(typeof validator.validate, 'function')
        done();
    });
    test('should run and callback', function (done) {
        validator.validate(null, null, function (err, data) {
            done();
        })
    });

    test('should return an error if no collection supplied', function (done) {
        validator.validate(null, null, function (err, data) {
            should.exist(err);
            err.message.should.eql('You must supply a collection')
            done();
        });
    });

    test('should return an error if no expectations supplied', function (done) {
        validator.validate({}, null, function (err, data) {
            should.exist(err);
            err.message.should.eql('You must supply an expected schema')
            done();
        });
    });

    test('should return error collection with empty expectations and data', function (done) {

        testCollection.insert({test:'a'}, function () {

            validator.validate(testCollection, {}, function (err, data) {
                should.exist(err);
                err.should.have.length(1);
                var error = err[0];
                error.should.equal('Found unexpected key: "test" of type(s) ["string"]');
                done();
            });
        });
    });

    test('should return ok with matching expectations and data', function (done) {
        testCollection.insert({test:'a'}, function () {
            validator.validate(testCollection, {test:{types:["string"]}}, function (err, data) {
                should.not.exist(err);
                done();
            });

        });
    });

    test('should return error with matching wrong type', function (done) {
        testCollection.insert({test:'a'}, function () {
            validator.validate(testCollection, {test:{types:[1, {}, []]}}, function (err, data) {
                should.exist(err);
                err.should.have.length(1);
                var error = err[0];
                error.should.equal('Bad type for key: "test" - "string" was expecting one of ["number","object","array"]');
                done();
            });
        });
    });

    test('should return error with unmet expectation', function (done) {
        testCollection.insert({test:'a'}, function () {
            validator.validate(testCollection, {test:{types:["string"]}, missing:{}}, function (err, data) {
                should.exist(err);
                err.should.have.length(1);
                var error = err[0];
                error.should.equal('Expected item not found in collection: "missing"');
                done();
            });
        });
    });

    test('should not return error with an optional unmet expectation', function (done) {
        testCollection.insert({test:'a'}, function () {
            validator.validate(testCollection, {test:{types:["string"]}, missing:{optional:true}}, function (err, data) {
                should.not.exist(err);
                done();
            });
        });
    });

    test('should return ok with complex data', function (done) {
        var doc = {test:'a', outer:{inner:{veryInner:42}}};
        var expectation = {
            test:{types:["string"]},
            outer:{types:[{}]},
            "outer.inner":{types:[{}]},
            "outer.inner.veryInner":{types:["number"]}
        };

        testCollection.insert(doc, function () {
            validator.validate(testCollection, expectation, function (err, data) {
                should.not.exist(err);
                done();
            });
        });
    });

});


