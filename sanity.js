//
// SANITY TEST (sanity.js)
//   Library By Peter Slattery
// 
// LICENSE AT END
//

const fs = require("fs");
const path = require("path");

// Escape codes for log output coloring
const LOG_GREEN = "\x1b[32m";
const LOG_RED = "\x1b[31m";
const LOG_RESET = "\x1b[0m";

// Logging Convenience Wrappers
const Log = (str) => { console.log(str); };
const LogError = (str) => { 
  console.log(`${LOG_RED}ERROR:${LOG_RESET} ${str}`);
};
  
// NOTE(PS): This gets passed to every test and contains the
// functionality necessary to run tests. This way, tests can 
// be completely self contained, not needing to import any 
// globally available files - they simply call functions on 
// this object, mostly just expect() to register that a test
// is being formed
class TestEnv {
  perTest = {
    file: "",
    passed: 0,
    failed: 0,
    expectsFailed: [],
  };
  
  passed = 0;
  failed = 0;
  
  config;
  
  constructor (config) { this.config = config; }
  
  testPrepare (file) {
    this.perTest.passed = 0;
    this.perTest.failed = 0;
    this.expectsFailed = [];
    this.perTest.file = file;
  }
  
  testCleanup () {
    this.passed += this.perTest.passed;
    this.failed += this.perTest.failed;
  }
  
  expect (value) {
    if (value !== undefined && value !== null && value !== false && value !== 0) {
      this.perTest.passed += 1;
    } else {
      this.perTest.failed += 1;
      
      let trace = {id: this.perTest.failed};
      Error.captureStackTrace(trace);

      let arr  = trace.stack.split("\n");
      let line = arr[2]; // go past Error, and this expect function
      let start = line.indexOf("(") + 1;
      let fileLine = line.substring(start, line.length - 1);

      this.perTest.expectsFailed.push(fileLine);
    }
  }
};

const defaultConfig = {
  testFileExtension: ".test.js",
  runBeforeAll:  (env) => {},
  runAfterAll:   (env) => {},
  runBeforeFile: (file, tests, env) => {},
  runAfterFile:  (file, tests, env) => {},
  runBeforeTest: (file, test, env) => {},
  runAfterTest:  (file, test, env) => {},
};

// Loops through all directories within rootDir looking for 
// files that end in .test.js
function findTestFiles (rootDir, config) {
  let result = [];

  const ext = config.testFileExtension;
  const extLen = ext.length;
  
  let dirs = [rootDir];
  for (let i = 0; i < dirs.length; i++) {    
    const dirAt = dirs[i];
    const list = fs.readdirSync(dirAt);
    for (let j = 0; j < list.length; j++) {
      const file = path.resolve(dirAt, list[j]);
      const stat = fs.statSync(file);
      if (stat.isDirectory()) {
        dirs.push(file);
      } else {
        const suffix = file.substring(-extLen,file.length);        
        if (suffix.toLowerCase().includes(ext)) {
          result.push(file);
        }
      }
    }
  }
    
  return result;
}

function runTests(file, tests, env) {
  Log(`======= ${LOG_GREEN}${file}${LOG_RESET} =========`);
  
  env.config.runBeforeFile(file, tests, env);
  for (let i = 0; i < tests.length; i++) {
    let t = tests[i];
    
    env.testPrepare();
    env.config.runBeforeTest(file, t, env);    
    t.proc(env);
    env.config.runAfterTest(file, t, env);
    
    // Printing Results
    let result = env.perTest.failed === 0;
    let resultStr = result ? `${LOG_GREEN}PASS${LOG_RESET}` : `${LOG_RED}FAIL${LOG_RESET}`;    
    let finalStr = `Test: ${t.desc}`;
    let targetLen = 80;
    let dashesNeeded = targetLen - finalStr.length;
    let dashes = "--------------------------------------------------------------------------------";
    finalStr += dashes.substring(0, dashesNeeded);
    finalStr += `[${resultStr}]`;

    Log(finalStr);
    for (let j = 0; j < env.perTest.expectsFailed.length; j++) {
      Log(`    Expect Failed: ${env.perTest.expectsFailed[j]}`);
    }
    
    env.testCleanup();
  }
  env.config.runAfterFile(file, tests, env);
  
  return env;
}

