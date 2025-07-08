import React from 'react'
import { Toaster, toast } from 'react-hot-toast'
import HelpLink from '@components/translation/HelpLink'
import Translation from "@components/translation/Translation";

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
            </div>
        );
    }
}
