import { Gauge, Registry } from 'prom-client';
import { Logger } from 'pino';


// Constants
const EIGEN_PROM_NAMESPACE = 'eigen';

export class MiscMetrics {
    //@ts-ignore
    private logger: Logger;
    private registry: Registry;
    private balanceTotal: Gauge<string>;
    private taskSuccessCount: Gauge<string>;
    private taskFailedCount: Gauge<string>;

    constructor(logger: Logger, registry: Registry = new Registry()) {
        this.logger = logger;
        this.registry = registry;

        // Metrics
        this.balanceTotal = new Gauge({
            name: `${EIGEN_PROM_NAMESPACE}_balance_total`,
            help: 'Total balance associated with the token.',
            labelNames: ['token'] as const,
            registers: [this.registry],
        });

        this.taskSuccessCount = new Gauge({
            name: `${EIGEN_PROM_NAMESPACE}_task_success_count`,
            help: 'Number of successes related to task type.',
            labelNames: ['task_type'] as const,
            registers: [this.registry],
        });

        this.taskFailedCount = new Gauge({
            name: `${EIGEN_PROM_NAMESPACE}_task_failed_count`,
            help: 'Number of failures related to task type.',
            labelNames: ['task_type'] as const,
            registers: [this.registry],
        });

        this.initMetrics();
    }

    private initMetrics() {
    }

    public setBalanceTotal(amount: number, token: string) {
        this.balanceTotal.labels(token).set(amount);
    }

    public setTaskSuccessCount(count: number, taskType: string) {
        this.taskSuccessCount.labels(taskType).set(count);
    }

    public setTaskFailedCount(count: number, taskType: string) {
        this.taskFailedCount.labels(taskType).set(count);
    }
}
