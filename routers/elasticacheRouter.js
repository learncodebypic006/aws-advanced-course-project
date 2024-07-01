const express = require("express");
const router = express.Router();
const empModel = require("../models/empModel");
const empModelService = new empModel();
const awsElasticache = require("../utils/awsElasticache");
const awsElasticacheService = new awsElasticache();
const emp_list_key = "emp_list";
const myUtil = require("../utils/myUtil")
const myUtilService = new myUtil();

router.get("/elasticache/list_employee", async function (req, res) {
  console.log("/elasticache/list_employee called");
  const start_time = new Date().getTime();
  const result = await empModelService.list_employee();
  res.send({"result": result,"processed_time": myUtilService.get_process_time(start_time)});
});

router.get("/elasticache/list_employee_cached", async function (req, res) {
  console.log("/elasticache/list_employee_cached called");
  const start_time = new Date().getTime();

  // get cache 
  const result_cached = await awsElasticacheService.hget(emp_list_key);
  if (result_cached) {
    console.log("emp_list_cache exists");
    res.send({"result": result_cached,"processed_time": myUtilService.get_process_time(start_time)});
    return;
  }

  // main logic
  console.log("emp_list_cache not exists");
  const result = await empModelService.list_employee();
  // set cache 
  await awsElasticacheService.hset(emp_list_key, result);

  res.send({"result": result,"processed_time": myUtilService.get_process_time(start_time)});
});


router.get("/elasticache/get_employee", async function (req, res) {
  console.log("/elasticache/get_employee called");
  const start_time = new Date().getTime();
  var empName = req.query.empName;
  var mgrName = req.query.mgrName;
  var cacheKey = "empName_" + empName + "__" + "mgrName_" + mgrName;
  // var cacheKey = empName + mgrName; // wrong-one case

  // get cache 
  const result_cached = await awsElasticacheService.hget(cacheKey); 
  if (result_cached) {
    console.log("cache exists");
    res.send({"result": result_cached,"processed_time": myUtilService.get_process_time(start_time)});
    return;
  }

  // main logic
  console.log("cache not exists");
  const result = await empModelService.get_employees_by_empname_and_mgrname(empName, mgrName); 
  // set cache 
  await awsElasticacheService.hset(cacheKey, result);

  res.send({"result": result,"processed_time": myUtilService.get_process_time(start_time)});
});

router.get("/elasticache/clean", async function (req, res) {
  console.log("/elasticache/clean called");
  await awsElasticacheService.del(emp_list_key);
  res.send({});
});

router.get("/elasticache/cleanall", async function (req, res) {
  console.log("/elasticache/clean called");
  await awsElasticacheService.cleanallcache();
  res.send({});
});

module.exports = router;