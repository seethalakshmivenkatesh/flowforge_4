const { EventEmitter } = require('events');

// Central event bus used to decouple the app (controllers) from the workflow engine.
// Controllers emit domain events; the workflow engine listens and reacts.
class AppEventBus extends EventEmitter {}

const eventBus = new AppEventBus();
eventBus.setMaxListeners(50);

module.exports = eventBus;
