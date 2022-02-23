# sanity.js

sanity.js is a small javascript testing utility, written in the style of the [STB libraries](https://github.com/nothings/stb/blob/master/docs/stb_howto.txt).

## Usage

```bash
node sanity.js <root_directory> <config_file>
```

- **root_directory**: sanity.js iterates recursively through all files and folders within this directory looking for test files. By default, test files end in the extension `.test.js`.
- **config_file**: (optional) a javascript file which exports a single object containing various config options

## Test Files

Each test file exports an array of tests to be run. Each test is a description string and a test function. 

The test function receives an `env` argument which supplies all testing functionality necessary to run tests.

### Env Object

- `expect(value)`  - takes in a value which is considered to have passed if it is not undefined, null, false, or 0. Failed expect's are reported in the application output. Any given test may have as few or as man expect calls in it as you want. 
  **NOTE:**A test with no expects in it is considered to have passed.

### Example Test File

```javascript
module.exports = { 
  tests: [
    {
      desc: "Test Name",
      proc: (env) => { env.expect(true); },
    },
    // ... more tests here
  ]
};
```

## Example Config File

*Note: this is actually the default config that is used if you do not pass one in.*

```javascript

module.exports = {
  // determines which files will be treated as though they have tests in them
  testFileExtension: ".test.js",

  // these are run before and after all tests have run, respectively
  runBeforeAll:  (env) => {},
  runAfterAll:   (env) => {},
	
  // these functions are run before and after all tests in a file have been performed, repsectively, 
  runBeforeFile: (file, tests, env) => {},
  runAfterFile:  (file, tests, env) => {},
    
  // these functions will be run before and after each test is run, respectively
  runBeforeTest: (file, test, env) => {},
  runAfterTest:  (file, test, env) => {},
};

```

