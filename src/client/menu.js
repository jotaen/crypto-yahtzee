const fileSystem = require("fs").promises
const inquirer = require("inquirer")
const chalk = require("chalk")
const process = require("process")
const rsa = require("../crypto/rsa")
const { PLAYERS_FOLDER } = require("./config")

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
  const addPlayer = otherPlayersPublicKeys => inquirer.prompt({
      type: "editor",
      name: "key",
      message: "Open vim editor to paste fellow player’s public RSA key",
    }).then(answers => {
      const key = rsa.isPublicKey(answers.key) ? answers.key : null
      const next = key ? {
        type: "confirm",
        name: "add",
        message: "Do you want to add another player?",
        default: false,
      } : {
        type: "confirm",
        name: "add",
        message: "That’s not a valid key. Try again?",
        default: false,
      }
      if (key) {
        otherPlayersPublicKeys.push(rsa.toKeyO(key))
      }
      return inquirer.prompt(next)
    }).then(answers => {
      return answers.add ? addPlayer(otherPlayersPublicKeys) : otherPlayersPublicKeys
    })
  return addPlayer([])
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
        return fileSystem.writeFile(PLAYERS_FOLDER + "/" + name, key)
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
          .then(otherPlayerPublicKeys => {
            return otherPlayerPublicKeys.length === 0 ? 
              mainMenu(ownerKeys) : otherPlayerPublicKeys
          })
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

module.exports = {
  mainMenu, waiting
}
