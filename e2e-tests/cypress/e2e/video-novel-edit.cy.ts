/// <reference types="cypress" />

describe('Video Novel Edit Functionality', () => {
  const mockSegment = {
    id: 'test-segment-id',
    content: 'Test segment content',
    timestamp: 0,
    duration: 5
  };

  const mockNovel = {
    id: 'test-novel-id',
    name: 'Test Novel',
    images: [
      {
        order: 1,
        url: '/test-image.jpg',
        timestamp: 0,
        duration: 5,
        associatedSegmentId: mockSegment.id
      }
    ],
    audioBlob: new Blob(['test audio'], { type: 'audio/mp3' }),
    segments: [mockSegment]
  };

  beforeEach(() => {
    // Mock IndexedDB operations
    cy.window().then((win) => {
      win.indexedDB.deleteDatabase('video-novels');
      cy.stub(win, 'getAllVideoNovels').returns(Promise.resolve([mockNovel]));
      cy.stub(win, 'getVideoNovel').returns(Promise.resolve(mockNovel));
    });

    // Mock image request
    cy.intercept('GET', '**/test-image.jpg', {
      statusCode: 200,
      fixture: 'test-image.jpg'
    });

    // Set up API mocks
    cy.intercept('POST', '**/edit_story/*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          type: 'status',
          data: 'Processing edit...',
          editHash: 'test-hash'
        }
      });
    }).as('editStory');

    cy.intercept('GET', '**/edit_status/*', {
      statusCode: 200,
      body: {
        status: 'completed'
      }
    }).as('editStatus');

    // Visit video novel page and set initial state
    cy.visit('/video-novel', {
      onBeforeLoad(win) {
        // Mock localStorage to set selected novel
        win.localStorage.setItem('selectedNovelId', mockNovel.id);
      }
    });

    // Wait for initial load
    cy.get('img[alt="Story scene"]', { timeout: 10000 })
      .should('be.visible')
      .and('have.attr', 'src')
      .and('not.include', 'placeholder.webp');

    // Wait for audio element and trigger state update
    cy.get('audio', { timeout: 10000 }).should('exist').then($audio => {
      const audio = $audio[0];
      
      // Set current time to trigger order update
      audio.currentTime = 1;
      
      // Dispatch timeupdate event to trigger state updates
      const event = new Event('timeupdate');
      audio.dispatchEvent(event);
      
      // Try to play (but handle autoplay restrictions)
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore autoplay errors in test environment
        });
      }
    });

    // Wait for edit button to be ready
    cy.get('button[aria-label="Edit current segment"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled');
  });

  it('should open edit dialog when clicking edit button', () => {
    // Force click in case of any overlay issues
    cy.get('button[aria-label="Edit current segment"]')
      .click({ force: true });

    cy.get('[role="dialog"]', { timeout: 5000 })
      .should('be.visible')
      .within(() => {
        cy.contains('h2', 'Edit Segment').should('be.visible');
        cy.get('textarea').should('be.visible');
      });
  });

  it('should allow editing and saving changes', () => {
    cy.get('button[aria-label="Edit current segment"]', { timeout: 10000 })
      .should('be.visible')
      .click();

    const newContent = 'This is the edited story content';
    cy.get('textarea')
      .should('be.visible')
      .clear()
      .type(newContent);

    cy.contains('button', 'Save Changes')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    cy.wait('@editStory')
      .its('request.body')
      .should('deep.equal', {
        segment_id: mockSegment.id,
        edit_content: newContent
      });

    cy.contains('Status: Processing edit...', { timeout: 5000 }).should('be.visible');
    cy.wait('@editStatus');
    cy.contains('Edit completed', { timeout: 5000 }).should('be.visible');
  });

  it('should handle edit errors gracefully', () => {
    cy.intercept('POST', '**/edit_story/*', {
      statusCode: 500,
      body: {
        detail: 'Failed to edit story'
      }
    }).as('editStoryError');

    cy.get('button[aria-label="Edit current segment"]', { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.get('textarea')
      .should('be.visible')
      .clear()
      .type('This edit will fail');

    cy.contains('button', 'Save Changes').click();

    cy.wait('@editStoryError');
    cy.contains('Failed to edit story', { timeout: 5000 }).should('be.visible');
  });

  it('should close edit dialog when clicking close button', () => {
    cy.get('button[aria-label="Edit current segment"]', { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.get('button[aria-label="Close dialog"]')
      .should('be.visible')
      .click();

    cy.contains('h2', 'Edit Segment').should('not.exist');
  });
}); 