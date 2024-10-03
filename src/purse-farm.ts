import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from "../generated/PurseFarm/PurseFarm";
import { Bundle, FarmTVLUpdate, Store } from "../generated/schema";
import {
  convertTokenToDecimal,
  isSameDate,
  LP_TOKEN_DECIMALS,
  ZERO_BD,
  ZERO_BI,
} from "./helpers";

export function handleDeposit(event: DepositEvent): void {
  if (event.params.amount.equals(ZERO_BI)) {
    return;
  }

  let bundle = Bundle.load("1");
  let lpPrice = bundle ? bundle.lpPriceInUSD : ZERO_BD;

  let store = Store.load("1");
  let timestamp = event.block.timestamp;
  let currDeposit = event.params.amount;

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
        LP_TOKEN_DECIMALS
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
    LP_TOKEN_DECIMALS
  ).times(lpPrice);
  entity.blockTimestamp = timestamp;
  entity.save();
  store.prevFarmTVL = entity.id;

  store.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  if (event.params.amount.equals(ZERO_BI)) {
    return;
  }

  let bundle = Bundle.load("1");
  let lpPrice = bundle ? bundle.lpPriceInUSD : ZERO_BD;

  let store = Store.load("1");
  let timestamp = event.block.timestamp;
  let currWithdrawal = event.params.amount;

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
        LP_TOKEN_DECIMALS
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
    LP_TOKEN_DECIMALS
  ).times(lpPrice);
  entity.blockTimestamp = timestamp;
  entity.save();
  store.prevFarmTVL = entity.id;

  store.save();
}
