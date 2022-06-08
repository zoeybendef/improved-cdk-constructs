"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatadogAWSIntegrationStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const datadog_cw_kinesis_datadog_construct_1 = require("./datadog-cw-kinesis-datadog-construct");
const datadog_integration_construct_1 = require("./datadog-integration-construct");
class DatadogAWSIntegrationStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        new datadog_integration_construct_1.DatadogIntegration(this, 'DatadogIntegrationConstruct', props);
        new datadog_cw_kinesis_datadog_construct_1.KinesisToDatadogStream(this, 'DatadogKinesisIntegration', {
            datadogApiKeySecretName: props.apiKey
        });
    }
}
exports.DatadogAWSIntegrationStack = DatadogAWSIntegrationStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWRvZy1pbnRlZ3JhdGlvbi1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGFkb2ctaW50ZWdyYXRpb24tc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQW9DO0FBR3BDLGlHQUFnRjtBQUNoRixtRkFBcUU7QUFHckUsTUFBYSwwQkFBMkIsU0FBUSxtQkFBSztJQUNqRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNDO1FBQzVFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLElBQUksa0RBQWtCLENBQUMsSUFBSSxFQUFFLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ2xFLElBQUksNkRBQXNCLENBQUMsSUFBSSxFQUFFLDJCQUEyQixFQUFFO1lBQzFELHVCQUF1QixFQUFFLEtBQUssQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztJQUVQLENBQUM7Q0FDSjtBQVZELGdFQVVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU3RhY2sgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XG5pbXBvcnQgeyBEYXRhZG9nQVdTSW50ZWdyYXRpb25TdGFja1Byb3BzIH0gZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvbGliL2ludGVncmF0aW9ucy9kYXRhZG9nL2ludGVmYWNlc1wiO1xuaW1wb3J0IHsgS2luZXNpc1RvRGF0YWRvZ1N0cmVhbSB9IGZyb20gXCIuL2RhdGFkb2ctY3cta2luZXNpcy1kYXRhZG9nLWNvbnN0cnVjdFwiO1xuaW1wb3J0IHsgRGF0YWRvZ0ludGVncmF0aW9uIH0gZnJvbSBcIi4vZGF0YWRvZy1pbnRlZ3JhdGlvbi1jb25zdHJ1Y3RcIjtcbmltcG9ydCB7IERhdGFkb2dPcGVyYXRvciB9IGZyb20gXCIuL2RhdGFkb2ctb3BlcmF0b3ItY29uc3RydWN0XCI7XG5cbmV4cG9ydCBjbGFzcyBEYXRhZG9nQVdTSW50ZWdyYXRpb25TdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRGF0YWRvZ0FXU0ludGVncmF0aW9uU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICBuZXcgRGF0YWRvZ0ludGVncmF0aW9uKHRoaXMsICdEYXRhZG9nSW50ZWdyYXRpb25Db25zdHJ1Y3QnLCBwcm9wcylcbiAgICAgICAgbmV3IEtpbmVzaXNUb0RhdGFkb2dTdHJlYW0odGhpcywgJ0RhdGFkb2dLaW5lc2lzSW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgICBkYXRhZG9nQXBpS2V5U2VjcmV0TmFtZTogcHJvcHMuYXBpS2V5XG4gICAgICAgIH0pO1xuXG4gICAgfVxufSJdfQ==