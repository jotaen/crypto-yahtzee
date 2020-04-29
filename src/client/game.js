const inquirer = require("inquirer")
const chalk = require("chalk")
const { count, sum, UPPER_SECTION, LOWER_SECTION } = require("../yahtzee/scorecard")

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

prettyPointNames = {
  upperPoints: "SUM",
  bonus: "BONUS",
  upperTotal: "SECTION",
  lowerTotal: "SECTION",
  total: "TOTAL",
}

const prettyDices = {
  1: "[1]  ●",
  2: "[2]  ● ●",
  3: "[3]  ● ● ●",
  4: "[4]  ● ● ● ●",
  5: "[5]  ● ● ● ● ●",
  6: "[6]  ● ● ● ● ● ●",
}

const renderScoreCards = playerNamesByFinger => yahtzee => {
  console.clear()
  const points = yahtzee.scorecards.map(s => sum(s))
  const names = yahtzee.players.map(f => playerNamesByFinger[f])
  const SP = chalk.gray(" | ")
  const SN = chalk.gray("-+-")
  const CAT_WIDTH = 15
  const DIVIDER = chalk.gray("-".repeat(CAT_WIDTH) + SN + names.map(n => "-".repeat(n.length)).join(SN) + "-+ ")
  const printValues = (values, prettyNames) => prop => {
    const values2print = values
      .map(v => v[prop])
      .map((v, i) => v === null ? " ".repeat(names[i].length) : String(v).padStart(names[i].length, " "))
      .join(SP)
    console.log(chalk.bold(prettyNames[prop].padStart(CAT_WIDTH, " ")) + SP + values2print + SP)
  }

  console.log(" ".repeat(CAT_WIDTH) + SP + names.map((n, i) => {
    return yahtzee.onTurn === i ? chalk.bgCyan.black(n) : n
  }).join(SP) + SP)
  console.log(DIVIDER)
  UPPER_SECTION.forEach(printValues(yahtzee.scorecards, prettyCategoryNames))
  console.log(DIVIDER)
  ;["bonus", "upperTotal"]
    .forEach(printValues(points, prettyPointNames))
  console.log(DIVIDER)
  LOWER_SECTION.forEach(printValues(yahtzee.scorecards, prettyCategoryNames))
  console.log(DIVIDER)
  ;["lowerTotal"]
    .forEach(printValues(points, prettyPointNames))
  console.log(DIVIDER)
  ;["total"]
  .forEach(printValues(points, prettyPointNames))
  console.log(DIVIDER)
}

const doRecord = (yahtzee) => {
  const potentialScores = count(yahtzee.dices)
  const choices = Object.entries(yahtzee.scorecards[yahtzee.onTurn])
    .filter(e => e[1] === null)
    .map(e => ({
      name: `${prettyCategoryNames[e[0]]} (${potentialScores[e[0]]})`,
      value: e[0],
    }))
  return inquirer.prompt({
    type: "list",
    name: "category",
    message: "Choose a category to score",
    choices: choices
  }).then(answers => {
    return { type: "RECORD", value: answers.category }
  })
}

const doSelect = (yahtzee) => {
  const choices = yahtzee.dices.map((d, i) => ({ name: prettyDices[d], value: i }))
  return inquirer.prompt({
    type: "checkbox",
    name: "dicesI",
    message: "Which dice do you want to roll again?",
    choices: choices,
    validate: cs => cs.length > 0 ? true : "Please select one or more dice",
  }).then(answers => {
    const dices = yahtzee.dices.slice()
    answers.dicesI.forEach(i => {
      dices[i] = null
    })
    return { type: "SELECT", value: dices }
  })
}

const printTable = (playerNamesByFinger, isHighlighted) => yahtzee => {
  const onTurn = "On Turn: " + playerNamesByFinger[yahtzee.players[yahtzee.onTurn]]
  console.log(isHighlighted ? chalk.bgGreenBright.black(onTurn) : onTurn)
  console.log("Attempt: " + yahtzee.attempt + " of 3")
  console.log("Dice rolled:")
  yahtzee.dices.forEach(d => console.log(`${prettyDices[d] || "-"}`))
  console.log("")
}

const handleTurn = playerNamesByFinger => (yahtzee, record, select) => {
  printTable(playerNamesByFinger, true)(yahtzee)
  if (select === null) {
    return doRecord(yahtzee, record)
  }
  const chooseAction = () => inquirer.prompt({
    type: "list",
    name: "action",
    message: "What do you want to do?",
    choices: [
      { name: "Select dice you want to roll again", value: "SELECT" },
      { name: "Record score", value: "RECORD" },
    ]
  }).then(answers => {
    const doAction = answers.action === "SELECT" ? doSelect : doRecord
    return doAction(yahtzee).then(action => {
      return inquirer.prompt({
        type: "confirm",
        name: "sure",
        message: "Sure?",
        default: true,
      }).then(answers => {
        return answers.sure ? action : chooseAction()
      })
    })
  })

  return chooseAction().then(action => {
    action.type === "SELECT" ? select(action.value) : record(action.value)
  })
}

module.exports = {
  renderScoreCards, handleTurn, printTable
}
