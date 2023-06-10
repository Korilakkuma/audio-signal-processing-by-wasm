const connect = require('connect');
const serve   = require('serve-static');

const port = 8080;

connect().use(serve(`${__dirname}/`)).listen(port, () => {
  console.log(`Listen ... (${port})`);
});
