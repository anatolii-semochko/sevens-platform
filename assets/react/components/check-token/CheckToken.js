import React from 'react'
import { showModal } from '@js/modal'
import { Toaster, toast } from 'react-hot-toast'
import { WalletButton } from '@react/components/wallet/Wallet'
import HelpLink from '@react/components/translation-help/HelpLink'
import Translation from '@react/components/translation-help/Translation'

export default class CheckToken extends React.Component {

    render() {
        return (
            <div className="pb-3">
                <Toaster position="top-right" reverseOrder={false}/>
                <h2>React (file assets/app/js/components/check-token/CheckToken.js)</h2>
                <table className="table">
                    <thead>
                    <tr>
                        <th className="w-25">React Element</th>
                        <th>Content</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>Help Link without page</td>
                        <td><HelpLink name="Test"/></td>
                    </tr>
                    <tr>
                        <td>Not Existing Help LinK</td>
                        <td><HelpLink name="Test is Absent"/></td>
                    </tr>
                    <tr>
                        <td>Help Link with page</td>
                        <td><HelpLink name="Container files"/></td>
                    </tr>
                    <tr>
                        <td>Translation</td>
                        <td><Translation text={'Home'} /></td>
                    </tr>
                    <tr>
                        <td>Translation with domain</td>
                        <td><Translation text={'Price'} domain={'material'} /></td>
                    </tr>
                    <tr>
                        <td>Translation with domain and parameters</td>
                        <td><Translation text={'Author: {{ name }}'} params={{name: 'Ali Baba'}} domain={'material'} /></td>
                    </tr>
                    <tr>
                        <td>Absent translation</td>
                        <td><Translation text={'Absent translation: {{ name }}'} /></td>
                    </tr>
                    </tbody>
                </table>
                <button className="btn btn-success" onClick={() => toast.success('Toaster Success!')}>
                    Success
                </button>
                <button className="btn btn-danger ms-2" onClick={() => toast.error('Toaster Error!')}>
                    Error
                </button>
                <button className="btn btn-info ms-2" onClick={() => showModal({
                    id: 'modal-id',
                    title: "Modal Popup",
                    body: "This modal was dynamically created.",
                    size: 'lg', // sm, lg, xl, ''
                    footer: (
                        <>
                            <button type="button" className="btn btn-success" data-bs-dismiss="modal">
                                Save
                            </button>
                            <button type="button" className="btn btn-danger" onClick={() => alert('Custom action')}>
                                Delete
                            </button>
                        </>
                    )
                })}>
                    <Translation text={'Open Popup'} />
                </button>
                <WalletButton />
            </div>
        )
    }
}
