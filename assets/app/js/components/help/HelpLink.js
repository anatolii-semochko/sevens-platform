import React from 'react'
import store from '@store/index'
import { fetchHelps } from '@api/help'

export default class HelpLink extends React.Component {
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
        const { helpName, helpLink } = this.state
        if (!helpLink) {
            fetchHelps({ help: [helpName] }).then((response) => {
                const fetchedLink = response[helpName];
                if (fetchedLink) {
                    store.dispatch({
                        type: 'SET_HELP_LINK',
                        payload: {
                            name: helpName,
                            data: fetchedLink,
                        },
                    });
                    this.setState({ helpLink: fetchedLink })
                }
            })
        }
    }

    render() {
        const { currentLocale, helpName, helpLink } = this.state
        const toggle = () => this.setState({ opened: !this.state.opened })

        return helpLink ? (
            <div className={`help-link${this.state.opened ? ' active' : ''}`}>
                <a onClick={() => toggle()} className="toggle-help cursor-pointer">
                    {helpLink.title}
                    <i className={`bi bi-question-circle px-1${helpLink.title ? '' : ' text-danger'}`}></i>
                </a>
                <div>
                    {helpLink.shortDescription} {helpLink.url &&
                        <a href={`/${currentLocale}/help/${helpLink.url}`} target="_blank">Read more</a>
                    }
                </div>
            </div>
        ) : (
            <div className="text-danger font-weight-bold">{helpName}</div>
        );
    }
}
