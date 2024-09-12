import { BigInt } from "@graphprotocol/graph-ts";
import {
  // Approval as ApprovalEvent,
  // Approval1 as Approval1Event,
  // ApprovalForAll as ApprovalForAllEvent,
  // EIP712DomainChanged as EIP712DomainChangedEvent,
  // Initialized as InitializedEvent,
  // Paused as PausedEvent,
  // RoleAdminChanged as RoleAdminChangedEvent,
  // RoleGranted as RoleGrantedEvent,
  // RoleRevoked as RoleRevokedEvent,
  Transfer1 as Transfer20Event,
  // Transfer2 as Transfer721Event,
  // Unpaused as UnpausedEvent,
  // Upgraded as UpgradedEvent,
} from "../generated/PurseToken404/PurseToken404";
import {
  // Approval,
  // Approval1,
  // ApprovalForAll,
  // EIP712DomainChanged,
  // Initialized,
  // Paused,
  // RoleAdminChanged,
  // RoleGranted,
  // RoleRevoked,
  // Transfer20,
  // Transfer721,
  // Unpaused,
  // Upgraded,
  Burn,
} from "../generated/schema";
import { ADDRESS_ZERO } from "./helpers";

// export function handleApproval(event: ApprovalEvent): void {
//   let entity = new Approval(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.owner = event.params.owner;
//   entity.spender = event.params.spender;
//   entity.value = event.params.value;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handleApproval1(event: Approval1Event): void {
//   let entity = new Approval1(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.owner = event.params.owner;
//   entity.spender = event.params.spender;
//   entity.PurseToken404_id = event.params.id;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handleApprovalForAll(event: ApprovalForAllEvent): void {
//   let entity = new ApprovalForAll(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.owner = event.params.owner;
//   entity.operator = event.params.operator;
//   entity.approved = event.params.approved;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handleEIP712DomainChanged(
//   event: EIP712DomainChangedEvent
// ): void {
//   let entity = new EIP712DomainChanged(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handleInitialized(event: InitializedEvent): void {
//   let entity = new Initialized(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.version = event.params.version;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handlePaused(event: PausedEvent): void {
//   let entity = new Paused(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.account = event.params.account;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
//   let entity = new RoleAdminChanged(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.role = event.params.role;
//   entity.previousAdminRole = event.params.previousAdminRole;
//   entity.newAdminRole = event.params.newAdminRole;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handleRoleGranted(event: RoleGrantedEvent): void {
//   let entity = new RoleGranted(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.role = event.params.role;
//   entity.account = event.params.account;
//   entity.sender = event.params.sender;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handleRoleRevoked(event: RoleRevokedEvent): void {
//   let entity = new RoleRevoked(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.role = event.params.role;
//   entity.account = event.params.account;
//   entity.sender = event.params.sender;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

let totalAmountBurned: BigInt = BigInt.fromI64(0);

export function handleBurn(event: Transfer20Event): void {
  let entity = new Burn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  entity.totalAmountBurned = totalAmountBurned.plus(event.params.amount);

  // let previous = Burn.load(); // id of last?
  // entity.totalAmountBurned = event.params.amount.plus(
  //   previous.params.amount || BigInt.fromI32(0)
  // );

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTransfer20(event: Transfer20Event): void {
  if (event.params.to.toHexString() == ADDRESS_ZERO) {
    handleBurn(event);
  }
}

// export function handleTransfer721(event: Transfer721Event): void {
//   let entity = new Transfer721(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.from = event.params.from;
//   entity.to = event.params.to;
//   entity.PurseToken404_id = event.params.id;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handleUnpaused(event: UnpausedEvent): void {
//   let entity = new Unpaused(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.account = event.params.account;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

// export function handleUpgraded(event: UpgradedEvent): void {
//   let entity = new Upgraded(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.implementation = event.params.implementation;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }
