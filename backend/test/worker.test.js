import test from "node:test";import assert from "node:assert/strict";import worker,{validPhone,text} from "../src/worker.js";
test("validates Bangladesh mobile numbers",()=>{assert.equal(validPhone("01310105529"),true);assert.equal(validPhone("123"),false);assert.equal(validPhone("01210105529"),false)});
test("normalizes bounded text",()=>{assert.equal(text("  hello  ",1,10),"hello");assert.equal(text(42,1,10),"");assert.equal(text("abcdefgh",1,4),"abcd")});
test("health endpoint responds safely",async()=>{const res=await worker.fetch(new Request("https://api.example/api/health"),{ALLOWED_ORIGINS:"https://shop.example"});assert.equal(res.status,200);assert.equal(res.headers.get("x-content-type-options"),"nosniff");assert.deepEqual(await res.json(),{ok:true})});
test("unknown route is 404",async()=>{const res=await worker.fetch(new Request("https://api.example/nope"),{ALLOWED_ORIGINS:""});assert.equal(res.status,404)});
test("admin routes reject missing credentials",async()=>{const res=await worker.fetch(new Request("https://api.example/api/admin/orders"),{ALLOWED_ORIGINS:"",ADMIN_TOKEN:"strong-test-token"});assert.equal(res.status,401)});
