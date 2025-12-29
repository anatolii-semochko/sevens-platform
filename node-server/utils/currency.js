const { LAMPORTS_PER_SOL } = require('@solana/web3.js')

const solToLamp = (sol) => {
  if (!sol || sol === 0) return 0
  const parsed = parseFloat(sol)
  if (isNaN(parsed)) return 0
  return Math.round(parsed * LAMPORTS_PER_SOL)
}

const lampToSol = (lamports) => {
  if (!lamports || lamports === 0) return 0
  const parsed = parseFloat(lamports)
  if (isNaN(parsed)) return 0
  return parsed / LAMPORTS_PER_SOL
}

module.exports = {solToLamp, lampToSol}
