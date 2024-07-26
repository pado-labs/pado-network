import { Logger } from "pino";
import { ethers } from "ethers";
import { AvsClient } from "./avs";
import { ELClient } from "./el";
import { registryCoordinatorABI } from "../abis/registryCoordinatorABI";
import { stakeRegistryABI } from "../abis/stakeRegistryABI";
import { delegationManagerABI } from "../abis/delegationManagerABI";
import { slasherABI } from "../abis/slasherABI";
import { strategyManagerABI } from "../abis/strategyManagerABI";
import { serviceManagerABI } from "../abis/serviceManagerABI";
import { avsDirectoryABI } from "../abis/avsDirectoryABI";
import { blsApkRegistryABI } from "../abis/blsApkRegistryABI";

export class BuildAllConfig {
    registryCoordinatorAddress: string;
    operatorStateRetrieverAddress: string;
    ecdsaWallet: ethers.Wallet;
    logger: Logger;

    constructor(
        registryCoordinatorAddress: string,
        operatorStateRetrieverAddress: string,
        ecdsaWallet: ethers.Wallet,
        logger: Logger,
    ) {
        this.registryCoordinatorAddress = registryCoordinatorAddress;
        this.operatorStateRetrieverAddress = operatorStateRetrieverAddress;
        this.ecdsaWallet = ecdsaWallet;
        this.logger = logger;
    }

    async buildElClient(): Promise<ELClient> {
        console.log('registryCoordinatorAddress', this.registryCoordinatorAddress);
        const registryCoordinator = new ethers.Contract(this.registryCoordinatorAddress, registryCoordinatorABI, this.ecdsaWallet);
        // console.log('registryCoordinator', registryCoordinator);

        const stakeRegistryAddress: string = await registryCoordinator.stakeRegistry();
        console.log('stakeRegistryAddress', stakeRegistryAddress);
        const stakeRegistry = new ethers.Contract(stakeRegistryAddress, stakeRegistryABI, this.ecdsaWallet);
        // console.log('stakeRegistry', stakeRegistry);

        const delegationManagerAddress: string = await stakeRegistry.delegation();
        console.log('delegationManagerAddress', delegationManagerAddress);
        const delegationManager = new ethers.Contract(delegationManagerAddress, delegationManagerABI, this.ecdsaWallet);
        // console.log('delegationManager', delegationManager);

        const slasherAddress: string = await delegationManager.slasher();
        console.log('slasherAddress', slasherAddress);
        const slasher = new ethers.Contract(slasherAddress, slasherABI, this.ecdsaWallet);
        // console.log('slasher', slasher);

        const strategyManagerAddress: string = await delegationManager.strategyManager();
        console.log('strategyManagerAddress', strategyManagerAddress);
        const strategyManager = new ethers.Contract(strategyManagerAddress, strategyManagerABI, this.ecdsaWallet);
        // console.log('strategyManager', strategyManager);

        const serviceManagerAddress: string = await registryCoordinator.serviceManager();
        console.log('serviceManagerAddress', serviceManagerAddress);
        const serviceManager = new ethers.Contract(serviceManagerAddress, serviceManagerABI, this.ecdsaWallet);
        // console.log('serviceManager', serviceManager);

        const avsDirectoryAddress: string = await serviceManager.avsDirectory();
        console.log('avsDirectoryAddress', avsDirectoryAddress);
        const avsDirectory = new ethers.Contract(avsDirectoryAddress, avsDirectoryABI, this.ecdsaWallet);
        // console.log('avsDirectory', avsDirectory);

        const elClient = new ELClient(
            delegationManager,
            slasher,
            strategyManager,
            avsDirectory,
            this.logger,
        );

        return elClient;
    }

    async buildAvsClient(
        elClient: ELClient,
    ): Promise<AvsClient> {
        console.log('registryCoordinatorAddress', this.registryCoordinatorAddress);
        const registryCoordinator = new ethers.Contract(this.registryCoordinatorAddress, registryCoordinatorABI, this.ecdsaWallet);
        // console.log('registryCoordinator', registryCoordinator);

        const stakeRegistryAddress: string = await registryCoordinator.stakeRegistry();
        console.log('stakeRegistryAddress', stakeRegistryAddress);
        const stakeRegistry = new ethers.Contract(stakeRegistryAddress, stakeRegistryABI, this.ecdsaWallet);
        // console.log('stakeRegistry', stakeRegistry);


        const serviceManagerAddress: string = await registryCoordinator.serviceManager();
        console.log('serviceManagerAddress', serviceManagerAddress);
        const serviceManager = new ethers.Contract(serviceManagerAddress, serviceManagerABI, this.ecdsaWallet);
        // console.log('serviceManager', serviceManager);

        const blsApkRegistryAddress: string = await registryCoordinator.blsApkRegistry();
        console.log('blsApkRegistryAddress', blsApkRegistryAddress);
        const blsApkRegistry = new ethers.Contract(blsApkRegistryAddress, blsApkRegistryABI, this.ecdsaWallet);
        // console.log('blsApkRegistry', blsApkRegistry);


        const avsClient = new AvsClient(
            this.ecdsaWallet,
            elClient,
            serviceManager,
            registryCoordinator,
            stakeRegistry,
            blsApkRegistry,
            this.logger,
        );

        return avsClient;
    }
}

export class Clients {
    elClient: ELClient;
    avsClient: AvsClient;

    constructor(
        elClient: ELClient,
        avsClient: AvsClient,
    ) {
        this.elClient = elClient;
        this.avsClient = avsClient;
    }
}

export async function buildAll(config: BuildAllConfig): Promise<Clients> {

    const elClient = await config.buildElClient();
    const avsClient = await config.buildAvsClient(elClient);

    return new Clients(
        elClient,
        avsClient,
    );
}
