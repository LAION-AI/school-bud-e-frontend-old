/// <reference types="cypress" />

import { assertEquals } from "https://deno.land/std@0.202.0/assert/mod.ts";

describe('Game Detail Page', () => {
  const gameId = '343b3e02-d9f7-43e0-80db-abd6c517e295'; // Binary Multiplication Game
  const mockGameData = {
    id: gameId,
    title: 'Binary Multiplication Game',
    description: 'Practice binary multiplication in a fun way!',
    imageUrl: '',
    points: 40,
    timestamp: '2025-02-03'
  };
  
  beforeEach(() => {
    // Intercept API call and return mock data
    cy.intercept('GET', `/api/games/${gameId}`, {
      statusCode: 200,
      body: mockGameData
    }).as('getGame');
    
    // Visit the game detail page
    cy.visit(`/games/${gameId}`);
    
    // Wait for the API call to complete
    cy.wait('@getGame');
  });

  it('should display the game name as h1', () => {
    cy.get('[data-test="game-name"]', { timeout: 10000 })
      .should('exist')
      .and('contain', mockGameData.title);
  });

  it('should load game details', () => {
    // Check if game details are displayed with correct data
    cy.get('[data-test="game-name"]', { timeout: 10000 })
      .should('exist')
      .and('contain', mockGameData.title);
    cy.get('[data-test="game-description"]', { timeout: 10000 })
      .should('exist')
      .and('contain', mockGameData.description);
  });
});
