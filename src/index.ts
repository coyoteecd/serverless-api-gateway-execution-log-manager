import Serverless from 'serverless';
import Plugin from 'serverless/classes/Plugin';

export default class ServerlessApiGatewayExecutionLogManager implements Plugin {
  public hooks: Plugin.Hooks;

  constructor(serverless: Serverless) {
    this.hooks = {
    };

    serverless.cli.log('serverless-api-gateway-execution-log-manager initialized');
  }
}
