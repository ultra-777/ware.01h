"use strict";

var express = require('express'),
    app = express();

app.use(express.static(__dirname + '/../dist'));

var port = 8000;
app.listen(port);
console.log('Listening on port: ' + port);