// const { Before, Given, When, Then } = require('cucumber')
// const selenium_cucumber = require("selenium-cucumber-js");

// var webdriver = require("selenium-webdriver");
// const {Builder, By, Key, until} = require('selenium-webdriver');
// var requestPromise = require('request-promise');
// var expect = require('chai').expect;
let example = require('../src/example_server');

module.exports = function () {
    var sleep = function(ms){
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    var fill_element = function(elementName, str, locator, waitTime){
        if(!waitTime) waitTime = 1000
        if(!locator) locator = 'id'
        return driver.wait(until.elementLocated(by[locator](elementName)),waitTime)
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
        shared.configuration.startServer().then(async function(){
            console.log('Server started on port '+shared.configuration.port);
            await sleep(2000);
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
    var executeArrayOfFunctions = async function(actions){
        if(intermediateActions.length == 0) return null;
        for(var i = 0; i < actions.length; i++){
            await actions[i]();
        }
        return null;
    }
    var users = {};
    var notes = {};
    this.BeforeScenario(function(scenario, done) {
        users = {};
        notes = {};
        intermediateActions = [];
        afterScenarioAssertions = [];
        done();
    });
    
    this.Given(/^The user named "([^"]*)" with username "([^"]*)" with password "([^"]*)"$/, function(name, username, password){
        var user = {
            username: username,
            password: password
        }
        users[name] = user;
        return shared.configuration.createAccount(user)
    });

    this.Given(/^The note named "([^"]*)" with the title "([^"]*)" and the content "([^"]*)"$/, function(name, title, content){
        var note = {
            title: title,
            content: content
        }
        notes[name] = note;
    })

    this.AfterStep(async function(step){
        await executeArrayOfFunctions(intermediateActions);
    })
    
    var afterScenarioAssertions = [];
    // add after scenario hook
    // this.AfterScenario(async function(scenario) {
    //     await executeArrayOfFunctions(afterScenarioAssertions);
    //     // done();
    // });

    // for demonstration and security

    this.Given(/Wait ([^"]*) seconds? between steps/, async function(int1){
        var ms = parseFloat(int1)*1000
        intermediateActions.push(async function(){await driver.sleep(ms)})
        return null;
    });

    // SECURITY CHECKS

    this.Given(/^Check for external scripts$/, function(done){
        intermediateActions.push(async function(){
            /* 
                javascript incantation to find scripts not loaded from the same origin 
                using window.performance.getEntries() 
            */
            var script = "return window.performance.getEntries().filter((el) => (el.initiatorType == 'script' && !RegExp('^'+window.location.origin).test(el.name)))"
            var result;
            try {
                result = await driver.executeScript(script);
            } catch(e){
                // console.log(e);
                result = null;
            }
            if(result && result.length > 0){
                result.forEach((err)=> {

                    afterScenarioAssertions.push(async function(){
                        expect(err.name, "A script was loaded externally from "+err.name).to.be.null;
                    });
                });
            }


        });

        done();
    });

    this.Given(/^Check for the evaluated angular expression "([^"]*)"$/, function(number,done){
        intermediateActions.push(async function(){
            /* 
                Search the DOM for the angular payload
            */
            var html;
            try {
                html = await driver.executeScript("return document.body.innerHTML");
            } catch(e){
                html = null;
            }
            if(html && html.length > 0){
                afterScenarioAssertions.push(async function(){
                    expect(html.indexOf(number.toString()), "The evaluated angular expression "+number+" appeared in the html").to.equal(-1);
                });
            }
        });
        done();
    });

    
    this.Given(/^Check for the evaluated xss expression "([^"]*)"$/, async function(number, done){
        intermediateActions.push(async function(){
            /* 
                Search the logs for the XSS payload
            */
            var logs;
            try {
                logs = await driver.manage().logs().get(selenium.logging.Type.BROWSER);
            } catch(e){
                logs = null;
            }
            if(logs && logs.length > 0){
                logs.forEach((item)=> {
                    if (item.message.indexOf(number.toString()) > -1){
                        afterScenarioAssertions.push(async function(){
                            expect(item.message, "The XSS payload "+number+" appeared in the logs").to.be.null;
                        });
                    }
                });
            }
        });
        done();
    });

    this.Then(/I check security/, async function(){
        await executeArrayOfFunctions(afterScenarioAssertions); 
    });

    // SECURITY CHECKS

    this.Given(/the account named "([^"]*)" with password "([^"]*)"/, function(username, password){
        return shared.configuration.createAccount({
            username: username,
            password: password
        })
    });

    this.When(/^I am on the ([^"]*) page$/, async function(page){
        await helpers.loadPage(shared.configuration.baseUri+"/"+page);
        await sleep(1000);
        return await driver.executeScript("window.stop();")
    });

    this.When(/^I login as "([^"]*)" with password "([^"]*)"$/, async function(username, password){
        await fill_element('username', username, 'name',10000)
        await fill_element('password', password, 'name',10000)
        var element = await driver.findElement(by.id('login'))
        return await element.click();
    });

    this.When(/^I login as "([^"]*)"$/, async function(name){
        var user = users[name]
        await fill_element('username', user.username, 'name',10000)
        await fill_element('password', user.password, 'name',10000)
        var element = await driver.findElement(by.id('login'))
        return await element.click();
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

    this.Then(/^I should see the "([^"]*)" element containing note named "([^"]*)" "([^"]*)"$/, function (elementId, name, part) {
        var text = notes[name][part];
        return driver.wait(until.elementLocated(by.id(elementId)),1000)
        .then(function(){
            driver.findElement(by.id(elementId))
            .then(async function(element){
                var actual = await element.getText()
                expect(actual).to.contain(text);
            })
        })
    });

    this.Then(/^I should see the "([^"]*)" element containing "([^"]*)" of user "([^"]*)"$/, function (elementId, part, name) {
        var text = users[name][part];
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

    this.Then(/^I should see the name of "([^"]*)" up top$/, function(name){
        var user = users[name];
        return driver.wait(until.elementLocated(by.id("welcomeText")),1000)
        .then(function(){
            driver.findElement(by.id("welcomeText"))
            .then(async function(element){
                var actual = await element.getText()
                expect(actual).to.contain(user.username);
            })
        })
    });

    this.When(/^I click on the link with the text "([^"]*)"$/, function(text){
        return helpers.getFirstElementContainingText('a',text)
        .then(function(element){
            return element.click();
        });
    });

    this.When(/^I click on the link with the note named "([^"]*)" title$/, function (name) {
        var text = notes[name]['title'];
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
    this.When(/^I fill in "([^"]*)" with note named "([^"]*)" "([^"]*)"$/, async function(id, name, part){
        var string = notes[name][part];
        await clear_element(id);
        return await fill_element(id, string);
    });

    this.When(/^I clear and fill in "([^"]*)" with the "([^"]*)" of user "([^"]*)"$/, async function (id, part, name) {
        var string = users[name][part];
        await clear_element(id);
        return await fill_element(id, string);
      });
    
};