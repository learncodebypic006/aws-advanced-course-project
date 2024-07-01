
var RedisClustr = require('redis-clustr');
var RedisClient = require('redis');
const { exec } = require("child_process");
const myUtil = require("./myUtil")
const myUtilService = new myUtil()


class awsElasticache {
    constructor() {
      if (!awsElasticache._instance) {
        awsElasticache._instance = this;
        this.redis_cluster_host = process.env.REDIS_CLUSTER_HOST;
        this.redis_cluster_port = process.env.REDIS_CLUSTER_PORT;
        this.redis_cli_script = 'redis-cli';
        this.set_key = 'mysetkey';
        this.hash = "myhash";
      }

      return awsElasticache._instance;        
    }

    set(key, val) {

      return new Promise(async (resolve, reject) => {
        console.log("set() called");  
        const val_json = JSON.stringify(val);
        var cmd_set = `${this.redis_cli_script} -tls -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} set ${key} '${val_json}'`;
        console.log("set() cmd: ", `${this.redis_cli_script} -tls -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} set ${key} [skip_val_debug]`);
        await this.execute_child_process(cmd_set);

        // store keys for later clean up 
        const sadd_result = await this.sadd(key);
        console.log("set() result: " , sadd_result);

        resolve();
      })
    }   

    get(key) {

      return new Promise(async (resolve, reject) => {
        console.log("get() called");  
        var cmd_get = `${this.redis_cli_script} -tls -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} get ${key}`;
        console.log("get() cmd: ", cmd_get);
        let stdout_json = await this.execute_child_process(cmd_get);
        var result = null;
        if (myUtilService.isJson(stdout_json)) {
          result = JSON.parse(stdout_json);
        }          
        // console.log(`result: ${result}`);
        resolve(result);        

      })
    }


    hset(key, val) {

      return new Promise(async (resolve, reject) => {
        console.log("hset() called");
        let val_json = JSON.stringify(val);
        let cmd_hset = `${this.redis_cli_script} -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} hset ${this.hash} ${key} '${val_json}'`;
        console.log("hset() cmd: ", `${this.redis_cli_script} -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} hset ${this.hash} ${key} [skip_val_json]`);
        let stdout_result = await this.execute_child_process(cmd_hset);
        console.log("hset() result: ", stdout_result);
        resolve(stdout_result);
      })

    }    

    hget(key) {

      return new Promise(async (resolve, reject) => {
        console.log("hget() called");  
        var cmd_hget = `${this.redis_cli_script} -tls -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} hget ${this.hash} ${key}`;
        console.log("hget() cmd: ", cmd_hget);
        let stdout_json = await this.execute_child_process(cmd_hget);        
        var result = null;
        if (myUtilService.isJson(stdout_json)) {
          result = JSON.parse(stdout_json);
        }          
        // console.log(`result: ${result}`);
        resolve(result);  

      })
    }

    hdel(key) {

      return new Promise(async (resolve, reject) => {
        console.log("del() called");  
        var cmd_hdel = `${this.redis_cli_script} -tls -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} hdel ${this.hash} ${key}`;
        console.log("del() cmd: ", cmd_hdel);
        const result_hdel = await this.execute_child_process(cmd_hdel);
        resolve(result_hdel);
      })
    }    

    hgetall() {

      return new Promise(async (resolve, reject) => {
        console.log("hgetall() called");  
        var cmd_hgetall = `${this.redis_cli_script} -tls -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} hgetall ${this.hash}`;
        console.log("cmd_hgetall: ", cmd_hgetall);
        let stdout_json = await this.execute_child_process(cmd_hgetall);
        console.log("cmd_hgetall stdout_json: ", stdout_json);
        
        if (stdout_json) {
          let stdout_obj = stdout_json.split(/\r?\n/);
          console.log("cmd_hgetall list: ", stdout_obj);  
          let key_list = [];
          for (let i = 0; i < stdout_obj.length ;i+=2) {
            let emp_no = stdout_obj[i];
            if (emp_no == '') continue;
            let emp_json = stdout_obj[i+1];
            // console.log("emp_no: ", emp_no);  
            // console.log("emp_json: ", emp_json);  
            key_list.push(emp_no);
          }
          
          if (key_list.length > 0) {
            console.log("key_list: ", key_list);  
            resolve(key_list);
          }else {
            resolve(); 
          }
        }else {
          resolve();
        }

      })
    }    

    del(key) {

      return new Promise(async (resolve, reject) => {
        console.log("del() called");  
        var cmd_del = `${this.redis_cli_script} -tls -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} del ${key}`;
        console.log("cmd_del: ", cmd_del);
        const result_del = await this.execute_child_process(cmd_del);
        resolve(result_del);
      })
    }

    sadd(element) {

      return new Promise(async (resolve, reject) => {
        console.log("sadd() called");  
        var cmd_sadd = `${this.redis_cli_script} -tls -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} sadd ${this.set_key} ${element}`;
        console.log("cmd_sadd: ", cmd_sadd);
        const sadd_result = await this.execute_child_process(cmd_sadd);
        resolve(sadd_result);
      })
    }    

    smembers() {

      return new Promise(async (resolve, reject) => {
        console.log("smembers() called");  
        var cmd_smembers = `${this.redis_cli_script} -tls -h ${this.redis_cluster_host} -p ${this.redis_cluster_port} smembers ${this.set_key}`;
        console.log("cmd_smembers: ", cmd_smembers);
        const cmd_smembers_result = await this.execute_child_process(cmd_smembers);
        resolve(cmd_smembers_result);
      })
    }

    sremove() {

      return new Promise(async (resolve, reject) => {
        const allkeys = await this.smembers();
        const allkeys_list = allkeys.split(/\r?\n/);
        console.log("allkeys_list: ", allkeys_list);
        // console.log("typeof(allkeys): ", typeof(allkeys));

        for (let i = 0; i < allkeys_list.length ;i++) {
          let key_to_del = allkeys_list[i];
          if (key_to_del === '') continue;
          const result_sremove = await this.del(key_to_del);
          console.log("result_sremove: ", result_sremove);  
        }

        const del_set_key_result = await this.del(this.set_key);
        console.log("del_set_key_result: ", del_set_key_result);
        resolve();
        
        // let keys_to_del = "";
        // for (let i = 0; i < allkeys_list.length ;i++) {
        //   keys_to_del += " ";
        //   keys_to_del += allkeys_list[i];
        // }
        // console.log("keys_to_del: ", keys_to_del);
        // const result_sremove = await this.del(keys_to_del);
        // console.log("result_sremove: ", result_sremove);
        // resolve();
      })
    }

    cleanallcache() {
      return new Promise(async (resolve, reject) => {
        console.log("cleanallcache() called");  
        const key_list = await this.hgetall();
        if (key_list) {
          for (let i = 0; i < key_list.length ;i++) {
            let key_here =  key_list[i];
            const result_cleanallcache = await this.hdel(key_here);
            console.log("result_cleanallcache: ", result_cleanallcache);    
          }
        }

        resolve();        
      })      
    }


    execute_child_process(cmd) {
      return new Promise(async (resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
              console.log(`error: ${error.message}`);
              return resolve();
          }
          if (stderr) {
              console.log(`stderr: ${stderr}`);
              return resolve();
          }
          // console.log(`stdout: ${stdout}`);
          resolve(stdout);
        });
      })
    }     

}
module.exports = awsElasticache;

