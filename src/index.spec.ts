import Serverless from 'serverless';
import ServerlessApiGatewayExecutionLogManager from './index';

describe('ServerlessApiGatewayExecutionLogManager', () => {

  it('should create the plugin', () => {
    const serverless = {
      cli: jasmine.createSpyObj(['log'])
    } as Serverless;

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless);
    expect(plugin).toBeTruthy();
    expect(serverless.cli.log).toHaveBeenCalled();
  });
});
