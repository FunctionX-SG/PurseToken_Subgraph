import { AddNewPool as AddNewPoolEvent } from "../generated/PurseFarm/PurseFarm";
import { LpErc20 } from "../generated/PurseFarm/LpErc20";
import { FarmPool } from "../generated/schema";
import { FarmPoolContract } from "../generated/templates";
import { BigInt, log } from "@graphprotocol/graph-ts";
import { ZERO_BD, ZERO_BI } from "./helpers";

export function handleAddPool(event: AddNewPoolEvent): void {
  FarmPoolContract.create(event.params.lpToken);
  const farmPool = new FarmPool(event.params.lpToken);
  const lpToken = LpErc20.bind(event.params.lpToken);

  const decimalsResult = lpToken.try_decimals();
  if (!decimalsResult.reverted) {
    farmPool.lpDecimals = BigInt.fromI32(decimalsResult.value);
  } else {
    log.error("handleAddPool: try_decimals reverted for farmPool {}", [
      farmPool.id.toHexString(),
    ]);
    farmPool.lpDecimals = ZERO_BI;
  }
  const totalSupplyResult = lpToken.try_totalSupply();
  if (!totalSupplyResult.reverted) {
    farmPool.lpTotalSupply = totalSupplyResult.value;
  } else {
    log.error("handleAddPool: try_totalSupply reverted for farmPool {}", [
      farmPool.id.toHexString(),
    ]);
    farmPool.lpTotalSupply = BigInt.fromI32(1);
  }

  farmPool.lpPriceInUSD = ZERO_BD;
  farmPool.pursePriceInUSD = ZERO_BD;

  log.info(
    "farmPoolAdded: farmPool (id/lpToken address: {}) created on block number {}",
    [farmPool.id.toHexString(), event.block.number.toString()]
  );
  farmPool.save();
}
