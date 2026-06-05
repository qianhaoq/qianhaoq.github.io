Feature: Blog publishing contract
  The static blog should expose published writing and supporting discovery artifacts
  while keeping drafts out of every public surface.

  Scenario: Published posts are visible while drafts stay private
    Given the production site has been built
    When I inspect the public blog entry points
    Then the published starter post is available
    And the draft sample is not exposed in public pages

  Scenario: Search, RSS, and sitemap expose published writing
    Given the production site has been built
    When I inspect the search, feed, and sitemap artifacts
    Then Pagefind indexes the published starter post
    And RSS includes the published starter post
    And the sitemap includes the published starter post
