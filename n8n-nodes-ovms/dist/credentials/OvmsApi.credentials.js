"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OvmsApi = void 0;
class OvmsApi {
    constructor() {
        this.name = 'ovmsApi';
        this.displayName = 'OVMS API';
        this.documentationUrl = 'https://docs.openvino.ai/2023.3/ovms_what_is_openvino_model_server.html';
        this.properties = [
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
}
exports.OvmsApi = OvmsApi;
//# sourceMappingURL=OvmsApi.credentials.js.map