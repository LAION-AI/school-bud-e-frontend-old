declare namespace Cypress {
  type ChainableElement = JQuery<HTMLElement>;
  
  interface Chainable {
    intercept(url: string | RegExp): Chainable;
    intercept(method: string, url: string | RegExp): Chainable;
    intercept(method: string, url: string | RegExp, response?: unknown): Chainable;
    
    get(selector: string): Chainable;
    click(): Chainable;
    type(text: string): Chainable;
    contains(text: string): Chainable;
    first(): Chainable;
    find(selector: string): Chainable;
    clear(): Chainable;
    reload(): Chainable;
    wait(alias: string): Chainable;
    
    // Basic assertions
    should(chainer: string, value?: unknown): Chainable;
  }

  interface Interception {
    id: string;
    request: {
      url: string;
      method: string;
      body: unknown;
      headers: Record<string, string>;
    };
    response?: {
      statusCode: number;
      body: unknown;
      headers: Record<string, string | string[]>;
    };
  }
}

declare module "*.ts" {
  const content: unknown;
  export default content;
}
