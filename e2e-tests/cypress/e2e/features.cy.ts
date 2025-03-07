describe('Feature Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Video Novel Functionality', () => {
    it('should navigate to video novel page', () => {
      cy.visit('/video-novel')
      cy.contains('Interactive Video Novel').should('exist')
      cy.get('.aspect-square').should('exist')
    })
  })

  describe('Game Functionality', () => {
    it('should navigate to games list', () => {
      cy.visit('/games/list')
      cy.contains('All Games').should('exist')
    })
  })

  describe('Chat Functionality', () => {
    beforeEach(() => {
      // Set the universal API key before visiting the page
      window.localStorage.setItem('bud-e-universal-api-key', 'erddbdtb24tss0x9xlael')
      
      // Visit the chat page
      cy.visit('/chat/0')
      
      // Wait for the page to load and API to be configured
      cy.get('textarea[placeholder]', { timeout: 20000 }).should('exist')
      
      // Wait for either English or German welcome message
      cy.contains(/Hello! I am School Bud-E|Hallo! Ich bin School Bud-E/, { timeout: 10000 }).should('exist')
      
      // Wait for the textarea to be enabled
      cy.get('textarea[placeholder]').should('not.be.disabled', { timeout: 20000 })
    })

    it('should have chat interface elements', () => {
      // Check for the chat input container
      cy.get('.shadow-lg.flex.cursor-text').should('exist')
      // Check for the textarea
      cy.get('textarea[placeholder]').should('exist').and('not.be.disabled')
      // Check for the submit button (svg inside button)
      cy.get('button svg.icon-tabler-arrow-narrow-up').should('exist')
    })

    it('should be able to send a message', () => {
      const testMessage = 'Hello, this is a test message'
      
      // Type the message
      cy.get('textarea[placeholder]').should('not.be.disabled').type(testMessage)
      
      // Click the submit button
      cy.get('button svg.icon-tabler-arrow-narrow-up').parent().click()
      
      // Verify the message appears in the chat
      cy.contains(testMessage).should('exist')
      
      // Wait for the message to be sent (textarea should be cleared)
      cy.get('textarea[placeholder]').should('have.value', '')
      
      // Wait for the message to appear in the chat history
      cy.get('.chat-history').within(() => {
        cy.contains(testMessage).should('exist')
      })
      
      // Wait for the thinking text to appear (handle both languages and potential whitespace)
      cy.contains(/AI is thinking\.\.\.|KI denkt nach\.\.\./, { timeout: 10000 }).should('exist')
      
      // Once we see the thinking text, wait for the response
      cy.contains(/AI is thinking\.\.\.|KI denkt nach\.\.\./, { timeout: 30000 }).should('not.exist')
      
      // After response is complete, textarea should be enabled again
      cy.get('textarea[placeholder]', { timeout: 10000 }).should('not.be.disabled')
    })
  })
}) 