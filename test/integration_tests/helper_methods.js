//copy of helper methods

var webdriver = require("selenium-webdriver");
const {Builder, By, Key, until} = require('selenium-webdriver');
var requestPromise = require('request-promise');
var expect = require('chai').expect;
let example = require('../../src/example_server');

var helperMethods = function(){

    this.request =  requestPromise;
    this.port =  3000;
    this.standardTimeout = 2000;
    this.driver  =  null;
    this.server =  null;
    this.testTimeout = this.standardTimeout * 20;
    this.baseUri = null
    this.onSleep = null;

    this.startDriver = async function(capabilities) {
        if(!capabilities) capabilities = webdriver.Capabilities.chrome()
        this.driver = await new webdriver.Builder()
            .withCapabilities(capabilities) 
            .build();
        
        return this.driver;
    }
    this.stopDriver = function() {
        if(this.driver && this.driver.quit) this.driver = this.driver.quit();
    }

    this.createAccount = async function(accountData, baseUri){
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

    this.getLoginToken = async function(user){
        token = await this.request({
            method: 'POST',
            uri:this.baseUri+"/api/login",
            body: user,
            json: true
        })
        .then((res) => {
            return res.Token;
        })
        .catch((err) => {
            return err;
        });
        return token;
    }
    
    /**
     * Sleeps for a certain number of milliseconds
     * @param {number} ms 
     */
    this.sleep = function(ms) {
        if(!ms) ms = this.standardTimeout;
        if(this.onSleep) this.onSleep();
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.startServer = async function(port){
        if(port) this.port = port;
        await example.start(this.port);
        this.baseUri = "http://localhost:"+this.port;
    }
    this.stopServer = function() {
        example.server.close();
        this.server = null;
        this.baseUri = null;
    }

    this.goToLogin = function(driver) {
        if(!driver) driver = this.driver;
        driver.get(this.baseUri+"/login");
    }

    this.longTest = function(message,func){
        it(message,func).timeout(this.testTimeout);
    }
    
}

module.exports = new helperMethods();