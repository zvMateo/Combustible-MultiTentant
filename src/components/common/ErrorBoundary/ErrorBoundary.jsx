import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Puedes loguear el error a un servicio externo aquí
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: "center" }}>
          <h2>Ocurrió un error inesperado</h2>
          <pre
            style={{
              color: "#b91c1c",
              background: "#fef2f2",
              padding: 16,
              borderRadius: 8,
            }}
          >
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
