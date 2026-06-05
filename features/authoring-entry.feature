Feature: Authoring entry contract
  The blog should keep the reader site public while giving the author a
  draft-first local workflow for writing and publishing posts.

  Scenario: Authoring starts from a private draft and stays separate from reader navigation
    Given the local authoring entry is available
    When I inspect the authoring contract
    Then the author can start a draft with one command
    And new authoring posts default to private drafts
    And the public reader navigation stays separate from authoring tools
