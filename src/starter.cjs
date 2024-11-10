const { exec } = require('child_process');

// Array of your script names or paths
const scripts = [
  'retreiv.cjs',
  'server.cjs',
  'newserver.cjs',
  'teacher.cjs',
  'login.cjs',
];

// Start each script
scripts.forEach(script => {
  const process = exec(`node ${script}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running ${script}:`, error);
      return;
    }
    if (stderr) {
      console.error(`stderr from ${script}:`, stderr);
      return;
    }
    console.log(`stdout from ${script}:`, stdout);
  });

  process.on('exit', (code) => {
    console.log(`${script} process exited with code ${code}`);
  });
});

