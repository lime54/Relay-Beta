export default function BypassPage() {
    return (
        <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
            <h1>Bypass Route: SUCCESS</h1>
            <p>If you see this, the App Router is working for sub-pages.</p>
            <hr />
            <p>Time: {new Date().toISOString()}</p>
        </div>
    );
}
