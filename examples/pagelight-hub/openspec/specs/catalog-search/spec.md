# catalog-search Specification

## Purpose
How readers find titles in the catalogue.

## Requirements

### Requirement: Search by title, author or ISBN
The system SHALL return titles whose title or author contains the query, or whose ISBN equals it, ordered by relevance.

#### Scenario: Matching by author
- **WHEN** a reader searches "le guin"
- **THEN** titles by Ursula K. Le Guin are returned first

#### Scenario: No match
- **WHEN** a reader searches for text that matches nothing
- **THEN** an empty list is returned and the page suggests browsing categories
