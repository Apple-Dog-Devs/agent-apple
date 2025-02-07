import { Service, IAgentRuntime, ServiceType } from "@elizaos/core";

export class MorningService extends Service {
    static serviceType = ServiceType.TEXT_GENERATION;

    async initialize(runtime: IAgentRuntime) {
        console.log("initialize");
    }
}
