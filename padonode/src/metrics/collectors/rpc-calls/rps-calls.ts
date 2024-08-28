import { Histogram, Counter, Registry } from 'prom-client';

export class Collector {
    private avsName: string;
    private rpcRequestDurationSeconds: Histogram<string>;
    private rpcRequestTotal: Counter<string>;

    constructor(ns: string, avsName: string, registry: Registry = new Registry()) {
        this.avsName = avsName;

        this.rpcRequestDurationSeconds = new Histogram({
            name: `${ns}_rpc_request_duration_seconds`,
            help: 'Duration of json-rpc <method> in seconds',
            labelNames: ['method', 'client_version', 'avs_name'],
            registers: [registry],
        });

        this.rpcRequestTotal = new Counter({
            name: `${ns}_rpc_request_total`,
            help: 'Total number of json-rpc <method> requests',
            labelNames: ['method', 'client_version', 'avs_name'],
            registers: [registry],
        });

        // Set avs_name label value
        this.rpcRequestDurationSeconds.labels({ avs_name: avsName });
        this.rpcRequestTotal.labels({ avs_name: avsName });
    }

    // observes the duration of a json-rpc request
    public observeRpcRequestDurationSeconds(duration: number, method: string, clientVersion: string): void {
        this.rpcRequestDurationSeconds.labels(method, clientVersion, this.avsName).observe(duration);
    }

    // adds a json-rpc request to the total number of requests
    public addRpcRequestTotal(method: string, clientVersion: string): void {
        this.rpcRequestTotal.labels(method, clientVersion, this.avsName).inc();
    }
}

