// const { Before, Given, When, Then } = require('cucumber')
// const selenium_cucumber = require("selenium-cucumber-js");

// var webdriver = require("selenium-webdriver");
// const {Builder, By, Key, until} = require('selenium-webdriver');
// var requestPromise = require('request-promise');
// var expect = require('chai').expect;
let example = require('../src/example_server');

module.exports = function () {
    var sleep = function(seconds){
        return new Promise(resolve => setTimeout(resolve, seconds));
    }

    var fill_element = function(elementName, str, locator){
        if(!locator) locator = 'id'
        return driver.wait(until.elementLocated(by[locator](elementName)),1000)
        .then(function(){
            return driver.findElement(by[locator](elementName));
        })
        .then(function(element){
            return element.sendKeys(str);
        });
    };

    var clear_element = function(elementName, locator){
        if(!locator) locator = 'id'
        return driver.wait(until.elementLocated(by[locator](elementName)),1000)
        .then(function(){
            return driver.findElement(by[locator](elementName));
        })
        .then(async function(element){
            await element.sendKeys(selenium.Key.CONTROL,"a");
            return await element.sendKeys(selenium.Key.DELETE);
        });
    };
    // add a before feature hook
    this.BeforeFeature(function(feature, done) {
        // await example.start(shared.configuration.port);
        shared.configuration.startServer().then(function(){
            console.log('Server started on port '+shared.configuration.port);
            done();
        });
    });
    
    // add an after feature hook
    this.AfterFeature(function(feature, done) {
        shared.configuration.stopServer();
        done();
    });
    
    // add before scenario hook
    var intermediateActions = [];
    var executeIntermediateActions = async function(){
        if(intermediateActions.length == 0) return null;
        for(var i = 0; i < intermediateActions.length; i++){
            await intermediateActions[i]();
        }
        return null;
    }
    this.BeforeScenario(function(scenario, done) {
        intermediateActions = [];
        done();
    });

    this.AfterStep(async function(step){
        await executeIntermediateActions();
    })
    
    // add after scenario hook
    this.AfterScenario(function(scenario, done) {
        done();
    });

    // for demonstration and security

    this.Given(/Wait ([^"]*) seconds between steps/, async function(int1){
        var ms = parseFloat(int1)*1000
        intermediateActions.push(async function(){console.log("adsf");await driver.sleep(ms)})
        return null;
    });

    this.Given(/Check for external scripts/, async function(){
        var ms = parseFloat(int1)*1000
        intermediateActions.push(async function(){console.log("adsf");await driver.sleep(ms)})
        return await sleep(10);
    });



    this.Given(/the account named "([^"]*)" with password "([^"]*)"/, function(username, password){
        return shared.configuration.createAccount({
            username: username,
            password: password
        })
    });

    this.When(/I login as "([^"]*)" with password "([^"]*)"/, function(username, password){

        return helpers.loadPage(shared.configuration.baseUri+"/login").then(async function(){
            await fill_element('username', username, 'name')
            await fill_element('password', password, 'name')
            var element = await driver.findElement(by.id('login'))
            return await element.click();
        });
    });

    this.Then(/I should see the "([^"]*)" element$/, function(elementId){
        return driver.wait(until.elementLocated(by.id(elementId)),1000);
    });

    this.Then(/I should see the "([^"]*)" element containing "([^"]*)"$/, function(elementId, text){
        return driver.wait(until.elementLocated(by.id(elementId)),1000)
        .then(function(){
            driver.findElement(by.id(elementId))
            .then(async function(element){
                var actual = await element.getText()
                expect(actual).to.contain(text);
            })
        })
    });

    this.Then(/Sleep ([^"]*)/, function(int1){
        // helps for presentations/debugging
        var seconds = 1000*parseInt(int1);
        return sleep(seconds);
    });

    this.Then(/^I should see ([^"]*) note on the notes page$/, function(int1){
        var num = parseInt(int1);
        return driver.findElements(by.className('notelink'))
            .then(function(elements){
               expect(elements.length).to.equal(num)
            });
    });

    this.Then(/^I should see the name "([^"]*)" up top$/, function(name){
        return driver.wait(until.elementLocated(by.id("welcomeText")),1000)
        .then(function(){
            driver.findElement(by.id("welcomeText"))
            .then(async function(element){
                var actual = await element.getText()
                expect(actual).to.contain(name);
            })
        })
    });

    this.When(/^I click on the link with the text "([^"]*)"$/, function(text){
        return helpers.getFirstElementContainingText('a',text)
        .then(function(element){
            return element.click();
        });
    });

    this.When(/^I click on "([^"]*)"$/, function(string1){
        return driver.findElement(by.id(string1))
        .then(function(element){
            return element.click();
        });
    });
    this.When(/^I click on "([^"]*)" found by "([^"]*)"$/, function(string1, finder){
        return driver.findElement(by[finder](string1))
        .then(function(element){
            return element.click();
        });
    });
    this.When(/^I clear and fill in "([^"]*)" with "([^"]*)"$/, async function(id, string){
        await clear_element(id);
        return await fill_element(id, string);
    });
};