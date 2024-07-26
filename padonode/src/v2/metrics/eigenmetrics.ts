import { Counter, Gauge, Registry } from 'prom-client';
import { pino, Logger } from 'pino';
import express from 'express';
// import { randomInt } from 'crypto';

// // for test
// import { Collector as RpcCollector } from "./collectors/rpc-calls/rps-calls"
// import { Collector as EconomicsCollector } from "./collectors/economic/economics"
// import { ELClient } from '../clients/el';
// import { AvsClient } from '../clients/avs';

// Constants
const EIGEN_PROM_NAMESPACE = 'eigen';

export class EigenMetrics {
    private avsName: string;
    private logger: Logger;
    private registry: Registry;
    private feeEarnedTotal: Counter<string>;
    private performanceScore: Gauge<string>;

    constructor(avsName: string, logger: Logger, registry: Registry = new Registry()) {
        this.avsName = avsName;
        this.logger = logger;
        this.registry = registry;

        // Metrics
        this.feeEarnedTotal = new Counter({
            name: `${EIGEN_PROM_NAMESPACE}_fees_earned_total`,
            help: 'The amount of fees earned in <token>',
            labelNames: ['token'],
            registers: [this.registry],
        });

        this.performanceScore = new Gauge({
            name: `${EIGEN_PROM_NAMESPACE}_performance_score`,
            help: 'The performance metric is a score between 0 and 100 and each developer can define their own way of calculating the score. The score is calculated based on the performance of the Node and the performance of the backing services.',
            labelNames: ['avs_name'] as const,
            registers: [this.registry],
        });

        this.initMetrics();
    }

    private initMetrics() {
        // Performance score starts as 100, and goes down if node doesn't perform well
        this.performanceScore.labels(this.avsName).set(100);

        // TODO: Initialize fee_earned_total if needed
        // TODO(samlaf): should we initialize the feeEarnedTotal? This would require the user to pass in a list of tokens for which to initialize the metric
        // same for rpcRequestDurationSeconds and rpcRequestTotal... we could initialize them to be 0 on every json-rpc... but is that really necessary?
    }

    // adds the fee earned to the total fee earned metric
    public addFeeEarnedTotal(amount: number, token: string) {
        this.feeEarnedTotal.inc({ token: token }, amount);
    }

    // sets the performance score of the node
    public setPerformanceScore(score: number) {
        this.performanceScore.labels(this.avsName).set(score);
    }

    public async start(port: number = 9094) {
        const app = express();

        // Expose the metrics endpoint
        app.get("/metrics", async (_req, res) => {
            this.logger.info(`calling /metrics`);
            res.type("text/plain");
            const m = await this.registry.metrics();
            res.send(m);
        });

        try {
            app.listen(port, () => {
                console.log(`Metrics server is running on port ${port}.`);
            });
        } catch (e) {
            this.logger.error(`Prometheus server failed: ${e}`);
        }
    }
}


async function test() {
    const logger = pino({ level: 'info' });
    const metrics = new EigenMetrics('PADO AVS', logger);
    metrics.start();
}
if (require.main === module) {
    test();
}
