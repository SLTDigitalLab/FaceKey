import React from 'react'

function PageHeader({ title, children }) {
    return (
        <div className="page-header">
            <h1>{title}</h1>
            <div className="d-flex gap-2 align-items-center">
                {children}
            </div>
        </div>
    )
}

export default PageHeader
