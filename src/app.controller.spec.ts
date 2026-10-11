import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  it('should return the API health payload', () => {
    const appController = new AppController(new AppService());

    expect(appController.getHello()).toMatchObject({
      status: 'ok',
      name: 'splitwise-api',
    });
  });
});