function printUsage () {
  Log("");
  Log("== USAGE ==");
  Log("sanity.js <root_dir> <config_file>");
  Log("  root_dir: sanity.js iterates recursively through all");
  Log("            files and folders within this directory");
  Log("            looking for test files. By default, test");
  Log("            files end in the extension .test.js");
  Log("  config_file: (optional) a javascript file which");
  Log("               exports a single object containing");
  Log("               various config options");
  Log("");
  Log("sanity.js relies on no 3rd party dependencies and tests");
  Log("run through sanity require no imports. The only");
  Log("dependencies sanity.js relies on are fs and path.However,");
  Log("sanity.js can most likely be run in node with any flags");
  Log("set.");
  Log("");
  Log("Command Line Examples:");
  Log("  node sanity.js ./src/");
  Log("  node sanity.js ~/path/to/project ~/path/to/project/sanity_config.js");
  Log("  node sanity.js ./project ../sanity_config.js");
  Log("");
  Log("== TEST FILES ==");
  Log("Test files should look like the following example:");
  Log("  example.test.js");
  Log("    module.exports = { tests: [");
  Log("      {");
  Log("        desc: \"Test Name\",");
  Log("        proc: (env) => { env.expect(true); },");
  Log("      },");
  Log("      // ... more tests here");
  Log("    ]};");
  Log("");
}

function run() {
  
  // Parsing Arguments
  const args = process.argv;
  if (args.length < 3) {
    LogError("Please provide a root directory in which to search for tests");
    printUsage();
    Log("  ...Exiting");
    return;
  }
  
  const command = args[0]; // will always be the path to node
  const thisFile = args[1];
  const rootDir = args[2]; 
  const configPath = "";
  if (args.length >= 4) {
    configPath = args[3];
  }
  
  if (rootDir === "-help" || rootDir === "--help" || rootDir === "/help") {
    printUsage();
  }
  
  // Make sure rootDir is a directory
  let rootPathIssue = false;
  if (fs.existsSync(rootDir)) {
    const stat = fs.statSync(rootDir);
    if (!stat.isDirectory()) {
      LogError("The root path provided is not a directory.");
      rootPathIssue = true;
    }
  } else {
    LogError("The root path provided does not exist");
    rootPathIssue = true;    
  }
  if (rootPathIssue) {
    Log(`  Problem Path: ${rootDir}`);
    Log("  ...Exiting");
    return;
  }
  
  // Load Config
  let config = defaultConfig;
  if (configPath) {
    if (fs.existsSync(configPath)) {
      config = require(configPath);
      if (!config.testFileExtension) {
        config.testFileExtension = defaultConfig.testFileExtension;
      }
    } else {
      LogError("The config file path provided is not valid.");
      Log("  ...Exiting");
      return;
    }
  }
  
  // Find all test files
  let files = findTestFiles(rootDir, config);
  if (files.length == 0) {
    Log("No files ending with '.test.js' were found in the provided directory");
    Log("  ...Exiting");
    return;
  }
  
  // Perform All Tests
  const env = new TestEnv(config);
  let invalidTestFiles = [];
  if (env.config.runBeforeAll) env.config.runBeforeAll(env);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { tests } = require(file);
    if (tests) {
      runTests(file, tests, env);
    } else {
      invalidTestFiles.push(file);      
    }
  }
  if (env.config.runAfterAll) env.config.runAfterAll(env);
  
  // Results Reporting
  Log(`Total Passed/Failed: (${env.passed}/${env.failed})`);
  const str = env.failed === 0 ? `${LOG_GREEN}ALL TESTS PASSED${LOG_RESET}` : `${LOG_RED}TESTS FAILED${LOG_RESET}`
  Log(str);
  
  // Invalid Test Files Reporting
  if (invalidTestFiles.length > 0) {
    Log("\nInvalid Test Files were found.");
    Log("  This does not prevent correct execution of other tests.");
    Log("\nInvalid Test Files:");
    for (let i = 0; i < invalidTestFiles.length; i++) {
      Log(`  ${LOG_RED}${invalidTestFiles[i]}${LOG_RESET}`);
    }
  }
}

run();

/*
Copyright 2022 Peter Slattery

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/