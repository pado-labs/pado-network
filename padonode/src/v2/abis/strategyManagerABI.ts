export const strategyManagerABI = [{"type":"constructor","inputs":[{"name":"_strategyManager","type":"address","internalType":"contract IStrategyManager"}],"stateMutability":"nonpayable"},{"type":"function","name":"deposit","inputs":[{"name":"token","type":"address","internalType":"contract IERC20"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"newShares","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"explanation","inputs":[],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"pure"},{"type":"function","name":"initialize","inputs":[{"name":"_underlyingToken","type":"address","internalType":"contract IERC20"},{"name":"_pauserRegistry","type":"address","internalType":"contract IPauserRegistry"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"pause","inputs":[{"name":"newPausedStatus","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"pauseAll","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"paused","inputs":[{"name":"index","type":"uint8","internalType":"uint8"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"paused","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"pauserRegistry","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IPauserRegistry"}],"stateMutability":"view"},{"type":"function","name":"setPauserRegistry","inputs":[{"name":"newPauserRegistry","type":"address","internalType":"contract IPauserRegistry"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"shares","inputs":[{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"sharesToUnderlying","inputs":[{"name":"amountShares","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"sharesToUnderlyingView","inputs":[{"name":"amountShares","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"strategyManager","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IStrategyManager"}],"stateMutability":"view"},{"type":"function","name":"totalShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"underlyingToShares","inputs":[{"name":"amountUnderlying","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"underlyingToSharesView","inputs":[{"name":"amountUnderlying","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"underlyingToken","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IERC20"}],"stateMutability":"view"},{"type":"function","name":"unpause","inputs":[{"name":"newPausedStatus","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"userUnderlying","inputs":[{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"userUnderlyingView","inputs":[{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"withdraw","inputs":[{"name":"recipient","type":"address","internalType":"address"},{"name":"token","type":"address","internalType":"contract IERC20"},{"name":"amountShares","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"Initialized","inputs":[{"name":"version","type":"uint8","indexed":false,"internalType":"uint8"}],"anonymous":false},{"type":"event","name":"Paused","inputs":[{"name":"account","type":"address","indexed":true,"internalType":"address"},{"name":"newPausedStatus","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"PauserRegistrySet","inputs":[{"name":"pauserRegistry","type":"address","indexed":false,"internalType":"contract IPauserRegistry"},{"name":"newPauserRegistry","type":"address","indexed":false,"internalType":"contract IPauserRegistry"}],"anonymous":false},{"type":"event","name":"Unpaused","inputs":[{"name":"account","type":"address","indexed":true,"internalType":"address"},{"name":"newPausedStatus","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false}];