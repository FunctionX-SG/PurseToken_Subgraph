import { Sync as SyncEvent } from "../generated/PurseBUSDPool/PurseBUSDPool";
import { Bundle } from "../generated/schema";
import {
  BUSD_TOKEN_DECIMALS,
  convertTokenToDecimal,
  exponentToBigDecimal,
  LP_TOKEN_DECIMALS,
  PURSE_BUSD_LP_TOKEN_TOTAL_SUPPLY,
  PURSE_TOKEN_DECIMALS,
  ZERO_BD,
} from "./helpers";

export function handleSync(event: SyncEvent): void {
  let bundle = Bundle.load("1");
  if (!bundle) {
    bundle = new Bundle("1");
  }

  bundle.purseReserves = convertTokenToDecimal(
    event.params.reserve0,
    PURSE_TOKEN_DECIMALS
  );

  bundle.busdReserves = convertTokenToDecimal(
    event.params.reserve1,
    BUSD_TOKEN_DECIMALS
  );

  bundle.pursePriceInUSD = bundle.purseReserves!.notEqual(ZERO_BD)
    ? bundle.busdReserves!.div(bundle.purseReserves!)
    : ZERO_BD;

  let poolTVL = bundle
    .purseReserves!.times(bundle.pursePriceInUSD)
    .plus(bundle.busdReserves!);

  bundle.lpPriceInUSD = poolTVL.div(
    PURSE_BUSD_LP_TOKEN_TOTAL_SUPPLY.div(
      exponentToBigDecimal(LP_TOKEN_DECIMALS)
    )
  );

  bundle.save();
}
