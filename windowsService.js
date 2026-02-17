var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'MediaBot',
  description: 'MediaBot NodeJS app',
  script: 'C:\\Users\\Ark\\Desktop\\DEV\\MediaBot\\app.js',
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

// Install service
svc.install();

// Uninstall service
// svc.uninstall();

// Restart service
// svc.restart()
