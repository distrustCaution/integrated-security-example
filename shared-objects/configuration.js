let example = require('../src/example_server');
var requestPromise = require('request-promise');
var expect = require('chai').expect;

module.exports = {
    request : requestPromise,
    port: 3000,
    server: null,
    baseUri : "http://localhost:"+this.port,
    startServer : async function(port){
        if(port) this.port = port;
        await example.start(this.port);
        this.baseUri = "http://localhost:"+this.port;
    },
    stopServer : function() {
        example.server.close();
        this.server = null;
        this.baseUri = null;
    },
    createAccount : async function(accountData, baseUri){
        if(!baseUri) baseUri = this.baseUri
        var result = await this.request({
            method :  'POST',
            uri : baseUri+"/api/account/",
            body :  accountData,
            json :  true
        });
        expect(result.message).to.not.be.null;
        return result;
    }

}