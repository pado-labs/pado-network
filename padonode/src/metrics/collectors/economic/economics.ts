import { Logger } from 'pino';
import { Gauge, Registry } from 'prom-client';
import { ELClient } from '../../../clients/eigenlayer';
import { AvsClient } from '../../../clients/avs';

export class Collector {
  private elClient: ELClient;
  private avsClient: AvsClient;
  private logger: Logger;
  private operatorAddr: string;
  private avsName: string;
  private operatorId: string;
  private quorumNames: { [key: string]: string };

  private slashingStatus: Gauge<string>;
  private registeredStake: Gauge<string>;

  constructor(
    elClient: ELClient,
    avsClient: AvsClient,
    avsName: string,
    logger: Logger,
    operatorAddr: string,
    quorumNames: { [key: string]: string }, registry: Registry = new Registry()
  ) {
    this.elClient = elClient;
    this.avsName = avsName;
    this.avsClient = avsClient;
    this.logger = logger;
    this.operatorAddr = operatorAddr;
    this.operatorId = "";
    this.quorumNames = quorumNames;

    this.slashingStatus = new Gauge({
      name: 'eigen_slashing_status',
      help: 'Whether the operator has been slashed',
      registers: [registry],
    });

    this.registeredStake = new Gauge({
      name: 'eigen_registered_stakes',
      help: `Operator stake in <quorum> of ${avsName}'s StakeRegistry contract`,
      labelNames: ['quorum_number', 'quorum_name', 'avs_name'],
      registers: [registry],
    });
  }

  private async initOperatorId(): Promise<boolean> {
    if (this.operatorId === null) {
      this.operatorId = await this.avsClient.getOperatorId(this.operatorAddr);
    }
    return this.operatorId !== null; // true means success
  }

  public async collect(): Promise<void> {
    // Collect slashingStatus metric
    const operatorIsFrozen = await this.elClient.operatorIsFrozen(this.operatorAddr);
    if (operatorIsFrozen === null) {
      this.logger.error('Failed to get slashing incurred');
    } else {
      const operatorIsFrozenValue = operatorIsFrozen ? 1.0 : 0.0;
      this.slashingStatus.set(operatorIsFrozenValue);
    }

    // Collect registeredStake metric
    if (!this.initOperatorId()) {
      this.logger.warn('Failed to fetch and cache operator id. Skipping collection of registeredStake metric.');
    } else {
      const quorumStakeMap = await this.avsClient.getOperatorStakeInQuorumsOfOperatorAtCurrentBlock(this.operatorId);
      for (const [quorumNum, stake] of Object.entries(quorumStakeMap)) {
        const stakeValue = parseFloat(stake.toString());
        this.registeredStake.labels(quorumNum.toString(), this.quorumNames[quorumNum], this.avsName).set(stakeValue);
      }
    }
  }
}
