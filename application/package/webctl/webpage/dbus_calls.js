const DBus = require('dbus');

// DBus connection
const bus = DBus.getBus('system');
const serviceName = 'com.embedlinux.messenger';
const objectPath = '/com/embedlinux/messenger';
const interfaceName = 'com.embedlinux.web';

// Generic DBus method call function
function callDBusMethod(methodName, params, callback) {
    bus.getInterface(serviceName, objectPath, interfaceName, (err, iface) => {
        if (err) {
            return callback({ error: 'Error getting interface', details: err });
        }

        if (!iface[methodName]) {
            return callback({ error: `Method ${methodName} not found on interface` });
        }

        // Call the method with dynamic parameters
        iface[methodName](...params, (err, result) => {
            if (err) {
                return callback({ error: `Error calling method ${methodName}`, details: err });
            }
            callback(null, result);
        });
    });
}

// Register API routes
function registerRoutes(app) {
    // POST /api/calculate - Calls add_numbers with value1 and value2 from body
    // curl -X POST http://192.168.100.10:3000/api/calculate -H "Content-Type: application/json" -d '{"value1": 10, "value2": 20}'
    app.post('/api/calculate', (req, res) => {
        const { value1, value2 } = req.body;

        callDBusMethod('add_numbers', [value1, value2], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            console.log(`Result from add_numbers: ${result}`);
            res.send({ result });
        });
    });

    // GET /api/calculate - Calls add_numbers with value1 and value2 from query
    // curl "http://192.168.100.10:3000/api/calculate?value1=32&value2=2"
    app.get('/api/calculate', (req, res) => {
        const value1 = parseFloat(req.query.value1);
        const value2 = parseFloat(req.query.value2);

        callDBusMethod('add_numbers', [value1, value2], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            console.log(`Result from add_numbers: ${result}`);
            res.send({ result });
        });
    });

    // GET /api/temperature - Calls read_temperature
    // curl http://deviceIP:3000/api/temperature
    app.get('/api/temperature', (req, res) => {
        callDBusMethod('read_temperature', [], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            console.log(`Result from read_temperature: ${result}°C`);
            res.send({ temperature: result });
        });
    });
}

module.exports = { registerRoutes };