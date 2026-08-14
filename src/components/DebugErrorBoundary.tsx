import React from 'react'

export class DebugErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('🔴 CRASH CAPTURADO:', error)
        console.error('🔴 COMPONENT STACK:', info.componentStack)
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: 20, color: 'red', whiteSpace: 'pre-wrap' }}>
                    <h2>Error al renderizar el chat</h2>
                    <p>{this.state.error.message}</p>
                    <pre>{this.state.error.stack}</pre>
                </div>
            )
        }
        return this.props.children
    }
}