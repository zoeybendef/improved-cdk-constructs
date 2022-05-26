"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableAWSLogServices = exports.createAWSLambdaARN = exports.configureLogCollection = exports.setupDatadogIntegration = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const datadog_api_client_1 = require("@datadog/datadog-api-client");
const process_1 = require("process");
const API_KEY_SECRET = '/account/datadog/api-key';
const APP_KEY_SECRET = '/account/datadog/app-key';
const EXTERNAL_ID_SECRET = '/account/datadog/external-id';
async function setupDatadogIntegration(apiKey, appKey) {
    return await createAWSIntegration(apiKey, appKey)
        .then((externalId) => {
        if (externalId) {
            createExternalIDSecret(externalId);
            return externalId;
            // .then((data) => externalId)
            // .catch((err) => console.error("[Datadog] Unable to update external id to secret"))
        }
        else {
            // Could be an update // we get external id
            const s = getSecretValue(EXTERNAL_ID_SECRET, `[Datadog] Unable to get secret at ${EXTERNAL_ID_SECRET}`);
            return s;
            // .then((v) => JSON.parse(v).id)
            // .catch((err) => console.log("[Datadog]Unable to get secret"))
        }
    }).catch((err) => console.error("[Datadog] Unable to create AWS Integration", err));
}
exports.setupDatadogIntegration = setupDatadogIntegration;
async function createExternalIDSecret(externalId) {
    const client = getSecretManagerClient();
    const cmd = new client_secrets_manager_1.CreateSecretCommand({
        Name: EXTERNAL_ID_SECRET,
        Description: 'External ID associated with Datadog AWS Integration',
        SecretString: `{"id": "${externalId}"}`,
    });
    await client.send(cmd).then((data) => {
        console.log("[Datadog] External ID secret created");
        return 'OK';
    }).catch((err) => {
        console.error(`[Datadog] Unable to create secret at location /account/datadog/external-id`, err);
        process_1.exit(1);
    });
}
function getSecretManagerClient() {
    const client = new client_secrets_manager_1.SecretsManagerClient({ region: process.env.CDK_DEFAULT_REGION });
    return client;
}
async function getAPIKey(apiKey, appKey) {
    const apiKeyVal = await getSecretValue(apiKey, `[Datadog] Unable to find secret ${apiKey}. Ensure only value is stored in secret`);
    const appKeyVal = await getSecretValue(appKey, `[Datadog] Unable to find secret ${appKey}. Ensure only value is stored in secret`);
    return [apiKeyVal, appKeyVal];
}
async function getSecretValue(secretId, errorString) {
    const client = getSecretManagerClient();
    const cmd = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretId });
    return await client.send(cmd).then((data) => {
        return data.SecretString;
    });
    // .catch((err) => {
    //     console.error(errorString)
    //     exit(1)
    // })
}
function createAPIInstance(apiKey, appKey) {
    const configuration = datadog_api_client_1.v1.createConfiguration({
        authMethods: {
            apiKeyAuth: apiKey,
            appKeyAuth: appKey
        }
    });
    const apiInstance = new datadog_api_client_1.v1.AWSIntegrationApi(configuration);
    return apiInstance;
}
async function createAWSIntegration(apiKey, appKey) {
    /**
     * Get all AWS tag filters returns "OK" response
     */
    return await getAPIKey(apiKey, appKey)
        .then(([apiKeyValue, appKeyValue]) => {
        console.log('[Datadog] Read secrets');
        const apiInstance = createAPIInstance(apiKeyValue, appKeyValue);
        return updateAWSAPIIntegration(apiInstance)
            .then((data) => {
            console.log("[Datadog] Updated account successfully");
            return;
        }).catch((error) => {
            console.log("[Datadog] Failed to update configuration, trying to create it instead");
            return createAWSAPIIntegration(apiInstance)
                .then((data) => { return data.externalId; })
                .catch((error) => { console.error(error); process_1.exit(1); });
        });
    }).catch((err) => {
        console.error("[Datadog] Failed to get APP Key", err);
        process_1.exit(1);
    });
}
function createAWSAPIIntegration(apiInstance) {
    const params = {
        body: {
            accountId: process.env.CDK_DEFAULT_ACCOUNT,
            filterTags: [`account_name:${process.env.ACCOUNT_NAME}`],
            hostTags: [`account_name:${process.env.ACCOUNT_NAME}`],
            metricsCollectionEnabled: true,
            resourceCollectionEnabled: true,
            cspmResourceCollectionEnabled: true,
            // excludedRegions: ["us-east-1", "us-west-2"],
            roleName: "DatadogAWSIntegrationRole",
        },
    };
    return apiInstance
        .createAWSAccount(params);
}
async function updateAWSAPIIntegration(apiInstance) {
    const params = {
        body: {
            accountId: process.env.CDK_DEFAULT_ACCOUNT,
            filterTags: [`account_name:${process.env.ACCOUNT_NAME}`],
            hostTags: [`account_name:${process.env.ACCOUNT_NAME}`],
            metricsCollectionEnabled: true,
            resourceCollectionEnabled: true,
        },
        accountId: process.env.CDK_DEFAULT_ACCOUNT,
        roleName: "DatadogAWSIntegrationRole",
    };
    return await apiInstance
        .updateAWSAccount(params);
}
// Deprecated ?
async function configureLogCollection(lambdaArn, services, secretKey) {
    // const secret = await getAPIKey(API_KEY_SECRET, APP_KEY_SECRET)
    const configuration = datadog_api_client_1.v1.createConfiguration({
        authMethods: {
            apiKeyAuth: API_KEY_SECRET,
            appKeyAuth: APP_KEY_SECRET
        }
    });
    // This is created after integration is created, along with forwarder stack.
    await createAWSLambdaARN(new datadog_api_client_1.v1.AWSLogsIntegrationApi(configuration), lambdaArn);
    await enableAWSLogServices(new datadog_api_client_1.v1.AWSLogsIntegrationApi(configuration), services);
}
exports.configureLogCollection = configureLogCollection;
async function createAWSLambdaARN(apiInstance, lambdaArn) {
    const params = {
        body: {
            accountId: process.env.CDK_DEFAULT_ACCOUNT,
            lambdaArn: lambdaArn,
        },
    };
    await apiInstance
        .createAWSLambdaARN(params)
        .then((data) => console.log("[Datadog] Lambda Integration for logs created"))
        .catch((error) => {
        console.error(error);
        process_1.exit(1);
    });
}
exports.createAWSLambdaARN = createAWSLambdaARN;
async function enableAWSLogServices(apiInstance, services = ["lambda"]) {
    const params = {
        body: {
            accountId: process.env.CDK_DEFAULT_ACCOUNT,
            services: services
        },
    };
    await apiInstance
        .enableAWSLogServices(params)
        .then((data) => console.log(`[Datadog] Enabled services for ${services}`))
        .catch((error) => { console.error(error); process_1.exit(1); });
}
exports.enableAWSLogServices = enableAWSLogServices;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dXAtaW50ZWdyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXR1cC1pbnRlZ3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0RUFBbUg7QUFDbkgsb0VBQWlEO0FBQ2pELHFDQUErQjtBQUUvQixNQUFNLGNBQWMsR0FBRywwQkFBMEIsQ0FBQTtBQUNqRCxNQUFNLGNBQWMsR0FBRywwQkFBMEIsQ0FBQTtBQUNqRCxNQUFNLGtCQUFrQixHQUFHLDhCQUE4QixDQUFBO0FBR2xELEtBQUssVUFBVSx1QkFBdUIsQ0FBQyxNQUFjLEVBQUUsTUFBYztJQUN4RSxPQUFPLE1BQU0sb0JBQW9CLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztTQUM1QyxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTtRQUNqQixJQUFJLFVBQVUsRUFBRTtZQUNaLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQ2xDLE9BQU8sVUFBVSxDQUFBO1lBQ2pCLDhCQUE4QjtZQUM5QixxRkFBcUY7U0FDeEY7YUFBTTtZQUNILDJDQUEyQztZQUMzQyxNQUFNLENBQUMsR0FBRyxjQUFjLENBQUMsa0JBQWtCLEVBQUUscUNBQXFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQTtZQUN2RyxPQUFPLENBQUMsQ0FBQTtZQUNSLGlDQUFpQztZQUNqQyxnRUFBZ0U7U0FDbkU7SUFFTCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsNENBQTRDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUczRixDQUFDO0FBbkJELDBEQW1CQztBQUVELEtBQUssVUFBVSxzQkFBc0IsQ0FBQyxVQUFrQjtJQUNwRCxNQUFNLE1BQU0sR0FBRyxzQkFBc0IsRUFBRSxDQUFBO0lBQ3ZDLE1BQU0sR0FBRyxHQUFHLElBQUksNENBQW1CLENBQUM7UUFDaEMsSUFBSSxFQUFFLGtCQUFrQjtRQUN4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QUcsQ0FBQyxtQkFBb0I7WUFDM0MsU0FBUyxFQUFFLFNBQVM7U0FDdkI7S0FDSixDQUFDO0lBRUYsTUFBTSxXQUFXO1NBQ1osa0JBQWtCLENBQUMsTUFBTSxDQUFDO1NBQzFCLElBQUksQ0FBQyxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1NBQ2pGLEtBQUssQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO1FBQ2xCLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDcEIsY0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBaEJELGdEQWdCQztBQUVNLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxXQUFxQyxFQUFFLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQztJQUVuRyxNQUFNLE1BQU0sR0FBd0Q7UUFDaEUsSUFBSSxFQUFFO1lBQ0YsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW9CO1lBQzNDLFFBQVEsRUFBRSxRQUFRO1NBQ3JCO0tBQ0osQ0FBQztJQUVGLE1BQU0sV0FBVztTQUNaLG9CQUFvQixDQUFDLE1BQU0sQ0FBQztTQUM1QixJQUFJLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDOUUsS0FBSyxDQUFDLENBQUMsS0FBVSxFQUFFLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsY0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEUsQ0FBQztBQWJELG9EQWFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3JlYXRlU2VjcmV0Q29tbWFuZCwgR2V0U2VjcmV0VmFsdWVDb21tYW5kLCBTZWNyZXRzTWFuYWdlckNsaWVudCB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtc2VjcmV0cy1tYW5hZ2VyXCI7XG5pbXBvcnQgeyB2MSB9IGZyb20gXCJAZGF0YWRvZy9kYXRhZG9nLWFwaS1jbGllbnRcIjtcbmltcG9ydCB7IGV4aXQgfSBmcm9tIFwicHJvY2Vzc1wiO1xuXG5jb25zdCBBUElfS0VZX1NFQ1JFVCA9ICcvYWNjb3VudC9kYXRhZG9nL2FwaS1rZXknXG5jb25zdCBBUFBfS0VZX1NFQ1JFVCA9ICcvYWNjb3VudC9kYXRhZG9nL2FwcC1rZXknXG5jb25zdCBFWFRFUk5BTF9JRF9TRUNSRVQgPSAnL2FjY291bnQvZGF0YWRvZy9leHRlcm5hbC1pZCdcblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXBEYXRhZG9nSW50ZWdyYXRpb24oYXBpS2V5OiBzdHJpbmcsIGFwcEtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGF3YWl0IGNyZWF0ZUFXU0ludGVncmF0aW9uKGFwaUtleSwgYXBwS2V5KVxuICAgICAgICAudGhlbigoZXh0ZXJuYWxJZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV4dGVybmFsSWQpIHtcbiAgICAgICAgICAgICAgICBjcmVhdGVFeHRlcm5hbElEU2VjcmV0KGV4dGVybmFsSWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4dGVybmFsSWRcbiAgICAgICAgICAgICAgICAvLyAudGhlbigoZGF0YSkgPT4gZXh0ZXJuYWxJZClcbiAgICAgICAgICAgICAgICAvLyAuY2F0Y2goKGVycikgPT4gY29uc29sZS5lcnJvcihcIltEYXRhZG9nXSBVbmFibGUgdG8gdXBkYXRlIGV4dGVybmFsIGlkIHRvIHNlY3JldFwiKSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQ291bGQgYmUgYW4gdXBkYXRlIC8vIHdlIGdldCBleHRlcm5hbCBpZFxuICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBnZXRTZWNyZXRWYWx1ZShFWFRFUk5BTF9JRF9TRUNSRVQsIGBbRGF0YWRvZ10gVW5hYmxlIHRvIGdldCBzZWNyZXQgYXQgJHtFWFRFUk5BTF9JRF9TRUNSRVR9YClcbiAgICAgICAgICAgICAgICByZXR1cm4gc1xuICAgICAgICAgICAgICAgIC8vIC50aGVuKCh2KSA9PiBKU09OLnBhcnNlKHYpLmlkKVxuICAgICAgICAgICAgICAgIC8vIC5jYXRjaCgoZXJyKSA9PiBjb25zb2xlLmxvZyhcIltEYXRhZG9nXVVuYWJsZSB0byBnZXQgc2VjcmV0XCIpKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IGNvbnNvbGUuZXJyb3IoXCJbRGF0YWRvZ10gVW5hYmxlIHRvIGNyZWF0ZSBBV1MgSW50ZWdyYXRpb25cIiwgZXJyKSlcblxuXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUV4dGVybmFsSURTZWNyZXQoZXh0ZXJuYWxJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2xpZW50ID0gZ2V0U2VjcmV0TWFuYWdlckNsaWVudCgpXG4gICAgY29uc3QgY21kID0gbmV3IENyZWF0ZVNlY3JldENvbW1hbmQoe1xuICAgICAgICBOYW1lOiBFWFRFUk5BTF9JRF9TRUNSRVQsXG4gICAgICAgIERlc2NyaXB0aW9uOiAnRXh0ZXJuYWwgSUQgYXNzb2NpYXRlZCB3aXRoIERhdGFkb2cgQVdTIEludGVncmF0aW9uJyxcbiAgICAgICAgU2VjcmV0U3RyaW5nOiBge1wiaWRcIjogXCIke2V4dGVybmFsSWR9XCJ9YCxcbiAgICB9KTtcblxuICAgIGF3YWl0IGNsaWVudC5zZW5kKGNtZCkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIltEYXRhZG9nXSBFeHRlcm5hbCBJRCBzZWNyZXQgY3JlYXRlZFwiKVxuICAgICAgICByZXR1cm4gJ09LJ1xuICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW0RhdGFkb2ddIFVuYWJsZSB0byBjcmVhdGUgc2VjcmV0IGF0IGxvY2F0aW9uIC9hY2NvdW50L2RhdGFkb2cvZXh0ZXJuYWwtaWRgLCBlcnIpXG4gICAgICAgIGV4aXQoMSlcbiAgICB9KTtcblxufVxuXG5mdW5jdGlvbiBnZXRTZWNyZXRNYW5hZ2VyQ2xpZW50KCk6IFNlY3JldHNNYW5hZ2VyQ2xpZW50IHtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgU2VjcmV0c01hbmFnZXJDbGllbnQoeyByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB9KVxuICAgIHJldHVybiBjbGllbnRcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QVBJS2V5KGFwaUtleTogc3RyaW5nLCBhcHBLZXk6IHN0cmluZykge1xuICAgIGNvbnN0IGFwaUtleVZhbCA9IGF3YWl0IGdldFNlY3JldFZhbHVlKFxuICAgICAgICBhcGlLZXksXG4gICAgICAgIGBbRGF0YWRvZ10gVW5hYmxlIHRvIGZpbmQgc2VjcmV0ICR7YXBpS2V5fS4gRW5zdXJlIG9ubHkgdmFsdWUgaXMgc3RvcmVkIGluIHNlY3JldGBcbiAgICApXG4gICAgY29uc3QgYXBwS2V5VmFsID0gYXdhaXQgZ2V0U2VjcmV0VmFsdWUoXG4gICAgICAgIGFwcEtleSxcbiAgICAgICAgYFtEYXRhZG9nXSBVbmFibGUgdG8gZmluZCBzZWNyZXQgJHthcHBLZXl9LiBFbnN1cmUgb25seSB2YWx1ZSBpcyBzdG9yZWQgaW4gc2VjcmV0YFxuICAgIClcblxuICAgIHJldHVybiBbYXBpS2V5VmFsLCBhcHBLZXlWYWxdXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFNlY3JldFZhbHVlKHNlY3JldElkOiBzdHJpbmcsIGVycm9yU3RyaW5nOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjbGllbnQgPSBnZXRTZWNyZXRNYW5hZ2VyQ2xpZW50KClcbiAgICBjb25zdCBjbWQgPSBuZXcgR2V0U2VjcmV0VmFsdWVDb21tYW5kKHsgU2VjcmV0SWQ6IHNlY3JldElkIH0pXG5cbiAgICByZXR1cm4gYXdhaXQgY2xpZW50LnNlbmQoY21kKS50aGVuKChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIGRhdGEuU2VjcmV0U3RyaW5nIVxuICAgIH0pXG4gICAgLy8gLmNhdGNoKChlcnIpID0+IHtcbiAgICAvLyAgICAgY29uc29sZS5lcnJvcihlcnJvclN0cmluZylcbiAgICAvLyAgICAgZXhpdCgxKVxuICAgIC8vIH0pXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFQSUluc3RhbmNlKGFwaUtleTogc3RyaW5nLCBhcHBLZXk6IHN0cmluZyk6IHYxLkFXU0ludGVncmF0aW9uQXBpIHtcbiAgICBjb25zdCBjb25maWd1cmF0aW9uID0gdjEuY3JlYXRlQ29uZmlndXJhdGlvbih7XG4gICAgICAgIGF1dGhNZXRob2RzOiB7XG4gICAgICAgICAgICBhcGlLZXlBdXRoOiBhcGlLZXksXG4gICAgICAgICAgICBhcHBLZXlBdXRoOiBhcHBLZXlcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IGFwaUluc3RhbmNlID0gbmV3IHYxLkFXU0ludGVncmF0aW9uQXBpKGNvbmZpZ3VyYXRpb24pO1xuXG4gICAgcmV0dXJuIGFwaUluc3RhbmNlXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUFXU0ludGVncmF0aW9uKGFwaUtleTogc3RyaW5nLCBhcHBLZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBBV1MgdGFnIGZpbHRlcnMgcmV0dXJucyBcIk9LXCIgcmVzcG9uc2VcbiAgICAgKi9cblxuICAgIHJldHVybiBhd2FpdCBnZXRBUElLZXkoYXBpS2V5LCBhcHBLZXkpXG4gICAgICAgIC50aGVuKChbYXBpS2V5VmFsdWUsIGFwcEtleVZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tEYXRhZG9nXSBSZWFkIHNlY3JldHMnKVxuICAgICAgICAgICAgY29uc3QgYXBpSW5zdGFuY2UgPSBjcmVhdGVBUElJbnN0YW5jZShhcGlLZXlWYWx1ZSwgYXBwS2V5VmFsdWUpXG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlQVdTQVBJSW50ZWdyYXRpb24oYXBpSW5zdGFuY2UpXG4gICAgICAgICAgICAgICAgLnRoZW4oKGRhdGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIltEYXRhZG9nXSBVcGRhdGVkIGFjY291bnQgc3VjY2Vzc2Z1bGx5XCIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiW0RhdGFkb2ddIEZhaWxlZCB0byB1cGRhdGUgY29uZmlndXJhdGlvbiwgdHJ5aW5nIHRvIGNyZWF0ZSBpdCBpbnN0ZWFkXCIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjcmVhdGVBV1NBUElJbnRlZ3JhdGlvbihhcGlJbnN0YW5jZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKChkYXRhOiB2MS5BV1NBY2NvdW50Q3JlYXRlUmVzcG9uc2UpID0+IHsgcmV0dXJuIGRhdGEuZXh0ZXJuYWxJZCB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogYW55KSA9PiB7IGNvbnNvbGUuZXJyb3IoZXJyb3IpOyBleGl0KDEpIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbRGF0YWRvZ10gRmFpbGVkIHRvIGdldCBBUFAgS2V5XCIsIGVycilcbiAgICAgICAgICAgIGV4aXQoMSlcbiAgICAgICAgfSlcblxufVxuXG5mdW5jdGlvbiBjcmVhdGVBV1NBUElJbnRlZ3JhdGlvbihhcGlJbnN0YW5jZTogdjEuQVdTSW50ZWdyYXRpb25BcGkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHBhcmFtczogdjEuQVdTSW50ZWdyYXRpb25BcGlDcmVhdGVBV1NBY2NvdW50UmVxdWVzdCA9IHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWNjb3VudElkOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UISxcbiAgICAgICAgICAgIGZpbHRlclRhZ3M6IFtgYWNjb3VudF9uYW1lOiR7cHJvY2Vzcy5lbnYuQUNDT1VOVF9OQU1FfWBdLFxuICAgICAgICAgICAgaG9zdFRhZ3M6IFtgYWNjb3VudF9uYW1lOiR7cHJvY2Vzcy5lbnYuQUNDT1VOVF9OQU1FfWBdLFxuICAgICAgICAgICAgbWV0cmljc0NvbGxlY3Rpb25FbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgcmVzb3VyY2VDb2xsZWN0aW9uRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGNzcG1SZXNvdXJjZUNvbGxlY3Rpb25FbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgLy8gZXhjbHVkZWRSZWdpb25zOiBbXCJ1cy1lYXN0LTFcIiwgXCJ1cy13ZXN0LTJcIl0sXG4gICAgICAgICAgICByb2xlTmFtZTogXCJEYXRhZG9nQVdTSW50ZWdyYXRpb25Sb2xlXCIsXG4gICAgICAgIH0sXG4gICAgfTtcblxuICAgIHJldHVybiBhcGlJbnN0YW5jZVxuICAgICAgICAuY3JlYXRlQVdTQWNjb3VudChwYXJhbXMpXG5cbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlQVdTQVBJSW50ZWdyYXRpb24oYXBpSW5zdGFuY2U6IHYxLkFXU0ludGVncmF0aW9uQXBpKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBwYXJhbXM6IHYxLkFXU0ludGVncmF0aW9uQXBpVXBkYXRlQVdTQWNjb3VudFJlcXVlc3QgPSB7XG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjY291bnRJZDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCEsXG4gICAgICAgICAgICBmaWx0ZXJUYWdzOiBbYGFjY291bnRfbmFtZToke3Byb2Nlc3MuZW52LkFDQ09VTlRfTkFNRX1gXSxcbiAgICAgICAgICAgIGhvc3RUYWdzOiBbYGFjY291bnRfbmFtZToke3Byb2Nlc3MuZW52LkFDQ09VTlRfTkFNRX1gXSxcbiAgICAgICAgICAgIG1ldHJpY3NDb2xsZWN0aW9uRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIHJlc291cmNlQ29sbGVjdGlvbkVuYWJsZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGFjY291bnRJZDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCEsXG4gICAgICAgIHJvbGVOYW1lOiBcIkRhdGFkb2dBV1NJbnRlZ3JhdGlvblJvbGVcIixcbiAgICB9O1xuXG4gICAgcmV0dXJuIGF3YWl0IGFwaUluc3RhbmNlXG4gICAgICAgIC51cGRhdGVBV1NBY2NvdW50KHBhcmFtcylcbn1cblxuLy8gRGVwcmVjYXRlZCA/XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29uZmlndXJlTG9nQ29sbGVjdGlvbihsYW1iZGFBcm46IHN0cmluZywgc2VydmljZXM/OiBzdHJpbmdbXSwgc2VjcmV0S2V5Pzogc3RyaW5nKSB7XG4gICAgLy8gY29uc3Qgc2VjcmV0ID0gYXdhaXQgZ2V0QVBJS2V5KEFQSV9LRVlfU0VDUkVULCBBUFBfS0VZX1NFQ1JFVClcbiAgICBjb25zdCBjb25maWd1cmF0aW9uID0gdjEuY3JlYXRlQ29uZmlndXJhdGlvbih7XG4gICAgICAgIGF1dGhNZXRob2RzOiB7XG4gICAgICAgICAgICBhcGlLZXlBdXRoOiBBUElfS0VZX1NFQ1JFVCxcbiAgICAgICAgICAgIGFwcEtleUF1dGg6IEFQUF9LRVlfU0VDUkVUXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBUaGlzIGlzIGNyZWF0ZWQgYWZ0ZXIgaW50ZWdyYXRpb24gaXMgY3JlYXRlZCwgYWxvbmcgd2l0aCBmb3J3YXJkZXIgc3RhY2suXG5cbiAgICBhd2FpdCBjcmVhdGVBV1NMYW1iZGFBUk4obmV3IHYxLkFXU0xvZ3NJbnRlZ3JhdGlvbkFwaShjb25maWd1cmF0aW9uKSwgbGFtYmRhQXJuKVxuICAgIGF3YWl0IGVuYWJsZUFXU0xvZ1NlcnZpY2VzKG5ldyB2MS5BV1NMb2dzSW50ZWdyYXRpb25BcGkoY29uZmlndXJhdGlvbiksIHNlcnZpY2VzKVxuXG5cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUFXU0xhbWJkYUFSTihhcGlJbnN0YW5jZTogdjEuQVdTTG9nc0ludGVncmF0aW9uQXBpLCBsYW1iZGFBcm46IHN0cmluZykge1xuXG4gICAgY29uc3QgcGFyYW1zOiB2MS5BV1NMb2dzSW50ZWdyYXRpb25BcGlDcmVhdGVBV1NMYW1iZGFBUk5SZXF1ZXN0ID0ge1xuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY2NvdW50SWQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQhLFxuICAgICAgICAgICAgbGFtYmRhQXJuOiBsYW1iZGFBcm4sXG4gICAgICAgIH0sXG4gICAgfTtcblxuICAgIGF3YWl0IGFwaUluc3RhbmNlXG4gICAgICAgIC5jcmVhdGVBV1NMYW1iZGFBUk4ocGFyYW1zKVxuICAgICAgICAudGhlbigoZGF0YTogYW55KSA9PiBjb25zb2xlLmxvZyhcIltEYXRhZG9nXSBMYW1iZGEgSW50ZWdyYXRpb24gZm9yIGxvZ3MgY3JlYXRlZFwiKSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICAgICAgZXhpdCgxKVxuICAgICAgICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuYWJsZUFXU0xvZ1NlcnZpY2VzKGFwaUluc3RhbmNlOiB2MS5BV1NMb2dzSW50ZWdyYXRpb25BcGksIHNlcnZpY2VzID0gW1wibGFtYmRhXCJdKSB7XG5cbiAgICBjb25zdCBwYXJhbXM6IHYxLkFXU0xvZ3NJbnRlZ3JhdGlvbkFwaUVuYWJsZUFXU0xvZ1NlcnZpY2VzUmVxdWVzdCA9IHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWNjb3VudElkOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UISxcbiAgICAgICAgICAgIHNlcnZpY2VzOiBzZXJ2aWNlc1xuICAgICAgICB9LFxuICAgIH07XG5cbiAgICBhd2FpdCBhcGlJbnN0YW5jZVxuICAgICAgICAuZW5hYmxlQVdTTG9nU2VydmljZXMocGFyYW1zKVxuICAgICAgICAudGhlbigoZGF0YTogYW55KSA9PiBjb25zb2xlLmxvZyhgW0RhdGFkb2ddIEVuYWJsZWQgc2VydmljZXMgZm9yICR7c2VydmljZXN9YCkpXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IGFueSkgPT4geyBjb25zb2xlLmVycm9yKGVycm9yKTsgZXhpdCgxKSB9KTtcbn1cbiJdfQ==