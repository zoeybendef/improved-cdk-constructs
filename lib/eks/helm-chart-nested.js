"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelmChartNestedStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
class HelmChartNestedStack extends aws_cdk_lib_1.NestedStack {
    constructor(scope, id, chart, cluster, props) {
        super(scope, id);
        this.chart = chart;
        this.installHelmChart(cluster);
    }
    installHelmChart(cluster) {
        const helmChart = new aws_eks_1.HelmChart(this, this.chart.name, {
            chart: this.chart.chart,
            cluster: cluster,
            namespace: this.chart.namespace,
            repository: this.chart.repository,
            values: this.chart.values,
            release: this.chart.release,
            version: this.chart.version,
            createNamespace: this.chart.createNamespace,
        });
    }
}
exports.HelmChartNestedStack = HelmChartNestedStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVsbS1jaGFydC1uZXN0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoZWxtLWNoYXJ0LW5lc3RlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSw2Q0FBMEM7QUFDMUMsaURBQWdEO0FBSWhELE1BQWEsb0JBQXFCLFNBQVEseUJBQVc7SUFJbkQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFlLEVBQUUsT0FBb0IsRUFBRSxLQUFzQjtRQUNyRyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUVoQyxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsT0FBb0I7UUFFbkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxtQkFBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtZQUNyRCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLO1lBQ3ZCLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLFNBQVMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVM7WUFDL0IsVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVTtZQUNqQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO1lBQ3pCLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU87WUFDM0IsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTztZQUMzQixlQUFlLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlO1NBQzVDLENBQUMsQ0FBQztJQUVMLENBQUM7Q0FJRjtBQTdCRCxvREE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZWtzID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVrcycpO1xuaW1wb3J0IGNkayA9IHJlcXVpcmUoJ2F3cy1jZGstbGliJyk7XG5pbXBvcnQgeyBOZXN0ZWRTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEhlbG1DaGFydCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1la3MnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBFS1NDaGFydCB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvbGliL2Vrcy9pbnRlcmZhY2VzJztcblxuZXhwb3J0IGNsYXNzIEhlbG1DaGFydE5lc3RlZFN0YWNrIGV4dGVuZHMgTmVzdGVkU3RhY2sge1xuXG4gIGNoYXJ0OiBFS1NDaGFydDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBjaGFydDogRUtTQ2hhcnQsIGNsdXN0ZXI6IGVrcy5DbHVzdGVyLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIHRoaXMuY2hhcnQgPSBjaGFydDtcbiAgICB0aGlzLmluc3RhbGxIZWxtQ2hhcnQoY2x1c3RlcilcblxuICB9XG5cbiAgaW5zdGFsbEhlbG1DaGFydChjbHVzdGVyOiBla3MuQ2x1c3Rlcikge1xuXG4gICAgY29uc3QgaGVsbUNoYXJ0ID0gbmV3IEhlbG1DaGFydCh0aGlzLCB0aGlzLmNoYXJ0Lm5hbWUsIHtcbiAgICAgIGNoYXJ0OiB0aGlzLmNoYXJ0LmNoYXJ0LFxuICAgICAgY2x1c3RlcjogY2x1c3RlcixcbiAgICAgIG5hbWVzcGFjZTogdGhpcy5jaGFydC5uYW1lc3BhY2UsXG4gICAgICByZXBvc2l0b3J5OiB0aGlzLmNoYXJ0LnJlcG9zaXRvcnksXG4gICAgICB2YWx1ZXM6IHRoaXMuY2hhcnQudmFsdWVzLFxuICAgICAgcmVsZWFzZTogdGhpcy5jaGFydC5yZWxlYXNlLFxuICAgICAgdmVyc2lvbjogdGhpcy5jaGFydC52ZXJzaW9uLFxuICAgICAgY3JlYXRlTmFtZXNwYWNlOiB0aGlzLmNoYXJ0LmNyZWF0ZU5hbWVzcGFjZSxcbiAgICB9KTtcblxuICB9XG5cblxuXG59XG5cbiJdfQ==