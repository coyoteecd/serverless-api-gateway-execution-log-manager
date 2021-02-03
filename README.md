# serverless-api-gateway-execution-log-manager

[![serverless][icon-serverless]][link-serverless]
[![license][icon-lic]][link-lic]
[![build status][icon-ci]][link-ci]
[![npm version][icon-npm]][link-npm]

This Serverless Framework plugin manages the API Gateway execution log groups automatically created in CloudWatch when [execution logging](https://www.serverless.com/framework/docs/providers/aws/events/apigateway#logs) is enabled in `serverless.yml`. When enabling these logs, API Gateway automatically creates a CloudWatch log group named `API-Gateway-Execution-Logs_[uniqueId]/[stage]`. This log group is not part of the CloudFormation stack deployed by Serverless Framework. 

## Installation

```
npm install serverless-api-gateway-execution-log-manager --save-dev
```

## Usage

Add the following to your `serverless.yml`:

Add the following to your `serverless.yml`:

```yml
plugins:
  - serverless-api-gateway-execution-log-manager
  
provider:
  logs:
    restApi:
      level: INFO
      executionLogging: true      
      fullExecutionData: true
```

This plugin does not have any configuration options (yet).

[//]: # (Note: icon sources seem to be random. It's just because shields.io is extremely slow so using alternatives whenever possible)
[icon-serverless]: http://public.serverless.com/badges/v3.svg
[icon-lic]: https://img.shields.io/github/license/coyoteecd/serverless-api-gateway-execution-log-manager
[icon-ci]: https://travis-ci.com/coyoteecd/serverless-api-gateway-execution-log-manager.svg?branch=master
[icon-npm]: https://badge.fury.io/js/serverless-api-gateway-execution-log-manager.svg

[link-serverless]: http://www.serverless.com
[link-lic]: https://github.com/coyoteecd/serverless-api-gateway-execution-log-manager/blob/master/LICENSE
[link-ci]: https://travis-ci.com/coyoteecd/serverless-api-gateway-execution-log-manager
[link-npm]: https://www.npmjs.com/package/serverless-api-gateway-execution-log-manager
