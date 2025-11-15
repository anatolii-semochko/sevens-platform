import { useSelector } from 'react-redux'
import clsx from 'clsx'

const formatUsd = (n) => {
    if (n === null || n === undefined || isNaN(n)) return ''

    let num = Number(n).toFixed(2)
    let [int, dec] = num.split('.')
    int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

    return int + '.' + dec
}

const formatSevens = (n) =>  {
    if (n === null || n === undefined || isNaN(n)) return ''

    let num = Number(n).toString()
    let [int, dec = ''] = num.split('.')
    int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    if (dec === '') dec = '00'
    else if (dec.length === 1) dec = dec + '0'

    return int + '.' + dec
}

export const $Sevens = ({sevens, label, color, bold}) => {
    if (sevens === null || sevens === undefined || isNaN(sevens)) return null

    const formatted = formatSevens(sevens)
    return (
        <span className={clsx(color && 'text-primary', bold && 'fw-bold')}>
      {formatted}{label && ' $SEV'}
    </span>
    )
}

export const $Usd = ({usd, sevens, label, color, bold}) => {
    const sevensUsdRate = useSelector((state) => state.sevensUsdRate)
    const sum = sevens !== undefined ? sevens / sevensUsdRate : usd

    if (sum === null || sum === undefined || isNaN(sum)) return null

    const formatted = formatUsd(sum)

    return (
        <span className={clsx(color && 'text-dark-red', bold && 'fw-bold')}>
      {formatted}{label && ' $USD'}
    </span>
    )
}
