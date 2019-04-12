Feature: Notes UI - Evil mode

  I should be able to create, change, and share a note

  Background: For demonstration
    # Given Wait 1 second between steps
    # Given Check for external scripts
    Given Check for the evaluated xss expression "12345"
    Given Check for the evaluated xss expression "54321"
    Given Check for the evaluated angular expression "144"
    Given Check for the evaluated angular expression "225"

    # For brevity's sake, we aren't going into a string generator function in this cucumber example, and just hard code it
    # In this example, we'll look for XSS, angular injection, external script injection, and sql injetion
    # Payloads:
      # Angular: {{12*12}}, {{15*15}}
      # XSS: <script>console.error(54321)</script>, <img src=1 onerror=console.error(12345)>
      # SQLi: 1'-- , 1"--

  Scenario: Make and share a note - SQL injection in the note
    #Inputs (Users are created via the API)
    Given The user named "alice" with username "aliceSQL" with password "alice"
    Given The user named "bob" with username "bobSQL" with password "bob"
    Given The note named "note" with the title "my note 1'--" and the content "hello I'm a note1'--"
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
    When I clear and fill in "share" with "bob" 
    And I click on "shareButton"
    Then I should see the "shareresult" element containing "username" of user "bob"
    # Then login as bob
    When I am on the login page
    And I login as "bob"
    And I should see the name of "bob" up top
    # Then see the note shared as bob
    When I click on the link with the note named "note" title
    And I should see the name of "bob" up top
    Then I should see the "notetitle" element containing note named "note" "title"
    And I should see the "notebody" element containing note named "note" "content"
    Then I check security assertions

  Scenario: Make and share a note - SQL injection in the user names
    #Inputs (Users are created via the API)
    Given The user named "alice" with username "alice1'--" with password "alice"
    Given The user named "bob" with username "bob1'--" with password "bob"
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
    When I clear and fill in "share" with "bob" 
    And I click on "shareButton"
    Then I should see the "shareresult" element containing "username" of user "bob"
    # Then login as bob
    When I am on the login page
    And I login as "bob"
    And I should see the name of "bob" up top
    # Then see the note shared as bob
    When I click on the link with the note named "note" title
    And I should see the name of "bob" up top
    Then I should see the "notetitle" element containing note named "note" "title"
    And I should see the "notebody" element containing note named "note" "content"
    Then I check security assertions

  Scenario: Make and share a note - Angular injection in the note
    #Inputs (Users are created via the API)
    Given The user named "alice" with username "aliceAngular" with password "alice"
    Given The user named "bob" with username "bobAngular" with password "bob"
    Given The note named "note" with the title "my note {{12*12}}" and the content "hello I'm a note{{15*15}}"
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
    When I clear and fill in "share" with "bob" 
    And I click on "shareButton"
    Then I should see the "shareresult" element containing "username" of user "bob"
    # Then login as bob
    When I am on the login page
    And I login as "bob"
    And I should see the name of "bob" up top
    # Then see the note shared as bob
    When I click on the link with the note named "note" title
    And I should see the name of "bob" up top
    Then I should see the "notetitle" element containing note named "note" "title"
    And I should see the "notebody" element containing note named "note" "content"
    Then I check security assertions

  Scenario: Make and share a note - Angular injection in the user names
    #Inputs (Users are created via the API)
    Given The user named "alice" with username "alice{{12*12}}" with password "alice"
    Given The user named "bob" with username "bob{{15*15}}" with password "bob"
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
    When I clear and fill in "share" with "bob" 
    And I click on "shareButton"
    Then I should see the "shareresult" element containing "username" of user "bob"
    # Then login as bob
    When I am on the login page
    And I login as "bob"
    And I should see the name of "bob" up top
    # Then see the note shared as bob
    When I click on the link with the note named "note" title
    And I should see the name of "bob" up top
    Then I should see the "notetitle" element containing note named "note" "title"
    And I should see the "notebody" element containing note named "note" "content"
    Then I check security assertions


  Scenario: Make and share a note - XSS in the note
    #Inputs (Users are created via the API)
    Given The user named "alice" with username "aliceXSS" with password "alice"
    Given The user named "bob" with username "bobXSS" with password "bob"
    Given The note named "note" with the title "my note <img src=1 onerror=console.error(12345)>" and the content "hello I'm a note<script>console.error(54321)</script>"
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
    When I clear and fill in "share" with "bob" 
    And I click on "shareButton"
    Then I should see the "shareresult" element containing "username" of user "bob"
    # Then login as bob
    When I am on the login page
    And I login as "bob"
    And I should see the name of "bob" up top
    # Then see the note shared as bob
    When I click on the link with the note named "note" title
    And I should see the name of "bob" up top
    Then I should see the "notetitle" element containing note named "note" "title"
    And I should see the "notebody" element containing note named "note" "content"
    Then I check security assertions

  Scenario: Make and share a note - XSS in the user names
    #Inputs (Users are created via the API)
    Given The user named "alice" with username "alice<script>console.error(54321)</script>" with password "alice"
    Given The user named "bob" with username "bob<img src=1 onerror=console.error(12345)>" with password "bob"
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
    When I clear and fill in "share" with "bob" 
    And I click on "shareButton"
    Then I should see the "shareresult" element containing "username" of user "bob"
    # Then login as bob
    When I am on the login page
    And I login as "bob"
    And I should see the name of "bob" up top
    # Then see the note shared as bob
    When I click on the link with the note named "note" title
    And I should see the name of "bob" up top
    Then I should see the "notetitle" element containing note named "note" "title"
    And I should see the "notebody" element containing note named "note" "content"
    Then I check security assertions

  Scenario: Make and share a note - Check for external scripts
    Given Check for external scripts
    #Inputs (Users are created via the API)
    Given The user named "alice" with username "aliceEXTERNAL" with password "alice"
    Given The user named "bob" with username "bobEXTERNAL" with password "bob"
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
    When I clear and fill in "share" with "bob" 
    And I click on "shareButton"
    Then I should see the "shareresult" element containing "username" of user "bob"
    # Then login as bob
    When I am on the login page
    And I login as "bob"
    And I should see the name of "bob" up top
    # Then see the note shared as bob
    When I click on the link with the note named "note" title
    And I should see the name of "bob" up top
    Then I should see the "notetitle" element containing note named "note" "title"
    And I should see the "notebody" element containing note named "note" "content"
    Then I check security assertions