/*
    TUTORIAL PART 1: 
    Any comment that starts with "TUTORIAL" contains instructions
    Your mission: Use the integration test to find out if we load external scripts
*/

var webdriver = require("selenium-webdriver");
const {Builder, By, Key, until} = require('selenium-webdriver');
var expect = require('chai').expect;
let server = require('../../src/example_server');
let helpers = require('./helper_methods');
var requestPromise = require('request-promise');



describe("UI test to share an item ", function(){
    var driver;

    var fooUser = {"username":"Foo","password":"foo"};
    var barUser = {"username":"Bar","password":"bar"};

    var note = {"title":"my note title!!", "data":"my note itself. "};

    var findExternalScripts = async function(driver){
        /*
            TUTORIAL PART 2: 
            Modify this function to assert only when it is a script and it comes from outside of the host site
        */
        if(!driver) return;
        var script = "return window.performance.getEntries();"
        var result = await driver.executeScript(script);
        if(result.length > 0){
            result.forEach((err)=> {
                if() //modify it here to check for the right source and type
                {
                    expect(err.name, "A script was loaded externally from "+err.name).to.be.empty;
                }
            });
        }
    }
    
    before(async function(){
        /*
            TUTORIAL PART 3:
            In this case, I have it check every time it sleeps 
        */
        helpers.onSleep = findExternalScripts; 
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