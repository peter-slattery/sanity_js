module.exports = { tests: [
  {
    desc: "Test One",
    proc: (env) => { 
      env.expect(true); 
      env.expect(false); 
      env.expect(true); 
      if (false) {
        env.expect(true); 
      }
    },
  },
  {
    desc: "Test Two",
    proc: (env) => { 
      env.expect(false); 
    },
  },
]};