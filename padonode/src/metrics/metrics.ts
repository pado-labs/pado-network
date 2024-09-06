import { Registry } from 'prom-client';
import { pino, Logger } from 'pino';
import express from 'express';

export class Metrics {
    private logger: Logger;
    private registry: Registry;

    constructor(logger: Logger, registry: Registry = new Registry()) {
        this.logger = logger;
        this.registry = registry;
    }

    public async start(port: number = 9094) {
        const app = express();

        // Expose the metrics endpoint
        app.get("/metrics", async (_req, res) => {
            res.type("text/plain");
            const m = await this.registry.metrics();
            res.send(m);
        });

        try {
            app.listen(port, () => {
                this.logger.info(`Metrics server is running on port ${port}.`);
            });
        } catch (e) {
            this.logger.error(`Prometheus server failed: ${e}`);
        }
    }
}


async function test() {
    const logger = pino({ level: 'info' });
    const metrics = new Metrics(logger);
    metrics.start();
}
if (require.main === module) {
    test();
}
