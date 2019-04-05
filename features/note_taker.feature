Feature: Notes UI 

  I should be able to create, change, and share a note

  Scenario: Make and save and change a note
    Given the account named foo<script>alert(1)</script>{{2+2}} with password foo
    When I login as foo<script>alert(1)</script>{{2+2}} with password foo
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
    Then Sleep 2

  Scenario: Make and change a note
    Given the account named alice with password alice
    Given the account named bob with password bob
    When I login as alice with password alice
    And I click on "newNote"
    Then I should see the "notebody" element
    When I clear and fill in "notetitle" with "hello this is my note title"
    And I clear and fill in "notebody" with "hello this is my note body!" 
    And I click on "saveButton"
    Then I should see the "notebody" element containing "hello this is my note body!"
    When I clear and fill in "share" with "bob" 
    And I click on "shareButton"
    Then I should see the "shareResult" element containing "bob"
    And Sleep 3
    



  # Scenario: Share a note
  #   Given the account named alice with password alice
  #   Given the account named bob with password bob
