var mocha = require('mocha');
var expect = require('chai').expect;
var models = require('../../src/example_models');

describe('Example models', function(){
    before(async function(){
        var synced = await models.sync();
        expect(synced).to.equal(true);
    });
    describe('User', function(){
        var userName = 'bob';
        var password = 'dobalina';

        before(async function(){
            var user = await models.scripts.createUser(userName,password,'admin');
        });

        it("should login a user", async function(){
            var jwt = await models.scripts.loginUser(userName,password);
            expect(jwt).to.not.equal(false);
            var data = models.scripts.readJwt(jwt).data;
            expect(data.username).to.equal(userName);
        });

        it("should not login a user with the wrong password", async function(){
            var notLoggedIn = await models.scripts.loginUser(userName,password+"foo");
            expect(notLoggedIn).to.equal(false);
        });

        it("should not login a user that does not exist", async function(){
            var notExist = await models.scripts.loginUser(userName+"foo",password);
            expect(notExist).to.equal(false);
        });

    });
}); 