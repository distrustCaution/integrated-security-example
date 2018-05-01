import { escape } from 'querystring';

/*
    TUTORIAL PART 1: 
    Any comment that starts with "TUTORIAL" contains instructions
    Your mission: Find SQLi bugs using the existing integration tests
*/

let chai = require('chai');
let server = require('../../src/example_server');
var expect = require('chai').expect;
const http = require('http');
var requestPromise = require('request-promise');
var helpers = require("./helper_methods")

/*
    TUTORIAL PART 2:
    First we create a list of SQL Injection escapes
    This list can get long, so I would normally put it in another file
*/

sqliEscapes = [
    {
        name: "single quote left open",
        start: "1' ",
        end: ""
    },
    {
        name: "single quote open with comment",
        start: "1'",
        end: "--"
    },
    {
        name: "single quote closed",
        start: "1' ",
        end: "'"
    },
    {
        name: "comment then line break",
        start: "-- \n",
        end: ""
    }
]

/* 
    TUTORIAL PART 3:
    Iterate through all the SQLi escapes and see if the test runs as normal
    The assertion to make sure that there is no injection, is if the test can run without breaking even with an escape character like a single quote.
    Testers can reuse this to ensure they don't have any new sqli bugs in new controllers
*/
sqliEscapes.forEach(function(escapeSequence){
    /*
        TUTORIAL PART 4:
        We have a function that generates a payload for us called 'getPayload'
    */
    var getPayload = function(str){
        return escapeSequence.start + str +escapeSequence.end;
    }
    /*
        TUTORIAL PART 5:
        It is always good to change the description so you know what is happening
    */
    describe("API with sqli attempts with "+escapeSequence.name, function(){
        before(async function(){
            await helpers.startServer();
        });
        
        /*
            TUTORIAL PART 6:
            Go through this test, and on user input, you should change it to:
            'getPayload("foo")'
        */
        describe("User", function(){
            var user = {
                // username: "user1",
                username: getPayload("user1"), // TUTORIAL: I'll do this one for you
                password: "somepassword",
            };
            var token;
            it("should be able to make a user", async function(){
                var result = await helpers.request({
                    method: 'POST',
                    uri:helpers.baseUri+"/api/account/",
                    body: user,
                    json: true
                })
                expect(result.message).to.not.be.null;
            });

            it("should be able to login the user", async function(){
                token = await helpers.request({
                    method: 'POST',
                    uri:helpers.baseUri+"/api/login",
                    body: user,
                    json: true
                })
                .then((res) => {
                    expect(res.Token).to.be.a('string');
                    expect(res.Token.length).to.be.greaterThan(0);
                    return res.Token;
                })
                .catch((err) => {
                    expect(err).to.be.null;
                    return null;
                })
            });

            it("should be NOT able to read the user without a good login token", async function(){
                await helpers.request({
                    method: 'GET',
                    uri:helpers.baseUri+"/api/account/"+user.username,
                    headers:{
                        'Token':'foobar'
                    },
                    json: true
                })
                .then(function(res){
                    expect(res).to.be.null                
                })
                .catch(function(err){
                    expect(err.statusCode).to.equal(400);
                });
            });

            it("should be able to read the user with login token", async function(){
                expect(token).to.be.a('string'); //Verify we have a token
                await helpers.request({
                    method: 'GET',
                    uri:helpers.baseUri+"/api/account/"+user.username,
                    headers:{
                        'Token': token
                    },
                    json: true
                })
                .then(function(res){
                    expect(res.username).to.equal(user.username);
                    expect(res.id).to.be.a('number');
                    return res;              
                })
                .catch(function(err){
                    expect(err.statusCode).to.be.null;
                });
            });
        });

        describe("Notes", function(){
            var user1 = {
                "username": "user1!",
                "password": "user1hasasecurepassword"
            }
            var note = {
                title:"foo",
                data: "bar baz"
            }
            before(async function(){
                await helpers.createAccount(user1);
                user1.token = await helpers.getLoginToken(user1);
            });

            it('should be able to make a note', async function(){
                note.id = await helpers.request({
                    method: 'POST',
                    uri: helpers.baseUri+"/api/note",
                    headers : {
                        Token: user1.token
                    },
                    body: note,
                    json: true
                })
                .then((res) => {
                    expect(res).to.not.be.null;
                    expect(res.id).to.be.a('number');
                    return res.id;
                })
                .catch((err) => {
                    expect(err).to.be.null;
                });
            });

            it('should have the note in all notes', async function(){
                expect(note.id).to.be.a('number');
                var result = await helpers.request({
                    method: 'GET',
                    uri: helpers.baseUri+"/api/note",
                    headers : {
                        Token: user1.token
                    },
                    json: true
                });

                filteredNotes = result.filter(function(n) { return n.title == note.title});//filter down to the right note
                expect(filteredNotes.length).to.equal(1);
                expect(filteredNotes[0].title).to.equal(note.title);
                expect(filteredNotes[0].id).to.be.a('number');
            })

            it('should be able to get a note', async function(){
                expect(note.id).to.be.a('number');
                var result = await helpers.request({
                    method: 'GET',
                    uri: helpers.baseUri+"/api/note/"+note.id,
                    headers : {
                        Token: user1.token
                    },
                    json: true
                });

                expect(result.data).to.equal(note.data);
                expect(result.title).to.equal(note.title);
            });

            it('should be able to update a note', async function(){
                expect(note.id).to.be.a('number');
                var newNote = {
                    title : "woooohooo!",
                    data : "LOREM IPSUM FTW!"
                }
                var update = await helpers.request({
                    method: 'PUT',
                    uri: helpers.baseUri+"/api/note/"+note.id,
                    headers : {
                        Token: user1.token
                    },
                    body : newNote,
                    json: true
                }).then((res) => {
                    expect(res).to.not.be.null;
                })
                .catch((err) => {
                    expect(err).to.be.null;
                });

                var result = await helpers.request({
                    method: 'GET',
                    uri: helpers.baseUri+"/api/note/"+note.id,
                    headers : {
                        Token: user1.token
                    },
                    json: true
                }).then(function(res){
                    return res;
                })
                .catch(function(err){
                    return err;
                });
                expect(result.data).to.equal(newNote.data);
                expect(result.title).to.equal(newNote.title);
                expect(result.data).to.not.equal(note.data);
                expect(result.title).to.not.equal(note.title);
            });

        });

        describe("Sharing", function(){
            var note = {
                title: "myTitle",
                data: "myData"
            };

            var alice = {
                "username": "alice",
                "password": "alicePassword",
            };

            var bob = {
                "username": "bob",
                "password": "bobPassword",
            };

            before(async function(){
                //make two users
                await helpers.createAccount(alice);
                alice.token = await helpers.getLoginToken(alice);

                await helpers.createAccount(bob);
                bob.token = await helpers.getLoginToken(bob);
            });
            
            beforeEach(async function(){
                //user one makes a note
                note.id = await helpers.request({
                    method: 'POST',
                    uri: helpers.baseUri+"/api/note",
                    headers : {
                        Token: alice.token
                    },
                    body: note,
                    json: true
                })
                .then((res) => {
                    expect(res).to.not.be.null;
                    expect(res.id).to.be.a('number');
                    return res.id;
                })
                .catch((err) => {
                    expect(err).to.be.null;
                });
            });

            it("should NOT be able to read other's notes", async function(){
                expect(note.id).to.be.a('number');
                var result = await helpers.request({
                    method: 'GET',
                    uri: helpers.baseUri+"/api/note/"+note.id,
                    headers : {
                        Token: bob.token
                    },
                    json: true
                })
                .then(function(res){
                    expect(res.statusCode).to.equal(404);
                })
                .catch(function(err){
                    expect(err.statusCode).to.equal(404);
                });
            });

            it("should be able to read other's notes after they share it", async function(){
                expect(note.id).to.be.a('number');

                bob.id = await helpers.request({
                    method: 'GET',
                    uri:helpers.baseUri+"/api/account/"+bob.username,
                    headers:{
                        'Token': alice.token
                    },
                    json: true
                })
                .then(function(res){
                    expect(res.username).to.equal(bob.username);
                    expect(res.id).to.be.a('number');
                    return res.id;              
                })
                .catch(function(err){
                    expect(err.statusCode).to.be.null;
                }); 

                expect(bob.id).to.be.a('number');

                var share = await helpers.request({
                    method: 'PUT',
                    uri: helpers.baseUri+"/api/note/"+note.id+"/share",
                    headers : {
                        Token: alice.token
                    },
                    body: bob,
                    json : true               
                })
                .then(function(res){
                    return res;
                })
                .catch(function(err){
                    expect(err).to.be.null;
                })

                var result = await helpers.request({
                    method: 'GET',
                    uri: helpers.baseUri+"/api/note/"+note.id,
                    headers : {
                        Token: bob.token
                    },
                    json: true
                })
                .then(function(res){
                    return res;
                })
                .catch(function(err){
                    expect(err).to.be.null;
                    return err;
                });
                expect(result.data).to.equal(note.data);
                expect(result.title).to.equal(note.title);
            });
        });

        after(function(){
            helpers.stopServer()
        });
    });
});