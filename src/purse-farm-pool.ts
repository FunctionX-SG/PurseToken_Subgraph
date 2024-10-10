import { BigInt } from "@graphprotocol/graph-ts";
import {
  Sync as SyncEvent,
  Transfer as TransferEvent,
} from "../generated/PurseBUSDPool/PurseBUSDPool";
import { FarmPool, FarmTVLUpdate, Store } from "../generated/schema";
import {
  BUSD_TOKEN_DECIMALS,
  convertTokenToDecimal,
  isSameDate,
  PURSE_FARM_ADDRESS,
  PURSE_TOKEN_DECIMALS,
  ZERO_BD,
  ZERO_BI,
} from "./helpers";

export function handleSync(event: SyncEvent): void {
  const bundle = FarmPool.load(event.address)!;

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

  const poolTVL = bundle
    .purseReserves!.times(bundle.pursePriceInUSD)
    .plus(bundle.busdReserves!);

  bundle.lpPriceInUSD = poolTVL.div(
    convertTokenToDecimal(bundle.lpTotalSupply, bundle.lpDecimals)
  );

  bundle.save();
}

export function handleTransfer(event: TransferEvent): void {
  if (event.params.value.equals(ZERO_BI)) {
    return;
  }
  if (event.params.from.equals(PURSE_FARM_ADDRESS)) {
    handleFarmTransfer(event, event.params.value.neg());
  } else if (event.params.to.equals(PURSE_FARM_ADDRESS)) {
    handleFarmTransfer(event, event.params.value);
  }
}

function handleFarmTransfer(event: TransferEvent, delta: BigInt): void {
  const farmPool = FarmPool.load(event.address)!;
  const lpPrice =
    farmPool && farmPool.lpPriceInUSD ? farmPool.lpPriceInUSD : ZERO_BD;

  let store = Store.load("1");
  const timestamp = event.block.timestamp;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevFarmTVL) {
    const prevFarmTVL = FarmTVLUpdate.load(store.prevFarmTVL!)!;
    if (isSameDate(prevFarmTVL.blockTimestamp, timestamp)) {
      prevFarmTVL.totalAmountLiquidity =
        prevFarmTVL.totalAmountLiquidity.plus(delta);
      prevFarmTVL.totalLiquidityValueUSD = convertTokenToDecimal(
        prevFarmTVL.totalAmountLiquidity,
        farmPool.lpDecimals
      ).times(lpPrice);
      prevFarmTVL.save();
      return;
    } else {
      delta = prevFarmTVL.totalAmountLiquidity.plus(delta);
    }
  }

  const entity = new FarmTVLUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountLiquidity = delta;
  entity.totalLiquidityValueUSD = convertTokenToDecimal(
    entity.totalAmountLiquidity,
    farmPool.lpDecimals
  ).times(lpPrice);
  entity.blockTimestamp = timestamp;
  entity.save();
  store.prevFarmTVL = entity.id;

  store.save();
}
