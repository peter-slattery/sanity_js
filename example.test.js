module.exports = { tests: [
  {
    desc: "Test One",
    proc: (env) => { 
      env.expect(true); 
    },
  },
  {
    desc: "Test Two",
    proc: (env) => { 
      env.expect(false); 
    },
  },
]};