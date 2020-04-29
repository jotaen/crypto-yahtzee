const fileSystem = require("fs").promises
const inquirer = require("inquirer")
const chalk = require("chalk")
const process = require("process")
const rsa = require("../crypto/rsa")
const { DATA_DIRECTORY, PLAYERS_FOLDER } = require("./config")

const renderMainBanner = () => {
  console.clear()
  console.log(chalk.bold("=".repeat(10) + " CRYPTO YAHTZEE " + "=".repeat(10)))
  console.log(chalk.redBright(`
       .-------.    ______
      /   o   /|   /\\     \\
     /_______/o|  /o \\  o  \\
     | o     | | /   o\\_____\\
     |   o   |o/ \\o   /o    /
     |     o |/   \\ o/  o  /
     '-------'     \\/____o/
  `))
  console.log("")
}

const setupGame = () => {
  renderMainBanner()
  return fileSystem.readdir(DATA_DIRECTORY + PLAYERS_FOLDER).then(keyFiles =>
    Promise.all(keyFiles.map(file =>
      fileSystem.readFile(DATA_DIRECTORY + PLAYERS_FOLDER + "/" + file).then(content =>
        ({ name: file, key: rsa.toKeyO(content) }))))
  ).then(players => inquirer.prompt({
    type: "checkbox",
    name: "players",
    message: "Select players",
    choices: players.map(p => ({ name: p.name, value: p })),
  })).then(({ players }) => players)
}

const displayKey = ownerKeys => {
  renderMainBanner()
  console.log(chalk.bold("This is your public key. Give it to the people you want to play with.\n"))
  console.log(rsa.toString(ownerKeys.public))
  return inquirer.prompt({
    type: "confirm",
    name: "return",
    message: "Go back",
    default: true,
  })
}

const waiting = () => {
  renderMainBanner()
  console.log(chalk.bold("Starting the game, hang tight..."))
}

const registerPlayers = () => {
  renderMainBanner()
  return inquirer.prompt(
    {
      type: "text",
      name: "name",
      message: "Enter name of player",
      validate: n => String(n).length >= 1 && String(n).length <= 8 ? true
        : "Name must be between 1–8 characters long"
    }).then(({ name }) => {
      const addKey = () => inquirer.prompt({
        type: "editor",
        name: "key",
        message: "Open vim editor to enter RSA public key",
      }).then(({ key }) => {
        if (!rsa.isPublicKey(key)) {
          return inquirer.prompt({
            type: "confirm",
            name: "tryAgain",
            message: "That’s not a valid key. Try again?",
            default: true,
          }).then(({ tryAgain }) => {
            if (tryAgain) {
              return addKey()
            }
          })
        }
        return fileSystem.writeFile(DATA_DIRECTORY + PLAYERS_FOLDER + "/" + name, key)
      })
      return addKey()
    })
}

const mainMenu = ownerKeys => {
  renderMainBanner()
  return inquirer.prompt({
      type: "list",
      name: "action",
      message: "Main Menu",
      choices: [
        {name: "Start game", value: "START"},
        {name: "Register player", value: "REGISTER_PLAYERS"},
        {name: "Display own key", value: "DISPLAY_KEY"},
        {name: "Quit", value: "QUIT"},
      ]
    }).then(answers => {
      if (answers.action === "START") {
        return setupGame()
      } else if (answers.action === "DISPLAY_KEY") {
        return displayKey(ownerKeys)
          .then(() => mainMenu(ownerKeys))
      } else if (answers.action === "REGISTER_PLAYERS") {
        return registerPlayers()
          .then(() => mainMenu(ownerKeys))
      } else {
        console.clear()
        process.exit(0)
      }
    })
}

const goodBye = () => {
  console.log("Game finished!")
}

module.exports = {
  mainMenu, waiting, goodBye
}
