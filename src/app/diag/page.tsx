export default function DiagPage() {
    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h1>Relay Diagnostics</h1>
            <p>Routing is working! Current Time: {new Date().toISOString()}</p>
        </div>
    );
}
