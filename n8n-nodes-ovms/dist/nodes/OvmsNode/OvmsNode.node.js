"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OvmsNode = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class OvmsNode {
    constructor() {
        this.description = {
            displayName: 'OVMS Text Detection',
            name: 'ovmsNode',
            icon: 'file:ovms.svg',
            group: ['transform'],
            version: 1,
            description: 'Run inference on OpenVINO Model Server using preprocessed tensor input',
            defaults: {
                name: 'OVMS Text Detection',
            },
            inputs: ['main'],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'OVMS URL',
                    name: 'ovmsUrl',
                    type: 'string',
                    default: 'http://host.docker.internal:9001',
                },
                {
                    displayName: 'Model Name',
                    name: 'modelName',
                    type: 'string',
                    default: 'text-detection',
                },
                {
                    displayName: 'Confidence Threshold',
                    name: 'threshold',
                    type: 'number',
                    default: 0.5,
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const ovmsUrl = this.getNodeParameter('ovmsUrl', i);
                const modelName = this.getNodeParameter('modelName', i);
                const threshold = this.getNodeParameter('threshold', i);
                const tensor = items[i].json.tensor;
                if (!tensor) {
                    throw new Error('No tensor found in input. Expected: json.tensor');
                }
                const payload = {
                    inputs: [{
                            name: 'Placeholder',
                            shape: [1, 768, 1280, 3],
                            datatype: 'FP32',
                            data: tensor,
                        }],
                };
                const response = await this.helpers.httpRequest({
                    method: 'POST',
                    url: `${ovmsUrl}/v2/models/${modelName}/infer`,
                    body: payload,
                    headers: { 'Content-Type': 'application/json' },
                });
                const segmOutput = response.outputs.find((o) => o.name.includes('segm'));
                const segmData = segmOutput.data;
                const H = 192;
                const W = 320;
                let textPixels = 0;
                for (let row = 0; row < H; row++) {
                    for (let col = 0; col < W; col++) {
                        const idx = (row * W + col) * 2 + 1;
                        if (segmData[idx] > threshold) {
                            textPixels++;
                        }
                    }
                }
                const coverage = (textPixels / (H * W)) * 100;
                returnData.push({
                    json: {
                        text_pixels: textPixels,
                        text_coverage_percent: parseFloat(coverage.toFixed(2)),
                        has_text: textPixels > 100,
                    },
                });
            }
            catch (error) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                    itemIndex: i,
                });
            }
        }
        return [returnData];
    }
}
exports.OvmsNode = OvmsNode;
//# sourceMappingURL=OvmsNode.node.js.map