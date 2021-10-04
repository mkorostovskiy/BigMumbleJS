const  fs  = require("fs");
const path = require("./path");
fs.readFile(path.mumbleJSON,"utf-8",(err,data)=>{
    console.log(data);
    const obj = JSON.parse(data);
    console.log(obj);
})