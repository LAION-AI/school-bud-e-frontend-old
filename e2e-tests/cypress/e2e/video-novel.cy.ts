/// <reference types="cypress" />

import { assertEquals } from "https://deno.land/std@0.202.0/assert/mod.ts";
import { videoNovelStore } from "../../components/video-novel/store.ts";

describe('Video Novel Application', () => {
  beforeEach(() => {
    cy.visit('/video-novel');
    // Clear IndexedDB before each test
    cy.window().then((win: Window) => {
      win.indexedDB.deleteDatabase('video-novels');
    });
  });

  it('should load the chat interface', () => {
    cy.get('textarea', { timeout: 10000 }).should('exist');
    cy.get('button[aria-label="Send message"]', { timeout: 10000 }).should('exist');
    cy.get('button[aria-label="Upload image"]', { timeout: 10000 }).should('exist');
    cy.get('button[aria-label="Record voice"]', { timeout: 10000 }).should('exist');
  });

  it('should allow sending messages', () => {
    const testMessage = 'Hello, this is a test message';
    cy.get('textarea', { timeout: 10000 }).type(testMessage);
    cy.get('button[aria-label="Send message"]').click();
    cy.contains(testMessage, { timeout: 10000 }).should('exist');
  });

  it('should show typing indicator when AI is responding', () => {
    const testMessage = 'What can you help me with?';
    cy.get('textarea', { timeout: 10000 }).type(testMessage);
    cy.get('button[aria-label="Send message"]').click();
    cy.get('.animate-[bounce_1.4s_infinite_.2s]', { timeout: 10000 }).should('exist');
    cy.contains('AI is thinking...', { timeout: 10000 }).should('exist');
  });

  it('should handle image uploads', () => {
    cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
      cy.get('input[type="file"]', { timeout: 10000 }).attachFile({
        fileContent,
        fileName: 'test-image.jpg',
        mimeType: 'image/jpeg'
      });
    });
    cy.get('img[alt^="Thumbnail"]', { timeout: 10000 }).should('exist');
  });

  it('should save and load video novels', () => {
    const novelName = 'Test Novel';
    
    // Create a new novel
    cy.get('[data-test="create-novel"]', { timeout: 10000 }).click();
    cy.get('[data-test="novel-name-input"]', { timeout: 10000 }).type(novelName);
    cy.get('[data-test="save-novel"]').click();

    // Verify it's saved
    cy.get('[data-test="novel-list"]', { timeout: 10000 })
      .should('contain', novelName);

    // Load the novel
    cy.contains(novelName).click();
    cy.url().should('include', '/novel/');
    cy.get('[data-test="novel-title"]', { timeout: 10000 })
      .should('contain', novelName);
  });

  it('should handle errors gracefully', () => {
    // Test with invalid API configuration
    cy.window().then((win: Window) => {
      win.localStorage.setItem('settings', JSON.stringify({
        apiKey: 'invalid-key',
        apiUrl: 'http://invalid-url'
      }));
    });
    
    cy.reload();
    cy.get('textarea', { timeout: 10000 }).type('This should fail');
    cy.get('button[aria-label="Send message"]').click();
    cy.contains('Error', { timeout: 10000 }).should('exist');
  });
});
