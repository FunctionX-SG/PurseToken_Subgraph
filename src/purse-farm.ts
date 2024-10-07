import { AddNewPool as AddNewPoolEvent } from "../generated/PurseFarm/PurseFarm";
import { LpErc20 } from "../generated/PurseFarm/LpErc20";
import { FarmPool } from "../generated/schema";
import { FarmPoolContract } from "../generated/templates";
import { BigInt } from "@graphprotocol/graph-ts";
import { ZERO_BD, ZERO_BI } from "./helpers";

export function handleAddPool(event: AddNewPoolEvent): void {
  FarmPoolContract.create(event.params.lpToken);
  let farmPool = new FarmPool(event.params.lpToken);
  let lpToken = LpErc20.bind(event.params.lpToken);

  let decimalsResult = lpToken.try_decimals();
  if (!decimalsResult.reverted) {
    farmPool.lpDecimals = BigInt.fromI32(decimalsResult.value);
  } else {
    farmPool.lpDecimals = ZERO_BI;
  }
  let totalSupplyResult = lpToken.try_totalSupply();
  if (!totalSupplyResult.reverted) {
    farmPool.lpTotalSupply = totalSupplyResult.value;
  } else {
    farmPool.lpTotalSupply = BigInt.fromI32(1);
  }

  farmPool.lpPriceInUSD = ZERO_BD;
  farmPool.pursePriceInUSD = ZERO_BD;

  farmPool.save();
}
