export const operatorStateRetrieverABI = [{"type":"function","name":"getCheckSignaturesIndices","inputs":[{"name":"registryCoordinator","type":"address","internalType":"contract IRegistryCoordinator"},{"name":"referenceBlockNumber","type":"uint32","internalType":"uint32"},{"name":"quorumNumbers","type":"bytes","internalType":"bytes"},{"name":"nonSignerOperatorIds","type":"bytes32[]","internalType":"bytes32[]"}],"outputs":[{"name":"","type":"tuple","internalType":"struct OperatorStateRetriever.CheckSignaturesIndices","components":[{"name":"nonSignerQuorumBitmapIndices","type":"uint32[]","internalType":"uint32[]"},{"name":"quorumApkIndices","type":"uint32[]","internalType":"uint32[]"},{"name":"totalStakeIndices","type":"uint32[]","internalType":"uint32[]"},{"name":"nonSignerStakeIndices","type":"uint32[][]","internalType":"uint32[][]"}]}],"stateMutability":"view"},{"type":"function","name":"getOperatorState","inputs":[{"name":"registryCoordinator","type":"address","internalType":"contract IRegistryCoordinator"},{"name":"quorumNumbers","type":"bytes","internalType":"bytes"},{"name":"blockNumber","type":"uint32","internalType":"uint32"}],"outputs":[{"name":"","type":"tuple[][]","internalType":"struct OperatorStateRetriever.Operator[][]","components":[{"name":"operator","type":"address","internalType":"address"},{"name":"operatorId","type":"bytes32","internalType":"bytes32"},{"name":"stake","type":"uint96","internalType":"uint96"}]}],"stateMutability":"view"},{"type":"function","name":"getOperatorState","inputs":[{"name":"registryCoordinator","type":"address","internalType":"contract IRegistryCoordinator"},{"name":"operatorId","type":"bytes32","internalType":"bytes32"},{"name":"blockNumber","type":"uint32","internalType":"uint32"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"},{"name":"","type":"tuple[][]","internalType":"struct OperatorStateRetriever.Operator[][]","components":[{"name":"operator","type":"address","internalType":"address"},{"name":"operatorId","type":"bytes32","internalType":"bytes32"},{"name":"stake","type":"uint96","internalType":"uint96"}]}],"stateMutability":"view"},{"type":"function","name":"getQuorumBitmapsAtBlockNumber","inputs":[{"name":"registryCoordinator","type":"address","internalType":"contract IRegistryCoordinator"},{"name":"operatorIds","type":"bytes32[]","internalType":"bytes32[]"},{"name":"blockNumber","type":"uint32","internalType":"uint32"}],"outputs":[{"name":"","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"}];