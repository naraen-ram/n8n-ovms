"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OvmsNode = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class OvmsNode {
    constructor() {
        this.description = {
            displayName: 'OpenVINO Model Server',
            name: 'ovmsNode',
            icon: 'file:ovms.svg',
            group: ['transform'],
            version: 1,
            description: 'Run AI inference on Intel hardware via OpenVINO Model Server',
            defaults: {
                name: 'OpenVINO Model Server',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'ovmsApi',
                    required: true,
                },
            ],
            properties: [
                // --- Operation selector ---
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Health Check',
                            value: 'healthCheck',
                            description: 'Check if OVMS is running and ready',
                        },
                        {
                            name: 'Get Model Info',
                            value: 'getModelInfo',
                            description: 'Get input/output shapes for a model',
                        },
                        {
                            name: 'Run Inference',
                            value: 'runInference',
                            description: 'Send data to a model and get predictions',
                        },
                    ],
                    default: 'runInference',
                },
                // --- Model name (shown for getModelInfo and runInference) ---
                {
                    displayName: 'Model Name',
                    name: 'modelName',
                    type: 'string',
                    default: '',
                    placeholder: 'face-detection',
                    description: 'The name of the model as registered in OVMS',
                    displayOptions: {
                        show: {
                            operation: ['getModelInfo', 'runInference'],
                        },
                    },
                },
                // --- Device selector (shown only for runInference) ---
                {
                    displayName: 'Device',
                    name: 'device',
                    type: 'options',
                    options: [
                        {
                            name: 'AUTO (Recommended)',
                            value: 'AUTO',
                            description: 'Let OpenVINO pick the best available device',
                        },
                        {
                            name: 'CPU',
                            value: 'CPU',
                        },
                        {
                            name: 'GPU',
                            value: 'GPU',
                        },
                        {
                            name: 'NPU',
                            value: 'NPU',
                        },
                    ],
                    default: 'AUTO',
                    displayOptions: {
                        show: {
                            operation: ['runInference'],
                        },
                    },
                },
                // --- Input tensor name ---
                {
                    displayName: 'Input Name',
                    name: 'inputName',
                    type: 'string',
                    default: 'data',
                    description: 'The input tensor name — get this from Get Model Info',
                    displayOptions: {
                        show: {
                            operation: ['runInference'],
                        },
                    },
                },
                // --- Input shape ---
                {
                    displayName: 'Input Shape',
                    name: 'inputShape',
                    type: 'string',
                    default: '1,3,300,300',
                    placeholder: '1,3,300,300',
                    description: 'Comma-separated tensor shape — get this from Get Model Info',
                    displayOptions: {
                        show: {
                            operation: ['runInference'],
                        },
                    },
                },
                // --- Input data ---
                {
                    displayName: 'Input Data',
                    name: 'inputData',
                    type: 'string',
                    typeOptions: {
                        rows: 4,
                    },
                    default: '',
                    placeholder: '0.1, 0.5, 0.3 ...',
                    description: 'Comma-separated float values to send as the input tensor',
                    displayOptions: {
                        show: {
                            operation: ['runInference'],
                        },
                    },
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        // Get credentials
        const credentials = await this.getCredentials('ovmsApi');
        const serverUrl = credentials.serverUrl.replace(/\/$/, '');
        for (let i = 0; i < items.length; i++) {
            const operation = this.getNodeParameter('operation', i);
            try {
                // ── HEALTH CHECK ──────────────────────────────────────
                if (operation === 'healthCheck') {
                    const response = await this.helpers.httpRequest({
                        method: 'GET',
                        url: `${serverUrl}/v2/health/ready`,
                    });
                    returnData.push({
                        json: {
                            status: 'ok',
                            message: 'OVMS is running and ready',
                            server_url: serverUrl,
                        },
                    });
                }
                // ── GET MODEL INFO ────────────────────────────────────
                else if (operation === 'getModelInfo') {
                    const modelName = this.getNodeParameter('modelName', i);
                    const response = await this.helpers.httpRequest({
                        method: 'GET',
                        url: `${serverUrl}/v2/models/${modelName}`,
                    });
                    returnData.push({
                        json: {
                            model_name: response.name,
                            versions: response.versions,
                            platform: response.platform,
                            inputs: response.inputs,
                            outputs: response.outputs,
                        },
                    });
                }
                // ── RUN INFERENCE ─────────────────────────────────────
                else if (operation === 'runInference') {
                    const modelName = this.getNodeParameter('modelName', i);
                    const device = this.getNodeParameter('device', i);
                    const inputName = this.getNodeParameter('inputName', i);
                    const inputShape = this.getNodeParameter('inputShape', i)
                        .split(',')
                        .map((s) => parseInt(s.trim(), 10));
                    const inputData = this.getNodeParameter('inputData', i)
                        .split(',')
                        .map((s) => parseFloat(s.trim()));
                    // Build KServe v2 payload — exactly what your Python script built
                    const payload = {
                        inputs: [
                            {
                                name: inputName,
                                shape: inputShape,
                                datatype: 'FP32',
                                data: inputData,
                            },
                        ],
                    };
                    const response = await this.helpers.httpRequest({
                        method: 'POST',
                        url: `${serverUrl}/v2/models/${modelName}/infer`,
                        body: payload,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    // Parse the response
                    const output = response.outputs[0];
                    returnData.push({
                        json: {
                            model_name: response.model_name,
                            model_version: response.model_version,
                            // Device the user requested
                            device_requested: device,
                            // Device that actually ran inference
                            // OVMS returns this in response metadata
                            // For now reflects requested device — AUTO plugin
                            // will populate this dynamically in future iteration
                            executed_on: device,
                            output_name: output.name,
                            output_shape: output.shape,
                            output_datatype: output.datatype,
                            raw_output: output.data,
                        },
                    });
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                            operation,
                            server_url: serverUrl,
                        },
                    });
                    continue;
                }
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