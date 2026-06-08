Feature: Static pages and discovery contract
  Beyond the publishing and authoring contracts, the static site must keep its
  supporting reader pages (about, 404, archive grouping, tag detail) correct and
  free of draft leakage.

  Scenario: The about page introduces the author and links out
    Given the production site has been built
    When I open the about page
    Then the about page shows the author name and writing principles
    And the about page links to the author GitHub profile

  Scenario: The 404 page guides readers back into the site
    Given the production site has been built
    When I open the not-found page
    Then the not-found page explains the page is missing
    And the not-found page offers links back to the posts list and homepage

  Scenario: The archive groups published posts by year without drafts
    Given the production site has been built
    When I open the archive page
    Then the archive groups the published starter post under its year
    And the archive does not expose the draft sample

  Scenario: A tag detail page lists its published posts while draft tags stay private
    Given the production site has been built
    When I open the tag detail page for the starter post tag
    Then the tag detail page lists the published starter post with its post count
    And no public tag page is generated for the draft-only tag
