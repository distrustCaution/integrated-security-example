/*
    TUTORIAL PART 1: 
    Any comment that starts with "TUTORIAL" contains instructions
    Your mission: Use ZAP passive on an existing integration test
*/

var webdriver = require("selenium-webdriver");
const {Builder, By, Key, until} = require('selenium-webdriver');
var expect = require('chai').expect;
let server = require('../../src/example_server');
let helpers = require('./helper_methods');
var requestPromise = require('request-promise');


/*
    TUTORIAL PART 2: 
    Start up zap, and then get the url for the proxy
*/
var proxyUri = ""

/*
    TUTORIAL PART 3: 
    This test uses two tools that we can proxy: an http client and a selenium web driver.
    In most cases, you want to research how the tester sets up the client, and then choose your own proxy.
    In this case, I'll do it for you, you just need to add the proxy uri
*/
helpers.request = requestPromise.defaults(
    {'proxy':""}
);

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
        /*
            TUTORIAL PART 4: 
            We need to use selenium as well. 
            This should be a quick google search away on how to set up the proxy/capabilities.
            After finding out how to do that, please return here and set up the proxy.
        */
        //With proxy
        var capabilities = {
            'browserName': 'chrome',
            'proxy': {
                //Fill in here
            }
        }
        driver = await helpers.startDriver(capabilities); 
        /*
            TUTORIAL PART 5: 
            After the proxy is set up properly, try running the test.
            You should see all the requests in ZAP history.
            Then, go to Results -> Generate HTML report to get passive scan results.
        */
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