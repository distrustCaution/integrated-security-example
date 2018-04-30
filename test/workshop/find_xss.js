/*
    TUTORIAL PART 1: 
    Any comment that starts with "TUTORIAL" contains instructions
    Your mission: Find XSS using the existing integration tests
*/

var webdriver = require("selenium-webdriver");
const {Builder, By, Key, until} = require('selenium-webdriver');
var expect = require('chai').expect;
let server = require('../../src/example_server');
let helpers = require('./helper_methods');
var requestPromise = require('request-promise');


/*
    TUTORIAL PART 2:
    We need away to store and find our payloads.
    The easiest thing we can do is have an array of payloads
*/
var payloads = [];

/* 
    TUTORIAL PART 3:
    Create a function that called 'createXSS' that generates an XSS payload such as:
    <script>console.error(1234)</script>
    It should take in one variable such that:
    createXSS("foo") => <script>console.error("foo")</script>
    It should also store it into the payloads structure

    Note, we don't want to use 'alert' since that will stop test execution if it is unexpected
*/
 
var createXSS = function(string)
{
    var payload = '';// create your payload here
    payloads.push(payload); // let's save the payload
    return payload;
}

/*
    TUTORIAL PART 4:
    We need to create a function that will verify if our payload executed. 
    To check for this, we need to look in the log area in chrome.
    Create a function called 'checkPayloads' that verifies this.
*/

var checkPayloads


describe("UI test to share an item ", function(){
    var driver;
    var fooUser = {"username":"Foo","password":"foo"};
    var barUser = {"username":"Bar","password":"bar"};

    var note = {"title":"my note title!!", "data":"my note itself. "};

    before(async function(){
        await helpers.startServer();
    });

    after(function(){
        if(driver && driver.quit) driver = driver.quit();
        server.server.close();        
    });
    
    helpers.longTest('should start the driver', async function(){
        //Without proxy
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