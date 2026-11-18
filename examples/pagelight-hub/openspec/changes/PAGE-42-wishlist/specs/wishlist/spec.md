## ADDED Requirements

### Requirement: Save and remove editions
A signed-in reader SHALL be able to add an edition to their wishlist and remove it again. Adding an edition already in the list SHALL succeed without creating a duplicate.

#### Scenario: Add an edition
- **WHEN** a signed-in reader adds an edition they have not saved
- **THEN** the edition appears in their wishlist and the count increases by one

#### Scenario: Add twice
- **WHEN** a reader adds an edition that is already in their wishlist
- **THEN** the request succeeds and the count does not change

#### Scenario: Limit reached
- **WHEN** a reader with 200 saved editions adds another
- **THEN** the request is refused with a "list is full" message and the list is unchanged

### Requirement: Privacy
The system SHALL only return a reader's own wishlist.

#### Scenario: Another reader's list
- **WHEN** reader A requests the wishlist
- **THEN** none of reader B's editions are included

### Requirement: Wishlist page
The shop SHALL show the wishlist with each edition's current price and stock, and let the reader move an edition to the cart.

#### Scenario: Out-of-stock edition
- **WHEN** a saved edition is out of stock
- **THEN** it is shown greyed out with "Out of stock" and no "Add to cart" button
