import { CloudWatchLogs } from 'aws-sdk';
import Serverless from 'serverless';
import Aws from 'serverless/plugins/aws/provider/awsProvider';
import ServerlessApiGatewayExecutionLogManager from './index';

describe('ServerlessApiGatewayExecutionLogManager', () => {

  it('should create the plugin', () => {
    const serverless = jasmine.createSpyObj<Serverless>({
      getProvider: ({
        getStage: jasmine.createSpy().and.returnValue('thor')
      } as unknown as Aws)
    }, {
      cli: jasmine.createSpyObj(['log'])
    });

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless);
    expect(plugin).toBeTruthy();
    expect(serverless.cli.log).toHaveBeenCalledWith(jasmine.stringMatching('initialized'));
  });

  it('should skip updating the API Gateway execution log group retention when deploying the stack and the log group does not exist', async () => {
    const logGroupResult = {
      logGroups: [
        { logGroupName: '/aws/lambda/ck-reservations-cleanup' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/master' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    const requestSpy = jasmine.createSpy('request')
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything()).and.resolveTo();
    const cliLogSpy = jasmine.createSpy();
    const serverless = jasmine.createSpyObj<Serverless>({
      getProvider: ({
        request: requestSpy,
        getStage: jasmine.createSpy().and.returnValue('thor')
      } as unknown as Aws),
    }, {
      cli: ({ log: cliLogSpy })
    });

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless);

    // Invoke the actual deploy function
    const deployFn = plugin.hooks['after:deploy:deploy'];
    await expectAsync(deployFn()).toBeResolved();

    expect(requestSpy).not.toHaveBeenCalledWith('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything());
    expect(cliLogSpy).toHaveBeenCalledWith(jasmine.stringMatching('API Gateway Execution log group not found'));
  });

  it('should update the API Gateway execution log group retention when updating the stack', async () => {
    const logGroupResult = {
      logGroups: [
        { logGroupName: '/aws/lambda/sws-app-ada-reservations-cleanup' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/thor' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/master' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    const requestSpy = jasmine.createSpy('request')
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything()).and.resolveTo();
    const cliLogSpy = jasmine.createSpy();
    const serverless = jasmine.createSpyObj<Serverless>({
      getProvider: ({
        request: requestSpy,
        getStage: jasmine.createSpy().and.returnValue('thor'),
        getLogRetentionInDays: jasmine.createSpy().and.returnValue(5)
      } as unknown as Aws)
    }, {
      cli: ({ log: cliLogSpy })
    });

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless);

    // Invoke the actual deploy function
    const deployFn = plugin.hooks['after:deploy:deploy'];
    await expectAsync(deployFn()).toBeResolved();

    expect(requestSpy).toHaveBeenCalledWith('CloudWatchLogs', 'putRetentionPolicy', jasmine.objectContaining<CloudWatchLogs.PutRetentionPolicyRequest>({
      logGroupName: jasmine.stringMatching('thor'),
      retentionInDays: 5
    }));
  });

  it('should update the API Gateway execution log group retention with a default retention value when logRetentionInDays is missing', async () => {
    const logGroupResult = {
      logGroups: [
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/thor' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    const requestSpy = jasmine.createSpy('request')
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'putRetentionPolicy', jasmine.anything()).and.resolveTo();
    const cliLogSpy = jasmine.createSpy();
    const serverless = jasmine.createSpyObj<Serverless>({
      getProvider: ({
        request: requestSpy,
        getStage: jasmine.createSpy().and.returnValue('thor'),
        getLogRetentionInDays: jasmine.createSpy().and.returnValue(undefined)
      } as unknown as Aws)
    }, {
      cli: ({ log: cliLogSpy })
    });

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless);

    // Invoke the actual deploy function
    const deployFn = plugin.hooks['after:deploy:deploy'];
    await expectAsync(deployFn()).toBeResolved();

    expect(requestSpy).toHaveBeenCalledWith('CloudWatchLogs', 'putRetentionPolicy', jasmine.objectContaining<CloudWatchLogs.PutRetentionPolicyRequest>({
      retentionInDays: 14
    }));
    expect(cliLogSpy).toHaveBeenCalledWith(jasmine.stringMatching('log group is having its retention policy updated'));
  });

  it('should skip deleting the API Gateway execution log group retention when removing the stack and the log group does not exist', async () => {
    const logGroupResult = {
      logGroups: [
        { logGroupName: '/aws/lambda/ck-reservations-cleanup' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/master' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    const requestSpy = jasmine.createSpy('request')
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'deleteLogGroup', jasmine.anything()).and.resolveTo();
    const cliLogSpy = jasmine.createSpy();
    const serverless = jasmine.createSpyObj<Serverless>({
      getProvider: ({
        request: requestSpy,
        getStage: jasmine.createSpy().and.returnValue('thor')
      } as unknown as Aws),
    }, {
      cli: ({ log: cliLogSpy })
    });

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless);

    // Invoke the actual deploy function
    const removeFn = plugin.hooks['after:remove:remove'];
    await expectAsync(removeFn()).toBeResolved();

    expect(requestSpy).not.toHaveBeenCalledWith('CloudWatchLogs', 'deleteLogGroup', jasmine.anything());
    expect(cliLogSpy).toHaveBeenCalledWith(jasmine.stringMatching('API Gateway Execution log group not found'));
  });

  it('should delete the API Gateway execution log group retention when removing the stack', async () => {
    const logGroupResult = {
      logGroups: [
        { logGroupName: '/aws/lambda/sws-app-ada-reservations-cleanup' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/thor' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/master' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    const requestSpy = jasmine.createSpy('request')
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.resolveTo(logGroupResult)
      .withArgs('CloudWatchLogs', 'deleteLogGroup', jasmine.anything()).and.resolveTo();
    const cliLogSpy = jasmine.createSpy();
    const serverless = jasmine.createSpyObj<Serverless>({
      getProvider: ({
        request: requestSpy,
        getStage: jasmine.createSpy().and.returnValue('thor'),
        logRetentionInDays: 5
      } as unknown as Aws)
    }, {
      cli: ({ log: cliLogSpy })
    });

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless);

    // Invoke the actual deploy function
    const removeFn = plugin.hooks['after:remove:remove'];
    await expectAsync(removeFn()).toBeResolved();

    expect(requestSpy).toHaveBeenCalledWith('CloudWatchLogs', 'deleteLogGroup', jasmine.objectContaining<CloudWatchLogs.DeleteLogGroupRequest>({
      logGroupName: jasmine.stringMatching('thor')
    }));
    expect(cliLogSpy).toHaveBeenCalledWith(jasmine.stringMatching('log group is being removed'));
  });

  it('should delete the API Gateway execution log group retention when removing the stack and the describeLogGroups response is paged', async () => {
    const logGroupResult1 = {
      logGroups: [
        { logGroupName: '/aws/lambda/sws-app-ada-reservations-cleanup' },
      ],
      nextToken: 'page-token'
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    const logGroupResult2 = {
      logGroups: [
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/master' },
        { logGroupName: 'API-Gateway-Execution-Logs_8e24r4xy0g/thor' },
      ]
    } as CloudWatchLogs.DescribeLogGroupsResponse;
    const requestSpy = jasmine.createSpy('request')
      .withArgs('CloudWatchLogs', 'describeLogGroups', jasmine.anything()).and.returnValues(
        Promise.resolve(logGroupResult1),
        Promise.resolve(logGroupResult2)
      )
      .withArgs('CloudWatchLogs', 'deleteLogGroup', jasmine.anything()).and.resolveTo();
    const serverless = jasmine.createSpyObj<Serverless>({
      getProvider: ({
        request: requestSpy,
        getStage: jasmine.createSpy().and.returnValue('thor'),
        getLogRetentionInDays: jasmine.createSpy().and.returnValue(5)
      } as unknown as Aws)
    }, {
      cli: ({ log: jasmine.createSpy() })
    });

    const plugin = new ServerlessApiGatewayExecutionLogManager(serverless);

    // Invoke the actual deploy function
    const removeFn = plugin.hooks['after:remove:remove'];
    await expectAsync(removeFn()).toBeResolved();

    expect(requestSpy).toHaveBeenCalledTimes(3); // 2 describes + 1 delete
    expect(requestSpy).toHaveBeenCalledWith('CloudWatchLogs', 'describeLogGroups', jasmine.objectContaining<CloudWatchLogs.DescribeLogGroupsRequest>({
      nextToken: 'page-token'
    }));
    expect(requestSpy).toHaveBeenCalledWith('CloudWatchLogs', 'deleteLogGroup', jasmine.objectContaining<CloudWatchLogs.DeleteLogGroupRequest>({
      logGroupName: jasmine.stringMatching('thor')
    }));
  });
});
