import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class OvmsApi implements ICredentialType {
    name = 'ovmsApi';
    displayName = 'OVMS API';
    documentationUrl = 'https://docs.openvino.ai/2023.3/ovms_what_is_openvino_model_server.html';
    properties: INodeProperties[] = [
        {
            displayName: 'Server URL',
            name: 'serverUrl',
            type: 'string',
            default: 'http://localhost:9001',
            placeholder: 'http://localhost:9001',
            description: 'The base URL of your OpenVINO Model Server REST endpoint',
        },
    ];
}