const fs = require("fs");
const http = require('http');
const util = require('util');

class Application {
    __errors = 0;
    __sessions = 0;
    errors_frequency = Number(process.env.ERRORS_FREQUENCY) || 2;

    constructor() {
    }

    get metrics() {
        return {
            errors_total: this.__errors,
            sessions_current: this.__sessions,
        };
    }

    serve() {
        this.__sessions++;
        if (Math.floor(Math.random() * this.errors_frequency) === this.errors_frequency - 1) {
            this.__sessions--;
            this.__errors++;
            throw new Error();
        } else {
            setTimeout(() => this.__sessions--, Math.floor(Math.random() * 2 * 1000));
            return 'Hello world!';
        }
    }
}

class ApplicationServer {
    app;
    httpRequests = {};
    port = process.env.PORT || 8080;

    constructor(app) {
        this.app = app
    }

    async start() {
        const httpServer = http.createServer((req, res) => {
            switch (req.url) {
                case '/request':
                    try {
                        const response = this.app.serve();
                        res.writeHead(200, 'text/plain');
                        res.end(response);
                    } catch (e) {
                        res.writeHead(500);
                        res.end('Server Error');
                    }
                    break;
                case '/metrics':
                    const {errors_total, sessions_current} = this.app.metrics;
                    const {
                        200: http_requests_200 = 0,
                        404: http_requests_404 = 0,
                        500: http_requests_500 = 0
                    } = this.httpRequests;

                    res.writeHead(200);
                    res.end(util.format(
                        fs.readFileSync(`${__dirname}/metrics.tmpl`, 'utf8'),
                        http_requests_200,
                        http_requests_404,
                        http_requests_500,
                        sessions_current,
                        errors_total
                    ));

                    this.httpRequests = {};
                    break;
                default:
                    res.writeHead(404);
                    res.end('Not Found');
            }

            res.on('finish', () => this.httpRequests[res.statusCode] = (this.httpRequests[res.statusCode] || 0) + 1)
        })

        return httpServer.listen(this.port);
    }
}

(async () => {
    const application = new Application();
    const server = new ApplicationServer(application);

    await server.start();
    console.info(`Server started on ::${server.port}`);
})()