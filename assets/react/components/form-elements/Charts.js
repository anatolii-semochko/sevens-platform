import clsx from 'clsx'

export const StatusBar = ({label, className, processStatus}) => (
    <div className="d-flex align-items-center gap-2">
        <div className="flex-grow-1">
            <div className="progress" role="progressbar" aria-label="total compression progress">
                <div
                    className={clsx('progress-bar progress-bar-striped progress-bar-animated', className)}
                    style={{ width: `${processStatus}%` }}
                />
            </div>
            <div className="small text-muted mt-1">{label}: {processStatus}%</div>
        </div>
    </div>
)
