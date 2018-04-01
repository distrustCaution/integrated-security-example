let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../example_server/example_server');
let sql = require('../example_server/example_models');

var expect = require('chai').expect;
const http = require('http');
var request = require('request');
var rp = require('request-promise');


chai.use(chaiHttp);
// require('superagent-proxy')(chai.request.Test);

const port = 8000;
const baseUri = "http://localhost:"+port

var proxyUri = "http://localhost:8080"

var r = rp.defaults({'proxy':proxyUri});
// var r = rp;

// Eve, our attacker
var eve = {
    "username": "eve",
    "password": "evilPassword",
};

describe("API with authorization bypass attempts", function(){
    before(async function(){
        await server.start(port);


        //make eve's account
        await r({
            method: 'POST',
            uri:baseUri+"/api/account",
            body: eve,
            json: true
        });
        //get an authentication token for eve (NOT authorization)
        eve.token = await r({
            method: 'POST',
            uri:baseUri+"/api/login",
            body: eve,
            json: true
        })
        .then((res) => {
            return res.Token;
        })
        .catch(function(err){
            expect(err.statusCode).to.be.null;
        });
        //get eve's account id
        eve.id = await r({
            method: 'GET',
            uri:baseUri+"/api/account/"+eve.username,
            headers:{
                'Token': eve.token
            },
            json: true
        })
        .then(function(res){
            expect(res.username).to.equal(eve.username);
            expect(res.id).to.be.a('number');
            return res.id;              
        })
        .catch(function(err){
            expect(err.statusCode).to.be.null;
        });
        expect(eve.id).to.be.a('number');
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

        it('the victim should be able to make a note', async function(){ //this is essentially a preparation step
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

        it('should NOT have the note in all notes', async function(){
            expect(note.id).to.be.a('number');
            var result = await r({
                method: 'GET',
                uri: baseUri+"/api/note",
                headers : {
                    Token: eve.token //change to the attacker
                },
                json: true
            });
            filteredNotes = result.filter(function(n) { return n.title == note.title});//filter down to the right note
            expect(result.length).to.equal(0); //change the assertion
        })

        it('should NOT be able to get a note', async function(){
            expect(note.id).to.be.a('number');
            var result = await r({
                method: 'GET',
                uri: baseUri+"/api/note/"+note.id,
                headers : {
                    Token: eve.token //change to the attacker
                },
                json: true
            })
            .then(function(res){
                return res;
            })
            .catch(function(err){
                expect(err.statusCode).to.equal(404);//add an assertion 
            });
        });

        it('should be NOT able to update a note', async function(){
            expect(note.id).to.be.a('number');
            var newNote = {
                title : "woooohooo!",
                data : "LOREM IPSUM FTW!"
            }
            var update = await r({
                method: 'PUT',
                uri: baseUri+"/api/note/"+note.id,
                headers : {
                    Token: eve.token //change to the attacker
                },
                body : newNote,
                json: true
            }).then((res) => {
                expect(res).to.be.null; //change the assertion
            })
            .catch((err) => {
                expect(err).to.not.be.null; //change the assertion
            });

            var result = await r({ //this should not happen
                method: 'GET',
                uri: baseUri+"/api/note/"+note.id,
                headers : {
                    Token: user1.token // leave the same to see what happens
                },
                json: true
            }).then(function(res){
                return res;
            })
            .catch(function(err){
                return err;
            });
            expect(result.data).to.not.equal(newNote.data); //change the assertion
            expect(result.title).to.not.equal(newNote.title); //change the assertion
            expect(result.data).to.equal(note.data); //change the assertion
            expect(result.title).to.equal(note.title); //change the assertion
        });

        it('should be NOT able to update a note and read it', async function(){ //sometimes repeating is good
            expect(note.id).to.be.a('number');
            var newNote = {
                title : "woooohooo!",
                data : "LOREM IPSUM FTW!"
            }
            var update = await r({
                method: 'PUT',
                uri: baseUri+"/api/note/"+note.id,
                headers : {
                    Token: eve.token //change to the attacker
                },
                body : newNote,
                json: true
            }).then((res) => {
                expect(res).to.be.null; //change the assertion
            })
            .catch((err) => {
                expect(err).to.not.be.null; //change the assertion
            });

            var result = await r({ //this should not happen
                method: 'GET',
                uri: baseUri+"/api/note/"+note.id,
                headers : {
                    Token: eve.token //change to the attacker
                },
                json: true
            })
            .then(function(res){
                return res;
            })
            .catch(function(err){
                return err;
            });

            expect(result.data).to.not.equal(newNote.data); //change the assertion
            expect(result.title).to.not.equal(newNote.title); //change the assertion
            // expect(result.data).to.equal(note.data); //remove the assertion since eve shouldn't read it
            // expect(result.title).to.equal(note.title); //remove the assertion since eve shouldn't read it
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
                uri: baseUri+"/api/note/"+note.id,
                headers : {
                    Token: eve.token //change to the attacker
                },
                json: true
            })
            .then(function(res){
                expect(res.statusCode).to.equal(404); //this test does do authz checks so we can keep the assertions
            })
            .catch(function(err){
                expect(err.statusCode).to.equal(404); //this test does do authz checks so we can keep the assertions
            });
        });

        it("should NOT be able to share it with someone else", async function(){
            expect(note.id).to.be.a('number');

            bob.id = await r({
                method: 'GET',
                uri:baseUri+"/api/account/"+bob.username,
                headers:{
                    'Token': eve.token
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
                uri: baseUri+"/api/note/"+note.id+"/share",
                headers : {
                    Token: eve.token //change to the attacker
                },
                body: bob,
                json : true               
            })
            .then(function(res){
                expect(res).to.be.undefined;
                return res;
            })
            .catch(function(err){
                expect(err.statusCode).to.be.not.null; //change assertion
                return err; 
            })

            var result = await r({
                method: 'GET',
                uri: baseUri+"/api/note/"+note.id,
                headers : {
                    Token: bob.token // don't change for this example
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

            expect(result.data).to.not.equal(note.data); //change assertion
            expect(result.title).to.not.equal(note.title); //change assertion
        })

        it("should NOT be able to share it with yourself if you don't own it", async function(){
            expect(note.id).to.be.a('number');

            // bob is no longer needed for this test

            // bob.id = await r({
            //     method: 'GET',
            //     uri:baseUri+"/api/account/"+bob.username,
            //     headers:{
            //         'Token': eve.token
            //     },
            //     json: true
            // })
            // .then(function(res){
            //     expect(res.username).to.equal(bob.username);
            //     expect(res.id).to.be.a('number');
            //     return res.id;              
            // })
            // .catch(function(err){
            //     expect(err.statusCode).to.be.null;
            // }); 

            // expect(bob.id).to.be.a('number');

            var share = await r({
                method: 'PUT',
                uri: baseUri+"/api/note/"+note.id+"/share",
                headers : {
                    Token: eve.token //change to the attacker
                },
                body: eve, // attacker attempts to steal it directly
                json : true               
            })
            .then(function(res){
                return res;
            })
            .catch(function(err){
                return err; 
            })

            var result = await r({
                method: 'GET',
                uri: baseUri+"/api/note/"+note.id,
                headers : {
                    Token: eve.token // change to the attacker
                },
                json: true
            })
            .then(function(res){
                return res;
            })
            .catch(function(err){
                return err;
            });

            expect(result.data).to.not.equal(note.data); //change assertion
            expect(result.title).to.not.equal(note.title); //change assertion
        });
    });

    after(function(){
        server.server.close();
    });
});