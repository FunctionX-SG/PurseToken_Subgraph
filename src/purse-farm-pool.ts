import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  LpErc20 as LpErc20Contract,
  Sync as SyncEvent,
} from "../generated/PurseFarm/LpErc20";
import { FarmPool, FarmTVLUpdate, Store } from "../generated/schema";
import {
  BUSD_TOKEN_DECIMALS,
  PURSE_FARM_ADDRESS,
  PURSE_TOKEN_DECIMALS,
  ZERO_BD,
} from "./constants";
import { updateBalanceOf } from "./purse-staking";
import { convertTokenToDecimal, isSameDate } from "./helpers";

export function handleSync(event: SyncEvent): void {
  const bundle = FarmPool.load(event.address)!;
  const lpContract = LpErc20Contract.bind(event.address);

  bundle.purseReserves = convertTokenToDecimal(
    event.params.reserve0,
    PURSE_TOKEN_DECIMALS
  );

  bundle.busdReserves = convertTokenToDecimal(
    event.params.reserve1,
    BUSD_TOKEN_DECIMALS
  );

  const lpTotalSupplyResponse = lpContract.try_totalSupply();
  if (lpTotalSupplyResponse.reverted) {
    log.error(
      "try_totalSupply call reverted. LP Address: {}, PURSE_FARM_ADDRESS Address: {}",
      [event.address.toHexString(), PURSE_FARM_ADDRESS.toHexString()]
    );
    return;
  }
  bundle.lpTotalSupply = lpTotalSupplyResponse.value;

  bundle.pursePriceInUSD = bundle.purseReserves!.notEqual(ZERO_BD)
    ? bundle.busdReserves!.div(bundle.purseReserves!)
    : ZERO_BD;

  const poolTVL = bundle
    .purseReserves!.times(bundle.pursePriceInUSD)
    .plus(bundle.busdReserves!);

  bundle.lpPriceInUSD = poolTVL.div(
    convertTokenToDecimal(bundle.lpTotalSupply, bundle.lpDecimals)
  );

  const farmBalanceOfResponse = lpContract.try_balanceOf(
    Address.fromBytes(PURSE_FARM_ADDRESS)
  );
  if (farmBalanceOfResponse.reverted) {
    log.error(
      "try_balanceOf call reverted. LP Address: {}, PURSE_FARM_ADDRESS Address: {}",
      [event.address.toHexString(), PURSE_FARM_ADDRESS.toHexString()]
    );
    return;
  }
  const farmBalanceOf = farmBalanceOfResponse.value;
  const farmBalanceDelta = farmBalanceOf.minus(bundle.latestFarmBalanceOf);

  bundle.latestFarmBalanceOf = farmBalanceOf;
  bundle.save();

  handleFarmTransfer(event, farmBalanceDelta);
  updateBalanceOf(
    event.transaction.hash.concatI32(event.logIndex.toI32()).concatI32(0),
    event.block.timestamp
  );
}

function handleFarmTransfer(event: ethereum.Event, delta: BigInt): void {
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
      prevFarmTVL.blockTimestamp = timestamp;
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
    event.transaction.hash.concatI32(event.logIndex.toI32()).concatI32(1)
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
