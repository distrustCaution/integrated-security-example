// This example is not ready yet

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/example_server');
var expect = require('chai').expect;
var should = require('chai').should();
const http = require('http');
const ProxyAgent = require('proxy-agent');
var request = require('request');
var rp = require('request-promise');
const baseTester = require('../../base_tester');
const sequelize = require('sequelize');


chai.use(chaiHttp);
// require('superagent-proxy')(chai.request.Test);

const port = 8000;
const baseUri = "http://localhost:"+port

var proxyUri = "http://localhost:8080"

// var r = request.defaults({'proxy':proxyUri});
var r = rp.defaults({'proxy':proxyUri});
// var r = rp;

//normally sqli would be in it's own module, but I want to show it all in one place
    sqliEscapes = [
        {
            name: "no escape sequence, just a value",
            start: "1 ",
            end: ""
        },
        {
            name: "no escape sequence, just a value",
            start: "1 ",
            end: ""
        },
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
            name: "single quote with 'and statement' ",
            start: "1' and 1=1 ",
            end: ""
        },
        {
            name: "single quote with 'or statement' ",
            start: "1' or 1=1 ",
            end: ""
        },
        {
            name: "single quote closed",
            start: "1' ",
            end: "'"
        },
        {
            name: "single quote closed with comment",
            start: "1'",
            end: "' --"
        },
        {
            name: "comment then line break",
            start: "-- \n",
            end: ""
        },
        {
            name: "single quote, comment, then line break",
            start: "1'-- \n",
            end: ""
        },
        {
            name: "back-tick, comment, then line break",
            start: "`-- \n",
            end: ""
        },
        {
            name: "double quote left open", //not going to work, but interesting to iterate
            start: "\" ",
            end: ""
        }
    ]
    var checkForSqli = async function(holdingArray, value){
        // some test environments have access to the database!!
        // var tables = await 
        // server.database.query("SELECT name FROM sqlite_master WHERE type='table';", { type: sequelize.QueryTypes.SELECT})
        // .then((result) => {return result})
        // .catch((err) => {return err});
        // console.log(tables);
        holdingArray.forEach(function(name){

        }, this);
    }


// iterate through each sqli escape sequence
sqliEscapes.forEach(function(escapeSequence){
    var arrayOfNames = []; //have a place to store all the new table names
    var getPayload = function(){
        number = baseTester.randomNumber(5);
        arrayOfNames.push(number);
        return escapeSequence.start + 'union select '+number+' '+escapeSequence.end;
    }


    describe("API with sqli attempts with "+escapeSequence.name, function(){
        before(async function(){
            var examplePayload = getPayload();
             console.log("Example payload: "+examplePayload);
            expect(examplePayload).to.be.a('string'); //creates a payload
            expect(arrayOfNames.length).to.be.greaterThan(0);//adds a payload
            await server.start(port);
        });
        
        describe("User", function(){
            var user = {
                username: getPayload(), //generate payload here
                password: "somepassword",
            };
            var token;
            it("should be able to make a user", async function(){
                var result = await r({
                    method: 'POST',
                    uri:baseUri+"/api/account/",
                    body: user,
                    json: true
                })
                expect(result.message).to.not.be.null;
            });

            it("should be able to login the user", async function(){
                token = await r({
                    method: 'POST',
                    uri:baseUri+"/api/login",
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
                await r({
                    method: 'GET',
                    uri:baseUri+"/api/account/"+user.username,
                    headers:{
                        'Token':getPayload() //arbitrary token payload
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
                await r({
                    method: 'GET',
                    uri:baseUri+"/api/account/"+user.username,
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
                "username": getPayload(),
                "password": getPayload()
            }
            var note = {
                title: getPayload(),
                data: getPayload()
            }
            before(async function(){
                await r({
                    method: 'POST',
                    uri:baseUri+"/api/account",
                    body: user1,
                    json: true
                });
                user1.token = await r({
                    method: 'POST',
                    uri:baseUri+"/api/login",
                    body: user1,
                    json: true
                })
                .then((res) => {
                    return res.Token;
                });
            });

            it('should be able to make a note', async function(){
                note.id = await r({
                    method: 'POST',
                    uri: baseUri+"/api/note",
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
                var result = await r({
                    method: 'GET',
                    uri: baseUri+"/api/note",
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
                var result = await r({
                    method: 'GET',
                    uri: baseUri+"/api/note/"+note.id,
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
                    title : getPayload(),
                    data : getPayload()
                }
                var update = await r({
                    method: 'PUT',
                    uri: baseUri+"/api/note/"+note.id,
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

                var result = await r({
                    method: 'GET',
                    uri: baseUri+"/api/note/"+note.id,
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
                title: getPayload(),
                data: getPayload()
            };

            var alice = {
                "username": getPayload(),
                "password": getPayload(),
            };

            var bob = {
                "username": getPayload(),
                "password": getPayload(),
            };

            before(async function(){
                //make two users
                await r({
                    method: 'POST',
                    uri:baseUri+"/api/account",
                    body: alice,
                    json: true
                })
                alice.token = await r({
                    method: 'POST',
                    uri:baseUri+"/api/login",
                    body: alice,
                    json: true
                })
                .then((res) => {
                    return res.Token;
                });

                await r({
                    method: 'POST',
                    uri:baseUri+"/api/account",
                    body: bob,
                    json: true
                })

                bob.token = await r({
                    method: 'POST',
                    uri:baseUri+"/api/login",
                    body: bob,
                    json: true
                })
                .then((res) => {
                    return res.Token;
                });
            });
            
            beforeEach(async function(){
                //user one makes a note
                note.id = await r({
                    method: 'POST',
                    uri: baseUri+"/api/note",
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
                var result = await r({
                    method: 'GET',
                    uri: baseUri+"/api/note/"+getPayload(),
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

                bob.id = await r({
                    method: 'GET',
                    uri:baseUri+"/api/account/"+bob.username,
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

                var share = await r({
                    method: 'PUT',
                    uri: baseUri+"/api/note/"+getPayload()+"/share",//try with sqli
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
                    expect(err).to.not.be.null;
                })

                var share = await r({
                    method: 'PUT',
                    uri: baseUri+"/api/note/"+note.id+"/share",
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

                var result = await r({
                    method: 'GET',
                    uri: baseUri+"/api/note/"+note.id,
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
            server.server.close();
        });
    });
})
