import React from 'react'
import store from '@react/store/index'
import { fetchHelps } from '@react/api/helpApi'

export default class HelpLink extends React.Component {
    static helpLinksPromise = null

    constructor(props) {
        super(props)
        this.state = {
            currentLocale: store.getState().currentLocale,
            helpName: props.name,
            helpLink: store.getState().helpLinks?.[props.name] || null,
            opened: false,
        }
    }

    componentDidMount() {
        const state = store.getState()
        const helpLinks = state.helpLinks
        const helpName = this.state.helpName

        if (!helpLinks || Object.keys(helpLinks).length === 0) {
            if (!HelpLink.helpLinksPromise) {
                HelpLink.helpLinksPromise = fetchHelps()
                    .then((result) => {
                        if (result) {
                            store.dispatch({
                                type: 'SET_HELP_LINKS',
                                payload: result,
                            })
                        }
                        return result
                    })
                    .finally(() => HelpLink.helpLinksPromise = null)
            }
            HelpLink.helpLinksPromise.then((result) => this.setState({
                helpLink: result?.[helpName] ?? null,
            }))
        } else {
            this.setState({
                helpLink: helpLinks[helpName] ?? null,
            })
        }
    }

    render() {
        const { currentLocale, helpName, helpLink } = this.state
        const toggle = () => this.setState({ opened: !this.state.opened })

        return (
            <div className={`help-link${this.state.opened ? ' active' : ''}`}>
                <a
                    onClick={toggle}
                    className={`toggle-help cursor-pointer${!helpLink?.title || !helpLink?.shortDescription ? ' text-danger' : ''}`}
                >
                    {helpLink ? helpLink.title : helpName}
                    <i className={`bi bi-${this.state.opened ? 'x' : 'question'}-circle px-1`}></i>
                </a>
                <div>
                    {helpLink?.shortDescription} {helpLink?.pageUrl &&
                    <a href={`/${currentLocale}/help/${helpLink.pageUrl}`} target="_blank">Read more</a>
                }
                </div>
            </div>
        )
    }
}
