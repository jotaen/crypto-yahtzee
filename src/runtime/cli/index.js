const inquirer = require("inquirer")
const chalk = require("chalk")

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
