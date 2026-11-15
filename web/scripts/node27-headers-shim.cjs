// Node 27 alpha sets IncomingMessage.headers and OutgoingMessage.getHeaders() to
// null-prototype objects, which breaks Next.js 16's rawHeaders.hasOwnProperty()
// checks. Restore Object.prototype when missing.
const http = require("node:http");
const origEmit = http.Server.prototype.emit;
http.Server.prototype.emit = function (event, req, ...rest) {
  if (event === "request" && req && req.headers && typeof req.headers.hasOwnProperty !== "function") {
    Object.setPrototypeOf(req.headers, Object.prototype);
  }
  return origEmit.call(this, event, req, ...rest);
};
const origGetHeaders = http.OutgoingMessage.prototype.getHeaders;
http.OutgoingMessage.prototype.getHeaders = function () {
  const h = origGetHeaders.call(this);
  if (h && typeof h.hasOwnProperty !== "function") Object.setPrototypeOf(h, Object.prototype);
  return h;
};
