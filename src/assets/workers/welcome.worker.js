
self.addEventListener('message',(e) => {
  // This runs in a real background thread!
  const greeting = "Welcome! You are now running on the AG Network";

  // Simulate some "work" so you can see the UI stays smooth
  let heavy = 0;
  for (let i = 0; i < 50_000_000; i++) {
    heavy += Math.random();
  }

  self.postMessage({
    type: 'welcome',
    message: greeting,
    network: 'AG Network',
    poweredBy: 'Afro Gift Workers (real background thread)',
    timestamp: new Date().toISOString(),
    proofOfWork: heavy > 0 ? 'Heavy computation done!' : 'No work'
  });
});
