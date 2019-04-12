Feature: Notes UI 

  I should be able to create, change, and share a note

  Background: For demonstration
    Given Wait 1 seconds between steps

  Scenario: Make and save and change a note
    Given the account named "foo" with password "foo"
    When I am on the login page
    And I login as "foo" with password "foo"
    Then I should see the "allNotesTitle" element
    When I click on "newNote"
    Then I should see the "notetitle" element
    And I should see the "notebody" element
    When I clear and fill in "notetitle" with "hello this is my note title"
    And I clear and fill in "notebody" with "hello this is my note body!"
    And I click on "saveButton"
    Then I should see the "notetitle" element containing "hello this is my note title"
    And I should see the "notebody" element containing "hello this is my note body!"
    And I click on "allNotes"
    Then I should see the "allNotesTitle" element
    And I should see 1 note on the notes page 
    When I click on the link with the text "hello this is my note title"
    Then I should see the "notetitle" element containing "hello this is my note title"
    And I should see the "notebody" element containing "hello this is my note body!"
    Then I check security assertions