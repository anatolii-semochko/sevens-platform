import React, {useEffect, useMemo, useState} from 'react'
import MaterialClaimApi from '@react/api/materialClaimApi'
import store from '@react/store'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react'
import { SevensWalletAdapter } from '@react/components/wallet/WalletAdapter'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { signNonce, WalletClaimMaterialsForm } from '@react/components/form-elements/WalletForms'
import { getDateFromDate } from '@js/utils/time'
import { getWalletTokens } from '@js/blockchain/sevens-token'
import { UserAuthorization } from '@react/components/form-elements/UserAuthorization'
import { ButtonLargeWidth } from '@react/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'

const materialClaimApi = new MaterialClaimApi()

const MaterialClaimInner = () => {
    if (!store.getState().user) return (
        <UserAuthorization message={'To publish material you need to log in.'}/>
    )

    const wallet = useWallet()
    const [selected, setSelected] = useState([])
    const [waitingSignature, setWaitingSignature] = useState(false)
    const [walletSignature, setWalletSignature] = useState(null)
    const [materials, setMaterials] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        setError(null)
        setMaterials([])
        setSelected([])
        if (wallet.publicKey) {
            getWalletTokens(wallet.publicKey.toString()).then(materialClaimApi.get).then(setMaterials).catch(setError)
        }
    }, [wallet.publicKey])

    // useEffect(() => {
    //     if (walletSignature) {
    //         materialClaimApi.post(selected, walletSignature).catch(setError)
    //     }
    // }, [walletSignature])

    const handleClaim = () => {
        setError(null)
        signNonce(wallet)
            .then((walletSignature) => {
                materialClaimApi.post(selected, walletSignature)
                    .then(() => {
                        console.log(666)
                    })
                    .catch(setError)
            })
            .catch(setError)
    }

    return (
        <div>
            <WalletClaimMaterialsForm operation={'claim'} waitingSignature={waitingSignature}/>
            <MaterialsList {...{wallet, materials, selected, setSelected}} />
            <ErrorMessageBlock message={error} />
            {!!selected.length && (
                <ButtonLargeWidth
                    className={'btn-success'}
                    label={`Claim selected materials (${selected.length})`}
                    onClick={handleClaim}
                />
            )}
            <div className="d-flex justify-content-end gap-2 mb-3">
                <a className="btn btn-secondary px-5" href={Routing.generate('material_manage')}>
                    Materials management
                </a>
            </div>
        </div>
    )
}

const MaterialsList = ({wallet, materials, selected, setSelected}) => {
    if (!wallet.publicKey) {
        return
    }

    if (!materials.length) return (
        <h4 className="text-center p-2">No materials to claim for this wallet.</h4>
    )

    const Status = ({status}) => status ?
        <span className="badge bg-success">Active</span> :
        <span className="badge bg-danger">Inactive</span>

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelected(materials.map(material => material.token))
        } else {
            setSelected([])
        }
    }

    const handleSelectItem = (token) => {
        setSelected(prev => {
            if (prev.includes(token)) {
                return prev.filter(t => t !== token)
            } else {
                return [...prev, token]
            }
        })
    }

    const isAllSelected = materials.length > 0 && selected.length === materials.length

    return (
        <div>
            <h4 className="text-center p-2">Found materials available to claim:</h4>
            <table className="table align-middle">
                <thead>
                <tr>
                    <th>
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            className="form-check-input"
                        />
                    </th>
                    <th className="d-none d-lg-table-cell text-break small">Token</th>
                    <th>Publication</th>
                    <th>Created At</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                {materials.map((material, key) => (
                    <tr key={key}>
                        <td>
                            <input
                                type="checkbox"
                                checked={selected.includes(material.token)}
                                onChange={() => handleSelectItem(material.token)}
                                className="form-check-input"
                            />
                        </td>
                        <td className="d-none d-lg-table-cell text-break small">{material.token}</td>
                        <td>{material.title}</td>
                        <td>{getDateFromDate(material.createdAt)}</td>
                        <td><Status status={material.active}/></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

const MaterialClaim = () => {
    const wallets = useMemo(() => [
        new SevensWalletAdapter(),
        new PhantomWalletAdapter()
    ], [])

    return (
        <ConnectionProvider endpoint={process.env.ANCHOR_PROVIDER_URL}>
            <WalletProvider wallets={wallets} autoConnect={true}>
                <WalletModalProvider>
                    <MaterialClaimInner />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default MaterialClaim
