const chalk = require("chalk")
const { count, sum, UPPER_SECTION, LOWER_SECTION, createScorecard } = require("../yahtzee/scorecard")

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

const renderScoreCards = (yahtzee) => {
  console.clear()
  const names = yahtzee.players.map(p => p.substr(0, 6))
  const SP = chalk.gray(" | ")
  const SN = chalk.gray("-+-")
  const CAT_WIDTH = 15
  const DIVIDER = chalk.gray("-".repeat(CAT_WIDTH) + SN + names.map(n => "-".repeat(n.length)).join(SN) + "-+ ")
  const printValues = cat => {
    const scores = yahtzee.scorecards
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
  renderScoreCards
}
