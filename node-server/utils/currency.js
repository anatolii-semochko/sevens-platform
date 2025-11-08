const { LAMPORTS_PER_SOL } = require('@solana/web3.js')

const sevensToLamp = (sevens) => {
  if (!sevens || sevens === 0) return 0
  const parsed = parseFloat(sevens)
  if (isNaN(parsed)) return 0
  return Math.round(parsed * LAMPORTS_PER_SOL)
}

const lampToSevens = (lamports) => {
  if (!lamports || lamports === 0) return 0
  const parsed = parseFloat(lamports)
  if (isNaN(parsed)) return 0
  return parsed / LAMPORTS_PER_SOL
}

module.exports = {sevensToLamp, lampToSevens}
