import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Video and screenshot settings
    video: true,
    videoCompression: 15,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,
    
    // Test isolation
    testIsolation: true,
    
    // Browser settings
    chromeWebSecurity: false,
    modifyObstructiveCode: false,
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:8080/api/v1',
      coverage: false,
      environment: 'test'
    },
    
    setupNodeEvents(on, config) {
      // Code coverage plugin
      require('@cypress/code-coverage/task')(on, config);
      
      // Accessibility plugin
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
        table(message: any) {
          console.table(message);
          return null;
        }
      });
      
      // Custom tasks
      on('task', {
        // Database seeding task
        seedDatabase() {
          // Implement database seeding logic
          return null;
        },
        
        // Clean up task
        cleanup() {
          // Implement cleanup logic
          return null;
        }
      });
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts',
    supportFile: 'cypress/support/component.ts',
    
    // Component testing specific settings
    viewportWidth: 1000,
    viewportHeight: 660,
    
    // Setup for component testing
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
  },
  
  // Performance and memory settings
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 5,
  
  // Browser configuration
  browsers: [
    {
      name: 'chrome',
      family: 'chromium',
      channel: 'stable',
      displayName: 'Chrome',
      version: '',
      path: '',
      minSupportedVersion: 64,
      majorVersion: 64,
    },
    {
      name: 'firefox',
      family: 'firefox',
      channel: 'stable',
      displayName: 'Firefox',
      version: '',
      path: '',
      minSupportedVersion: 86,
      majorVersion: 86,
    },
    {
      name: 'edge',
      family: 'chromium',
      channel: 'stable',
      displayName: 'Edge',
      version: '',
      path: '',
      minSupportedVersion: 79,
      majorVersion: 79,
    }
  ]
});