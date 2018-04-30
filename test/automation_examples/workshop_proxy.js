var test_ui = require("./test_ui_wrapper");
var requestPromise = require('request-promise');

/*

simple example to show linking up to the proxy

*/

var port = 3000;
var proxyPort = 8080;
var proxyUrl = 'localhost:'+proxyPort
var capabilities = {
    'browserName': 'chrome',
    'proxy': {
        'proxyType': 'manual',
        'httpProxy': proxyUrl,
        'httpsProxy': proxyUrl,
        'sslProxy': proxyUrl
    }
}
var zap;

test_ui(
    port,
    capabilities,
    async function(helpers)
    {
    },
    async function(helpers)
    {
    },
    capabilities, // add proxy    
    proxyUrl,
    120*1000
)