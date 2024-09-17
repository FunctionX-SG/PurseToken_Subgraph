import { newMockEvent } from "matchstick-as";
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts";
import { Transfer1 } from "../generated/PurseToken404/PurseToken404";

export function createTransfer1Event(
  from: Address,
  to: Address,
  amount: BigInt
): Transfer1 {
  let transfer1Event = changetype<Transfer1>(newMockEvent());

  transfer1Event.parameters = new Array();

  transfer1Event.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  );
  transfer1Event.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  );
  transfer1Event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return transfer1Event;
}
