const inquirer = require("inquirer")
var swarm = require("discovery-swarm")
const chalk = require('chalk')

var sw = swarm()

sw.listen(1000)
sw.join('aoisdyf87asdfjsadfiuhd') // can be any id/name/hash

sw.on('connection', function (connection) {
  console.log('found + connected to peer')
})

inquirer
  .prompt([
    {
      type: "list",
      name: "dingens",
      message: "How are you today?",
      choices: ["Good", "So so", "really fucked up"],
    }
  ])
  .then(answers => {
    inquirer.prompt([{
      type: "list",
      name: "dingens",
      message: "Really? " + answers.dingens + "???!?",
      choices: ["Yeah!"],
    }]).then(console.log)
  })
  .catch(error => {
    console.log(error)
  })
