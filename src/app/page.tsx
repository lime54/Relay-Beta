export default function TestPage() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      backgroundColor: '#000',
      color: '#fff'
    }}>
      <h1>Relay Beta - Test Mode</h1>
      <p>If you can see this, the routing for "/" is working perfectly.</p>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #333', borderRadius: '8px' }}>
        <p>Current Time: {new Date().toISOString()}</p>
      </div>
    </div>
  );
}
