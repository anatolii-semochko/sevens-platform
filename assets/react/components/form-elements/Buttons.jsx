import clsx from 'clsx'
import React from "react";

export const ButtonLargeWidth = ({label, onClick, className}) => (
    <button className={clsx('btn w-100 fs-5 p-3 mb-3', className)} onClick={onClick}>{label}</button>
)

export const ButtonWithProcessing = ({label, processingLabel, processing, disabled, onClick, className}) => (
    <button className={clsx('btn px-4', className)} onClick={onClick} disabled={disabled}>
        {processing ? (
            <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                {processingLabel || 'Processing...'}
            </>
        ) : label}
    </button>
)
