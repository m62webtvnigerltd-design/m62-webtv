const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

async function start() {
    mongoServer = await MongoMemoryServer.create({
        instance: {
            ip: '127.0.0.1',
            port: 27017,
            dbName: 'm62_webtv'
        }
    });

    const uri = mongoServer.getUri();
    console.log(`MongoDB dev daemon started at ${uri}`);
    console.log('Keep this process running while backend uses MONGODB_URI=mongodb://127.0.0.1:27017');
}

async function shutdown(signal) {
    if (mongoServer) {
        await mongoServer.stop();
        console.log(`MongoDB dev daemon stopped on ${signal}`);
    }
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
    console.error('Failed to start MongoDB dev daemon:', error.message);
    process.exit(1);
});
