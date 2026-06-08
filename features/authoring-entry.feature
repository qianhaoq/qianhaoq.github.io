Feature: Authoring entry contract
  The blog should keep the reader site public while giving the author a
  draft-first local workflow for writing and publishing posts.

  Scenario: Authoring starts from a private draft and is discoverable as a guide
    Given the local authoring entry is available
    When I inspect the authoring contract
    Then the author can start a draft with one command
    And new authoring posts default to private drafts
    And the public reader navigation exposes the writing guide
    And the writing guide keeps editing in the local workflow
    And the public site does not expose online admin capabilities

  Scenario: The default quality gate checks lint before publishing contracts
    Given the local authoring entry is available
    When I inspect the quality gate contract
    Then the default quality gate starts with lint
    And lint fails on warnings
    And the PR quality gate checks metadata before browser smoke
