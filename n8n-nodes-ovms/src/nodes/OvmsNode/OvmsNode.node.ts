import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';

export class OvmsNode implements INodeType {
    description: INodeTypeDescription = {
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

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const ovmsUrl = this.getNodeParameter('ovmsUrl', i) as string;
                const modelName = this.getNodeParameter('modelName', i) as string;
                const threshold = this.getNodeParameter('threshold', i) as number;

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

                const segmOutput = response.outputs.find((o: any) =>
                    o.name.includes('segm')
                );

                const segmData: number[] = segmOutput.data;

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

            } catch (error) {
                throw new NodeOperationError(this.getNode(), error as Error, {
                    itemIndex: i,
                });
            }
        }

        return [returnData];
    }
}