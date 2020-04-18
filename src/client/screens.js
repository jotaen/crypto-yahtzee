const inquirer = require("inquirer")
const chalk = require("chalk")
const process = require("process")
const rsa = require("../crypto/rsa")
const { count, sum, UPPER_SECTION, LOWER_SECTION, createScorecard } = require("../yahtzee/scorecard")

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

const displayKey = ownerKeys => {
  renderMainBanner()
  console.log(chalk.bold("This is your public key. Give it to the people you want to play with.\n"))
  console.log(rsa.toString(ownerKeys.public))
  return inquirer
    .prompt({
      type: "confirm",
      name: "return",
      message: "Go back",
      default: true,
    })
}

const mainMenu = ownerKeys => {
  renderMainBanner()
  return inquirer
    .prompt({
      type: "list",
      name: "action",
      message: "Main Menu",
      choices: [
        {name: "Initiate game", value: "INIT"},
        {name: "Join game", value: "JOIN"},
        {name: "Display key", value: "DISPLAY_KEY"},
        {name: "Quit", value: "QUIT"},
      ]
    }).then(answers => {
      console.log(answers)
      if (answers.action === "INIT") {
        return initiateGame()
      } else if (answers.action === "JOIN") {
        return joinGame()
      } else if (answers.action === "DISPLAY_KEY") {
        return displayKey(ownerKeys)
      } else {
        process.exit(0)
      }
    }).then(() => {
      mainMenu(ownerKeys)
    })
}

// {
//   type: "input",
//     name: "publicKey",
//       message: "",
//         validate: n => n.length > 0 && n.length <= 10 ?
//           true : "Name must be between 1 and 10 characters long",
//       }

const prettyCategoryNames = {
  aces: "Aces",
  twos: "Twos",
  threes: "Threes",
  fours: "Fours",
  fives: "Fives",
  sixes: "Sixes",
  threeOfAKind: "Three of a kind",
  fourOfAKind: "Four of a kind",
  fullHouse: "Full House",
  smallStraight: "Small Straight",
  largeStraight: "Large Straight",
  yahtzee: "Yahtzee",
  chance: "Chance",
}

const renderScoreCards = (names, scorecards) => {
  const SP = chalk.gray(" | ")
  const SN = chalk.gray("-+-")
  const CAT_WIDTH = 15
  const DIVIDER = chalk.gray("-".repeat(CAT_WIDTH) + SN + names.map(n => "-".repeat(n.length)).join(SN) + "-+ ")
  const printValues = cat => {
    const scores = scorecards
      .map(s => s[cat])
      .map((v, i) => v === null ? " ".repeat(names[i].length) : v.padStart(names[i].length, " "))
      .join(SP)
    console.log(chalk.bold(prettyCategoryNames[cat].padStart(CAT_WIDTH, " ")) + SP + scores + SP)
  }
  console.log(" ".repeat(CAT_WIDTH) + SP + names.join(SP) + SP)
  console.log(DIVIDER)

  UPPER_SECTION.forEach(printValues)
  console.log(DIVIDER)
  LOWER_SECTION.forEach(printValues)
  console.log(DIVIDER)
}

module.exports = {
  mainMenu
}
