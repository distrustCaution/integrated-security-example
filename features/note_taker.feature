Feature: Notes UI 

  I should be able to create, change, and share a note

  Background: For demonstration
    #Try <script>alert(1)</script>
    # Given Check for the evaluated xss expression "12345"
    # Given Check for the evaluated xss expression "54321"
    # Given Check for the evaluated angular expression "144"
    # Given Check for the evaluated angular expression "225"
    Given Check for external scripts
    # Given Wait 1 second between steps


    # For brevity's sake, we aren't going into a string generator function in this cucumber example, and just hard code it
    # In this example, we'll look for XSS, angular injection, external script injection, and sql injetion
    # Payloads:
      # Angular: {{12*12}}, {{15*15}}
      # XSS: <script>console.error(54321)</script>, <img src=1 onerror=console.error(12345)>
      # SQLi: 1'-- , 1"--
  Scenario: Make and share a note
    #Inputs (Users are created via the API)
    Given The user named "alice" with username "alice" with password "alice"
    Given The user named "bob" with username "bob" with password "bob"
    Given The note named "note" with the title "my note" and the content "hello I'm a note"
    # Running the test
    # First login as alice
    When I am on the login page
    And I login as "alice"
    And I click on "newNote"
    And I should see the name of "alice" up top
    # Then make a note
    When I fill in "notetitle" with note named "note" "title"
    And I fill in "notebody" with note named "note" "content"
    And I click on "saveButton"
    Then I should see the "notebody" element containing note named "note" "content"
    # Then share the note with bob
    When I clear and fill in "share" with the "username" of user "bob" 
    And I click on "shareButton"
    Then I should see the "shareresult" element containing "username" of user "bob"
    # Then login as bob
    When I am on the login page
    And I login as "bob"
    Then I should see 1 note on the notes page
    And I should see the name of "bob" up top
    # Then see the note shared as bob
    When I click on the link with the note named "note" title
    And I should see the name of "bob" up top
    Then I should see the "notetitle" element containing note named "note" "title"
    And I should see the "notebody" element containing note named "note" "content"
    Then I check security assertions