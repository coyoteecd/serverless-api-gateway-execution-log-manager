import { APIGateway, CloudWatchLogs } from 'aws-sdk';
import { RestApis } from 'aws-sdk/clients/apigateway';
import { DescribeLogGroupsResponse } from 'aws-sdk/clients/cloudwatchlogs';
import Serverless, { Options } from 'serverless';
import { Logging } from 'serverless/classes/Plugin';
import Aws from 'serverless/plugins/aws/provider/awsProvider';
import ServerlessApiGatewayExecutionLogManager from './index';

describe('ServerlessApiGatewayExecutionLogManager', () => {

  it('should create the plugin', () => {
    const { serverless } = stubServerlessInstance();
    const logging = stubLogging();

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless, {} as Options, logging);
    expect(plugin).toBeTruthy();
    expect(logging.log.verbose).toHaveBeenCalledWith(jasmine.stringMatching('initialized'));
  });

  it('should skip updating the API Gateway execution log group retention when deploying the stack and no Rest API defined', async () => {
    const { requestSpy, serverless } = stubServerlessInstance({ stage: 'thor', apiGatewayName: 'testService-thor' });
    const logging = stubLogging();

    const restApis = { items: [] } as APIGateway.RestApis;
    const logGroupResult = {
      logGroups: [
        { logGroupName: '/aws/lambda/ck-reservations-cleanup' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/master' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    requestSpy
      .withArgs('APIGateway', 'getRestApis', jasmine.anything()).and.resolveTo(restApis)
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything()).and.resolveTo();

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless, {} as Options, logging);

    // Invoke the actual deploy function
    const deployFn = plugin.hooks['after:deploy:deploy'];
    await expectAsync(deployFn()).toBeResolved();

    expect(requestSpy).not.toHaveBeenCalledWith('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything());
    expect(logging.log.warning).toHaveBeenCalledWith(jasmine.stringMatching('API Gateway Execution log group not found'));
  });

  it('should skip updating the API Gateway execution log group retention when deploying the stack and the log group does not exist', async () => {
    const { requestSpy, serverless } = stubServerlessInstance({ stage: 'thor', apiGatewayName: 'testService-thor' });
    const logging = stubLogging();

    const restApis = {
      items: [
        { name: 'testService-thor', id: '8e24r4xy0g' },
      ]
    } as APIGateway.RestApis;
    const logGroupResult = {
      logGroups: [
        { logGroupName: '/aws/lambda/ck-reservations-cleanup' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/master' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    requestSpy
      .withArgs('APIGateway', 'getRestApis', jasmine.anything()).and.resolveTo(restApis)
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything()).and.resolveTo();

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless, {} as Options, logging);

    // Invoke the actual deploy function
    const deployFn = plugin.hooks['after:deploy:deploy'];
    await expectAsync(deployFn()).toBeResolved();

    expect(requestSpy).not.toHaveBeenCalledWith('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything());
    expect(logging.log.warning).toHaveBeenCalledWith(jasmine.stringMatching('API Gateway Execution log group not found'));
  });

  it('should update the API Gateway execution log group retention when updating the stack', async () => {
    const { requestSpy, serverless } = stubServerlessInstance({ stage: 'thor', apiGatewayName: 'testService-thor', logRetention: 5 });
    const logging = stubLogging();

    const restApis = {
      items: [
        { name: 'testService-thor', id: '8e24r4xy0g' },
      ]
    } as APIGateway.RestApis;
    const logGroupResult = {
      logGroups: [
        { logGroupName: '/aws/lambda/sws-app-ada-reservations-cleanup' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24rabcde/thor' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/thor' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/master' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    requestSpy
      .withArgs('APIGateway', 'getRestApis', jasmine.anything()).and.resolveTo(restApis)
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything()).and.resolveTo();

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless, {} as Options, logging);

    // Invoke the actual deploy function
    const deployFn = plugin.hooks['after:deploy:deploy'];
    await expectAsync(deployFn()).toBeResolved();

    expect(requestSpy).toHaveBeenCalledWith('CloudWatchLogs', 'putRetentionPolicy', jasmine.objectContaining<CloudWatchLogs.PutRetentionPolicyRequest>({
      logGroupName: jasmine.stringMatching('thor'),
      retentionInDays: 5
    }));
    expect(logging.log.verbose).toHaveBeenCalledWith(jasmine.stringMatching('log group is having its retention policy updated'));
  });

  it('should update the API Gateway execution log group retention with a default retention value when logRetentionInDays is missing', async () => {
    const { requestSpy, serverless } = stubServerlessInstance({ stage: 'thor', apiGatewayName: 'testService-thor', logRetention: undefined });
    const logging = stubLogging();

    const restApis = {
      items: [
        { name: 'testService-thor', id: '8e24r4xy0g' },
      ]
    } as APIGateway.RestApis;
    const logGroupResult = {
      logGroups: [
        { logGroupName: '/aws/lambda/sws-app-ada-reservations-cleanup' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24rabcde/thor' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/thor' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/master' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    requestSpy
      .withArgs('APIGateway', 'getRestApis', jasmine.anything()).and.resolveTo(restApis)
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything()).and.resolveTo();

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless, {} as Options, logging);

    // Invoke the actual deploy function
    const deployFn = plugin.hooks['after:deploy:deploy'];
    await expectAsync(deployFn()).toBeResolved();

    expect(requestSpy).toHaveBeenCalledWith('CloudWatchLogs', 'putRetentionPolicy', jasmine.objectContaining<CloudWatchLogs.PutRetentionPolicyRequest>({
      retentionInDays: 14
    }));
    expect(logging.log.verbose).toHaveBeenCalledWith(jasmine.stringMatching('log group is having its retention policy updated'));
  });

  it('should skip deleting the API Gateway execution log group when removing the stack while there are no API Gateway execution logs', async () => {
    const { requestSpy, serverless } = stubServerlessInstance({ stage: 'thor', apiGatewayName: 'APIGW' });
    const logging = stubLogging();

    const restApis = {
      items: [{ name: 'APIGW', id: 'abcde' }]
    } as RestApis;
    requestSpy
      .withArgs('APIGateway', 'getRestApis', jasmine.anything()).and.resolveTo(restApis)
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo([])
      .withArgs('CloudWatchLogs', 'deleteLogGroup', jasmine.anything()).and.resolveTo();

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless, {} as Options, logging);

    // Invoke the before/after remove hooks in the same order as Serverless does
    const beforeRemoveFn = plugin.hooks['before:remove:remove'];
    const removeFn = plugin.hooks['after:remove:remove'];
    await expectAsync(beforeRemoveFn()).toBeResolved();
    await expectAsync(removeFn()).toBeResolved();

    expect(requestSpy).not.toHaveBeenCalledWith('CloudWatchLogs', 'deleteLogGroup', jasmine.anything());
    expect(logging.log.warning).toHaveBeenCalledWith(jasmine.stringMatching('API Gateway Execution log group not found'));
  });

  it('should delete the correct API Gateway execution log group retention when removing the stack', async () => {
    const { requestSpy, serverless } = stubServerlessInstance({ stage: 'thor', apiGatewayName: 'APIGW' });

    const restApis = {
      items: [{ name: 'APIGW', id: '8e24r4xy0g' }]
    } as RestApis;
    const logGroupResult = {
      logGroups: [
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/thor' }
      ]
    } as DescribeLogGroupsResponse;
    requestSpy
      .withArgs('APIGateway', 'getRestApis', jasmine.anything()).and.resolveTo(restApis)
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'deleteLogGroup', jasmine.anything()).and.resolveTo();

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless, {} as Options, stubLogging());

    // Invoke the before/after remove hooks in the same order as Serverless does
    const beforeRemoveFn = plugin.hooks['before:remove:remove'];
    const removeFn = plugin.hooks['after:remove:remove'];
    await expectAsync(beforeRemoveFn()).toBeResolved();
    await expectAsync(removeFn()).toBeResolved();

    expect(requestSpy).toHaveBeenCalledTimes(3);
    expect(requestSpy.calls.argsFor(2)).toEqual([
      'CloudWatchLogs', 'deleteLogGroup',
      jasmine.objectContaining<CloudWatchLogs.DeleteLogGroupRequest>({
        logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/thor'
      })
    ]);
  });

  function stubServerlessInstance(options: { stage?: string, apiGatewayName?: string, logRetention?: number } = {}):
    { requestSpy: jasmine.Spy; serverless: jasmine.SpyObj<Serverless> } {

    const requestSpy = jasmine.createSpy('request').and.resolveTo({});
    return {
      requestSpy,
      serverless: jasmine.createSpyObj<Serverless>({
        getProvider: ({
          request: requestSpy,
          getStage: jasmine.createSpy().and.returnValue(options.stage),
          getLogRetentionInDays: jasmine.createSpy().and.returnValue(options.logRetention),
          naming: {
            getApiGatewayName: jasmine.createSpy().and.returnValue(options.apiGatewayName)
          }
        } as unknown as Aws)
      }, {
        cli: jasmine.createSpyObj(['log']),
      })
    };
  }

  function stubLogging(): { writeText, log: jasmine.SpyObj<Logging['log']> } {
    return {
      writeText: undefined,
      log: jasmine.createSpyObj<Logging['log']>([
        'error', 'warning', 'success', 'notice', 'verbose'
      ])
    };
  }
});
