const inquirer = require("inquirer")
const chalk = require("chalk")
const { count, sum, UPPER_SECTION, LOWER_SECTION, createScorecard } = require("../yahtzee/scorecard")

module.exports.renderStartScreen = () => {
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
  return inquirer
    .prompt([
      {
        type: "input",
        name: "name",
        message: "What’s your name?",
        validate: n => n.length > 0 && n.length <= 10 ?
          true : "Name must be between 1 and 10 characters long",
      }
    ])
}

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

module.exports.renderScoreCards = (names, scorecards) => {
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
