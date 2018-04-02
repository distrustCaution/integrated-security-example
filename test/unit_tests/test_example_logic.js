var mocha = require('mocha');
var expect = require('chai').expect;
var models = require('../../src/example_models');
var logic = require('../../src/example_logic');
var sequelize = require('sequelize');


describe('Example notes', function(){
    before(async function(){
        var synced = await models.sync();
        expect(synced).to.equal(true);
    });
    describe('user functions', function(){
        it('should be able to make a user', async function(){
            var user = { username: 'theUsername', password: 'thePassword'};
            await logic.users.create(user);
            var dbUser = await logic.users.read(user.username);
            expect(dbUser.username).to.equal(user.username);
        });
    });
    describe('note basic functions', function(){
        var userName = 'user';
        var password = 'password';
        var note = {
            title: "foo", data: "bar"
        };
        var note2 = {
            title: "x", data: "y"
        };
        var user, currentNote;
        
        before(async function(){
            user = await models.scripts.createUser(userName,password);
        });

        beforeEach(async function(){
            currentNote = await logic.notes.create(user, note);
        });

        it("should read a note after creation", async function(){
            var readNote = await logic.notes.read(user, currentNote.id)
            expect(readNote.title).to.equal(note.title);
            expect(readNote.data).to.equal(note.data);
        });

        it("should update a note after creation", async function(){
            
            var newNote = await logic.notes.update(note2, currentNote.id);

            var readNote = await logic.notes.read(user, currentNote.id);
            expect(readNote.title).to.equal(note2.title);
            expect(readNote.data).to.equal(note2.data);
        });

        it("should be able to list out notes for a user", async function(){
            var list = await logic.notes.list(user);
            expect(list.length).to.be.greaterThan(0);
            for (var i in list){
                var n = list[i]
                expect(n.title).to.not.be.null;
                expect(n.id).to.not.be.null;
                var readNote = await logic.notes.read(user, n.id)
                expect(readNote.title).to.equal(n.title);
            }
        });
    });
    describe('sharing notes', function(){
        var user1, user2, currentNote;
        var userData1 = {
            username: "fooooo",
            password: "bar"
        };
        var userData2 = {
            username: "foo2",
            password: "bar2"
        };
        var note = {
            title: "amazing", data: "thing"
        };

        before(async function(){
            user1 = await models.scripts.createUser(userData1.username,userData1.password);
            user2 = await models.scripts.createUser(userData2.username,userData2.password);
        });

        beforeEach(async function(){
            currentNote = await logic.notes.create(user1,note);
        });

        it("the note should be able to be shared to another user -- AUTHZ demo", async function(){

            var readNote = await logic.notes.read(user1, currentNote.id);
            expect(readNote).to.not.equal(undefined);
            // other user can't read note
            var cantRead = await logic.notes.read(user2, currentNote.id);
            expect(cantRead).to.equal(undefined);
            // authz bypass 
            await logic.notes.share(user2, currentNote.id, "owner");
            var canRead = await logic.notes.read(user2, currentNote.id);
            expect(canRead).to.not.equal(undefined);
            expect(canRead.title).to.equal(note.title);
            expect(canRead.data).to.equal(note.data);
        });

        it("unauthorized user can edit the note -- AUTHZ demo", async function(){
            // other user can't read note
            var cantRead = await logic.notes.read(user2, currentNote.id);
            expect(cantRead).to.equal(undefined);

            var note2 = {title: "hacked", data: "foobar!"};
            var newNote = await logic.notes.update(note2, currentNote.id);
            
            var readNote = await logic.notes.read(user1, currentNote.id);
            expect(readNote.title).to.equal(note2.title);
            expect(readNote.data).to.equal(note2.data);

        });
    });

    // describe('example blind sqli for the DEMO',function(){
    //     it('should be able to do stacked queries',async function(){
    //         var tables = await models.sequelize.query("SELECT name FROM sqlite_master WHERE type='table' union select 12345", { type: sequelize.QueryTypes.SELECT})             
    //         console.log(tables);
    //     });
    //     it('should have sqli for the DEMO', async function(){
    //         var name = 'foobar';
    //         var failure = await logic.notes
    //             .update(
    //                 {data:'foo',title:'bar'},
    //                 "1; create table "+name+" (t text); -- ")
    //             .then((result) => {return result})
    //             .catch((result) => {return result})
    //         console.log(failure);
    //         var tables = await models.sequelize.query("SELECT name FROM sqlite_master WHERE type='table';", { type: sequelize.QueryTypes.SELECT})            
    //         console.log(tables);
    //     });
    // });
}); 