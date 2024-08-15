import Everpay from 'everpay'

export async function everPayBalance(account: string, symbol?: string) {
  console.log(`Get the asset balance on everPay. account: ${account} symbol: ${symbol ? symbol : "ALL"}.`);

  const everpay = new Everpay();
  if (symbol == undefined || symbol === "") {
    const balanceParams = { account: account };
    await everpay.balances(balanceParams).then(console.log);
    return;
  }

  const info = await everpay.info();
  // console.log('info\n', info);

  let results = []
  for (let token of info.tokenList) {
    if (token.symbol === symbol) {
      const balanceParams = {
        tag: token.tag,
        account: account
      };
      const everpay = new Everpay();
      const balance = await everpay.balance(balanceParams);
      const result = {
        chain: token.chainType,
        symbol: token.symbol,
        balance: balance,
      };
      results.push(result);
    }
  }

  if (results.length === 0) {
    console.log("Chose one of the following token symbol:");
    for (let token of info.tokenList) {
      console.log(`chain: ${token.chainType} symbol: ${token.symbol}`);
    }
  } else {
    console.log(results);
  }
}
