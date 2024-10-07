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
  let bundle = FarmPool.load(event.address)!;

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
    convertTokenToDecimal(bundle.lpTotalSupply, bundle.lpDecimals)
  );

  bundle.save();
}

export function handleTransfer(event: TransferEvent): void {
  if (event.params.value.equals(ZERO_BI)) {
    return;
  }
  if (event.params.from.equals(PURSE_FARM_ADDRESS)) {
    handleWithdraw(event);
  } else if (event.params.to.equals(PURSE_FARM_ADDRESS)) {
    handleDeposit(event);
  }
}

function handleWithdraw(event: TransferEvent): void {
  let farmPool = FarmPool.load(event.address)!;
  let lpPrice =
    farmPool && farmPool.lpPriceInUSD ? farmPool.lpPriceInUSD : ZERO_BD;

  let store = Store.load("1");
  let timestamp = event.block.timestamp;
  let currWithdrawal = event.params.value;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevFarmTVL) {
    let prevFarmTVL = FarmTVLUpdate.load(store.prevFarmTVL!)!;
    if (isSameDate(prevFarmTVL.blockTimestamp, timestamp)) {
      prevFarmTVL.totalAmountLiquidity =
        prevFarmTVL.totalAmountLiquidity.minus(currWithdrawal);
      prevFarmTVL.totalLiquidityValueUSD = convertTokenToDecimal(
        prevFarmTVL.totalAmountLiquidity,
        farmPool.lpDecimals
      ).times(lpPrice);
      prevFarmTVL.save();
      return;
    } else {
      currWithdrawal = prevFarmTVL.totalAmountLiquidity.minus(currWithdrawal);
    }
  }

  let entity = new FarmTVLUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountLiquidity = currWithdrawal;
  entity.totalLiquidityValueUSD = convertTokenToDecimal(
    entity.totalAmountLiquidity,
    farmPool.lpDecimals
  ).times(lpPrice);
  entity.blockTimestamp = timestamp;
  entity.save();
  store.prevFarmTVL = entity.id;

  store.save();
}

function handleDeposit(event: TransferEvent): void {
  let farmPool = FarmPool.load(event.address)!;
  let lpPrice =
    farmPool && farmPool.lpPriceInUSD ? farmPool.lpPriceInUSD : ZERO_BD;

  let store = Store.load("1");
  let timestamp = event.block.timestamp;
  let currDeposit = event.params.value;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevFarmTVL) {
    let prevFarmTVL = FarmTVLUpdate.load(store.prevFarmTVL!)!;
    if (isSameDate(prevFarmTVL.blockTimestamp, timestamp)) {
      prevFarmTVL.totalAmountLiquidity =
        prevFarmTVL.totalAmountLiquidity.plus(currDeposit);
      prevFarmTVL.totalLiquidityValueUSD = convertTokenToDecimal(
        prevFarmTVL.totalAmountLiquidity,
        farmPool.lpDecimals
      ).times(lpPrice);
      prevFarmTVL.save();
      return;
    } else {
      currDeposit = prevFarmTVL.totalAmountLiquidity.plus(currDeposit);
    }
  }

  let entity = new FarmTVLUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountLiquidity = currDeposit;
  entity.totalLiquidityValueUSD = convertTokenToDecimal(
    entity.totalAmountLiquidity,
    farmPool.lpDecimals
  ).times(lpPrice);
  entity.blockTimestamp = timestamp;
  entity.save();
  store.prevFarmTVL = entity.id;

  store.save();
}
