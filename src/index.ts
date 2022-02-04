import {
  DeleteLogGroupRequest, DescribeLogGroupsRequest, DescribeLogGroupsResponse, PutRetentionPolicyRequest
} from 'aws-sdk/clients/cloudwatchlogs';
import {
  GetRestApisRequest, RestApis
} from 'aws-sdk/clients/apigateway';
import Serverless from 'serverless';
import Plugin from 'serverless/classes/Plugin';
import Aws from 'serverless/plugins/aws/provider/awsProvider';
// import

export default class ServerlessApiGatewayExecutionLogManager implements Plugin {
  public hooks: Plugin.Hooks;
  private provider: Aws;
  private executionLogGroupName: string | undefined;

  constructor(private readonly serverless: Serverless) {
    this.hooks = {
      'before:remove:remove': async () => this.beforeRemove(),
      'after:remove:remove': async () => this.afterRemove(),
      'after:deploy:deploy': async () => this.afterDeploy()
    };
    this.provider = serverless.getProvider('aws');

    serverless.cli.log('serverless-api-gateway-execution-log-manager initialized');
  }

  private async beforeRemove(): Promise<void> {
    this.executionLogGroupName = await this.getApiGatewayExecutionLogGroupName();
  }

  private async afterRemove(): Promise<void> {
    if (this.executionLogGroupName) {
      this.serverless.cli.log(`${this.executionLogGroupName} log group is being removed...`);
      await this.deleteLogGroup(this.executionLogGroupName);
    } else {
      this.serverless.cli.log('API Gateway Execution log group not found, skipping update');
    }
  }

  private async afterDeploy(): Promise<void> {
    const executionLogGroupName = await this.getApiGatewayExecutionLogGroupName();
    if (executionLogGroupName) {
      this.serverless.cli.log(`${executionLogGroupName} log group is having its retention policy updated...`);
      await this.updateLogGroupRetention(executionLogGroupName);
    } else {
      this.serverless.cli.log('API Gateway Execution log group not found, skipping retention policy update');
    }
  }

  private async getRestApiId(): Promise<string | undefined> {
    const apiGatewayName = this.provider.naming.getApiGatewayName();
    this.serverless.cli.log(`Getting rest api id of api gateway ${apiGatewayName} ...`);
    const params: GetRestApisRequest = {
      limit: 500
    };
    while (true) {
      const result: RestApis = await this.provider.request('APIGateway', 'getRestApis', params);
      const apiGateway = result.items?.find(agw => agw.name === apiGatewayName);
      if (apiGateway) {
        return apiGateway.id;
      }
      if (result.position) {
        params.position = result.position;
      } else {
        // no more data, stop
        break;
      }
    }
    return undefined;
  }

  private async getApiGatewayExecutionLogGroupName(): Promise<string | undefined> {
    const restApiId = await this.getRestApiId();
    if (restApiId) {
      const executionLogGroupName = `API-Gateway-Execution-Logs_${restApiId}/${this.provider.getStage()}`;

      // AWS SDK does not have a getLogGroupRequest, so we test that the log group exists via a describe request
      const params: DescribeLogGroupsRequest = {
        logGroupNamePrefix: executionLogGroupName
      };
      const result: DescribeLogGroupsResponse = await this.provider.request('CloudWatchLogs', 'describeLogGroups', params);
      if (result.logGroups?.find(lg => lg.logGroupName === executionLogGroupName)) {
        return executionLogGroupName;
      }
    }

    return undefined;
  }

  private async deleteLogGroup(name: string): Promise<void> {
    const params: DeleteLogGroupRequest = {
      logGroupName: name
    };
    await this.provider.request('CloudWatchLogs', 'deleteLogGroup', params);
  }

  private async updateLogGroupRetention(name: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const retentionDays = (this.provider as any).getLogRetentionInDays() || 14; // 14 is the default in Serverless, it should not happen that there is no value
    const params: PutRetentionPolicyRequest = {
      logGroupName: name,
      retentionInDays: retentionDays
    };
    await this.provider.request('CloudWatchLogs', 'putRetentionPolicy', params);
  }
}

module.exports = ServerlessApiGatewayExecutionLogManager;
