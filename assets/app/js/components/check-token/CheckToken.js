import React from 'react'
import { Toaster, toast } from 'react-hot-toast'
import HelpLink from '@components/help/HelpLink'

export default class CheckToken extends React.Component {


    render() {
        return (
            <div>

                <Toaster position="top-right" reverseOrder={false}/>
                <h2>React</h2>
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
                        <td></td>
                    </tr>
                    <tr>
                        <td>Toaster</td>
                        <td>
                            <button className="btn btn-success"
                                    onClick={() => toast.success('Toaster Success!')}>Success
                            </button>
                        </td>
                        <td>
                            <button className="btn btn-danger" onClick={() => toast.error('Toaster Error!')}>Error
                            </button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
