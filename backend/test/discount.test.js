import test from"node:test";
import assert from"node:assert/strict";
import{discountStatus,priceFor}from"../src/utils/discount.js";
import{productInput}from"../src/utils/validate.js";

const now=new Date("2026-09-15T10:00:00.000Z");
const product={price:1000,discount:{enabled:true,type:"percentage",value:20,startAt:new Date("2026-09-15T09:00:00.000Z"),endAt:new Date("2026-09-15T11:00:00.000Z"),quantityLimit:50,quantityUsed:10}};

test("calculates percentage and fixed discounts",()=>{assert.deepEqual(priceFor(product,now).currentPrice,800);assert.equal(priceFor({...product,discount:{...product.discount,type:"fixed",value:200}},now).currentPrice,800)});
test("scheduled, expired and quantity limits disable offers",()=>{assert.equal(discountStatus({...product,discount:{...product.discount,startAt:new Date("2026-09-15T12:00:00.000Z")}},now),"scheduled");assert.equal(discountStatus({...product,discount:{...product.discount,endAt:new Date("2026-09-15T09:00:00.000Z")}},now),"expired");assert.equal(discountStatus({...product,discount:{...product.discount,quantityUsed:50}},now),"sold_out")});
test("rejects unsafe discount values",()=>{const base={name:"Honey",slug:"honey",category:"মধু",weight:"500g",price:1000,stock:10,description:"Pure flower honey",image:"/assets/honey.webp"};assert.throws(()=>productInput({...base,discount:{enabled:true,type:"percentage",value:101}}),/Discount/);assert.throws(()=>productInput({...base,discount:{enabled:true,type:"fixed",value:1001}}),/Discount/);assert.doesNotThrow(()=>productInput({...base,discount:{enabled:true,type:"fixed",value:200,quantityLimit:10}}))});
