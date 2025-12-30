import { useSelector } from 'react-redux'
import clsx from 'clsx'

const formatUsd = (n) => {
    if (n === null || n === undefined || isNaN(n)) return ''

    let num = Number(n).toFixed(2)
    let [int, dec] = num.split('.')
    int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

    return int + '.' + dec
}

const formatSol = (n) =>  {
    if (n === null || n === undefined || isNaN(n)) return ''

    let num = Number(n).toString()
    let [int, dec = ''] = num.split('.')
    int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    if (dec === '') dec = '00'
    else if (dec.length === 1) dec = dec + '0'

    return int + '.' + dec
}

export const $Sol = ({sol, label, color, bold}) => {
    if (sol === null || sol === undefined || isNaN(sol)) return null

    const formatted = formatSol(sol)
    return (
        <span className={clsx(color && 'text-primary', bold && 'fw-bold')}>
      {formatted}{label && ' SOL'}
    </span>
    )
}

export const $Usd = ({usd, sol, label, color, bold}) => {
    const solUsdRate = useSelector((state) => state.solUsdRate)
    const sum = sol !== undefined ? sol * solUsdRate : usd

    if (sum === null || sum === undefined || isNaN(sum)) return null

    const formatted = formatUsd(sum)

    return (
        <span className={clsx(color && 'text-dark-red', bold && 'fw-bold')}>
      {formatted}{label && ' $USD'}
    </span>
    )
}
