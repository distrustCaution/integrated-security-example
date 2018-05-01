/*
    TUTORIAL 1: 
    Any comment that starts with "TUTORIAL" contains instructions
    Your mission: Find Angular Injection using the existing integration tests
*/

var webdriver = require("selenium-webdriver");
const {Builder, By, Key, until} = require('selenium-webdriver');
var expect = require('chai').expect;
let server = require('../../src/example_server');
let helpers = require('./helper_methods');
var requestPromise = require('request-promise');

/*
    TUTORIAL 2:
    We need away to store our payloads.
    The easiest thing we can do is have an array of payloads
*/
var payloads = [];

/* 
    TUTORIAL 3:
    Create a function that generates an Angular injection such as:
    {{2*2}}
    It should generate two random numbers of at least 4 digits
    It should take in one variable such that:
    angularInjection("foo") => "foo{{2*2}}"
    And it should push the result (4) to the array

    Note, we don't want to use 'alert' since that will stop test execution if it is unexpected
*/

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var angularInjection = function(string)
{
    var randomNumber1 = getRandomInt(1000,10000); //generate two random numbers
    var randomNumber2 = getRandomInt(1000,10000);
    var evaluatedPayload = randomNumber1*randomNumber2;//find the result of the product of the two numbers
    var payload = string+"{{"+randomNumber1+"*"+randomNumber2+"}}";//create an angular payload using the two numbers

    payloads.push(evaluatedPayload); // add the evaluated payload to the array

    return payload;
}

describe("UI test to share an item ", function(){
    var driver;

    /*
        TUTORIAL PART 4:
        We need to create a function that will verify if our payload executed. 
        To check for this, we need to look in the HTML body in the DOM.
        Create a function called 'checkPayloads' that verifies this.
        Hint: to get the DOM, execute the script:
        return document.body.innerHTML
    */

    var checkPayloads = async function(){
        var dom = await driver.executeScript("return document.body.innerHTML");;// get the dom
        // iterate through the payloads and assert if they are found in the dom
        payloads.forEach((payload) => {
            if(dom.indexOf(payload) != -1)
            {
                expect(
                    payload, 
                    "Angular injection was found."
                ).to.be.null;
            }
        });
    }

    helpers.onSleep = checkPayloads; // make this function happen on sleep

    /*
        TUTORIAL PART 5: 
        We need to use our function 'angularInjection' to add payloads around our tests.
        Go through the tests, and add our payload generator, I'll do one for you :)
    */

    var fooUser = {"username":angularInjection("Foo"),"password":angularInjection("foo")};
    var barUser = {"username":angularInjection("Bar"),"password":angularInjection("bar")};

    var note = {"title":angularInjection("my note title!!"), "data":angularInjection("my note itself. ")};

    
    before(async function(){
        await helpers.startServer();
    });

    after(function(){
        if(driver && driver.quit) driver = driver.quit();
        server.server.close();        
    });
    
    helpers.longTest('should start the driver', async function(){
        driver = await helpers.startDriver(); 
    });

    helpers.longTest('should let you make users via the api', async function(){
        var fooResult = await helpers.createAccount(fooUser)
        var barResult = await helpers.createAccount(barUser)
    })

    helpers.longTest('should let you log in', async function(){

        helpers.goToLogin();
        await helpers.sleep();
        var result = await driver.wait(webdriver.until.elementLocated(webdriver.By.name('username')));
        await helpers.sleep();
        var username = await driver.findElement(webdriver.By.name("username"));
        username.sendKeys(fooUser.username);
        await helpers.sleep();
        var password = await driver.findElement(webdriver.By.name("password"));
        password.sendKeys(fooUser.password);
        await helpers.sleep();
        var submit = await driver.findElement(By.id("login"));
        submit.click();
        await helpers.sleep();
        await driver.wait(webdriver.until.elementLocated(webdriver.By.id('allNotesTitle')));
        await helpers.sleep(); 

    });

    helpers.longTest('should let you make a note', async function(){
        
        var newNote = await driver.findElement(By.id("newNote"));
        newNote.click();

        await helpers.sleep();

        await driver.wait(webdriver.until.elementLocated(webdriver.By.id('notetitle')));

        await helpers.sleep();

    });

    helpers.longTest('should let you change the note', async function(){
        
        var notetitle = await driver.findElement(webdriver.By.id("notetitle"));
        await notetitle.sendKeys(Key.CONTROL,"a");
        await notetitle.sendKeys(Key.DELETE);
        await notetitle.sendKeys(note.title);
        
        await helpers.sleep();

        var notebody = await driver.findElement(webdriver.By.id("notebody"));
        await notebody.sendKeys(Key.CONTROL,"a");
        await notebody.sendKeys(Key.DELETE);
        await notebody.sendKeys(note.data);

        await helpers.sleep();        

        var saveButton = await driver.findElement(By.id("saveButton"));
        saveButton.click();

        await helpers.sleep();

        notebody = await driver.findElement(webdriver.By.id("notebody")).getText().then((text) => {
          return text
        });

        expect(notebody).to.equal(note.data);

        notetitle = await driver.findElement(webdriver.By.id("notetitle")).getText().then((text) => {
            return text
        });
  
        expect(notetitle).to.equal(note.title);
        
    });

    helpers.longTest('should let you share a note with someone', async function(){
        var share = await driver.findElement(By.id("share"));
        await share.sendKeys(barUser.username);
        var shareButton = await driver.findElement(By.id("shareButton"));
        var a = await shareButton.click();
        await helpers.sleep();
        await driver.executeScript("document.getElementById(\"shareButton\").click()");
        await helpers.sleep();
        var shareResult = await driver.findElement(webdriver.By.id("shareresult")).getText().then((text) => {
            return text
        });
        await helpers.sleep();
        expect(shareResult).to.include('Successfully');
        await helpers.sleep();
        
    });

    helpers.longTest('should have the shared note on the other user\'s page', async function(){

        helpers.goToLogin();
        await helpers.sleep();
        var result = await driver.wait(webdriver.until.elementLocated(webdriver.By.name('username')));
        await helpers.sleep();
        var username = await driver.findElement(webdriver.By.name("username"));
        username.sendKeys(barUser.username);
        await helpers.sleep();
        var password = await driver.findElement(webdriver.By.name("password"));
        password.sendKeys(barUser.password);
        await helpers.sleep();
        var submit = await driver.findElement(By.id("login"));
        submit.click();
        await helpers.sleep();
    });
    
    helpers.longTest('should be accessible to the other user', async function(){ 

        var item = await driver.executeScript("return Array.from(document.querySelectorAll('a')).find(el => el.textContent === '"+note.title+"');")
        await helpers.sleep();
        await item.click();
        await helpers.sleep();

        var notebody = await driver.findElement(webdriver.By.id("notebody")).getText().then((text) => {
            return text
        });
        expect(notebody).to.equal(note.data);
        await helpers.sleep();

        var notetitle = await driver.findElement(webdriver.By.id("notetitle")).getText().then((text) => {
            return text
        });
        expect(notetitle).to.equal(note.title);
        await helpers.sleep();

    });

});