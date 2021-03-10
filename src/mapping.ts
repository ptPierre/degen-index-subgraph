import { BigInt, store, Bytes } from "@graphprotocol/graph-ts"
import {
  SigmaIndexPoolV1,
  Approval,
  LOG_DENORM_UPDATED,
  LOG_DESIRED_DENORM_SET,
  LOG_EXIT,
  LOG_JOIN,
  LOG_MAX_TOKENS_UPDATED,
  LOG_MINIMUM_BALANCE_UPDATED,
  LOG_PUBLIC_SWAP_TOGGLED,
  LOG_SWAP,
  LOG_SWAP_FEE_UPDATED,
  LOG_TOKEN_ADDED,
  LOG_TOKEN_READY,
  LOG_TOKEN_REMOVED,
  Transfer
} from "../generated/SigmaIndexPoolV1/SigmaIndexPoolV1"
import { Pool, Account, Token } from "../generated/schema"

/*export function handleApproval(event: Approval): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.src = event.params.src
  entity.dst = event.params.dst

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.VERSION_NUMBER(...)
  // - contract.allowance(...)
  // - contract.approve(...)
  // - contract.balanceOf(...)
  // - contract.decimals(...)
  // - contract.decreaseApproval(...)
  // - contract.exitswapExternAmountOut(...)
  // - contract.exitswapPoolAmountIn(...)
  // - contract.extrapolatePoolValueFromToken(...)
  // - contract.getBalance(...)
  // - contract.getController(...)
  // - contract.getCurrentDesiredTokens(...)
  // - contract.getCurrentTokens(...)
  // - contract.getDenormalizedWeight(...)
  // - contract.getExitFeeRecipient(...)
  // - contract.getMinimumBalance(...)
  // - contract.getNumTokens(...)
  // - contract.getSpotPrice(...)
  // - contract.getSwapFee(...)
  // - contract.getTokenRecord(...)
  // - contract.getTotalDenormalizedWeight(...)
  // - contract.getUsedBalance(...)
  // - contract.increaseApproval(...)
  // - contract.isBound(...)
  // - contract.isPublicSwap(...)
  // - contract.joinswapExternAmountIn(...)
  // - contract.joinswapPoolAmountOut(...)
  // - contract.name(...)
  // - contract.swapExactAmountIn(...)
  // - contract.swapExactAmountOut(...)
  // - contract.symbol(...)
  // - contract.totalSupply(...)
  // - contract.transfer(...)
  // - contract.transferFrom(...)
}*/

function loadOrCreatePool(address: string): Pool{
  
  let pool = Pool.load(address);
  if(pool == null){
    pool = new Pool(address);
  }
  return pool as Pool;
}

function loadOrCreateAccount(address: string): Account{
  let account = Account.load(address);
  if(account == null){
    account = new Account(address);
    account.balance = BigInt.fromI32(0);
  }
  return account as Account;
}

function loadOrCreateToken(address: string): Token{
  let token = Token.load(address);
  if(token == null){
    token = new Token(address);
  }
  return token as Token;
}

export function handleSwapFee(event: LOG_SWAP_FEE_UPDATED): void{
  let id = "1";
  let pool = loadOrCreatePool(id);

  pool.swap_fee = event.params.swapFee;
  pool.save();

}

export function handleLOG_TOKEN_ADDED(event: LOG_TOKEN_ADDED): void{
  
  let pool = loadOrCreatePool("1");
  let currentTokens = pool.tokensList;
  currentTokens.push(event.params.token);
  pool.tokensList = currentTokens;
  pool.save();
}

export function handleLOG_TOKEN_REMOVED(event: LOG_TOKEN_REMOVED): void{
  let tokensList = new Array<Bytes>();
  let pool = Pool.load("1");
  let currentTokens = pool.tokensList;
  for(let i = 0 ; i < currentTokens.length; i++){
    let token = currentTokens[i];
    if(token.toString() != event.params.token.toString()){
      tokensList.push(token);
    }
  }
  pool.tokensList = tokensList;
  pool.save();
}

export function handleTransfer(event: Transfer): void{
  let id = "1";
  let pool = loadOrCreatePool(id);

  let addressFrom = event.params.src.toHexString();
  let addressTo = event.params.dst.toHexString();
  let value = event.params.amt;

  let isMint = event.params.src.toHexString() == "0x0000000000000000000000000000000000000000";
  let isBurn = event.params.dst.toHexString() == "0x0000000000000000000000000000000000000000";
  
  if (isMint) {
    pool.totalSupply = pool.totalSupply.plus(event.params.amt);
    pool.save();
  }
  else{
    let accountFrom = loadOrCreateAccount(addressFrom);
    accountFrom.balance = accountFrom.balance.minus(value);
    accountFrom.save();
  }
  
  if (isBurn) {
    pool.totalSupply = pool.totalSupply.minus(event.params.amt);
    pool.save();
  } 
  else{
    let accountTo = loadOrCreateAccount(addressTo);
    accountTo.balance = accountTo.balance.plus(value);
    accountTo.save();
  }

  pool.save();
}


