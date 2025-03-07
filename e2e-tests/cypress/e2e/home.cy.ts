describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the home page', () => {
    cy.get('body').should('exist')
  })

  it('should have the correct title', () => {
    cy.title().should('include', 'School Bud-E')
  })

  it('should have basic page structure', () => {
    // Check for the body element
    cy.get('body').should('be.visible')
    
    // Check for any heading
    cy.get('h1, h2, h3, h4, h5, h6').should('exist')
    
    // Check for any links
    cy.get('a').should('exist')
  })
}) 