var stderr = process.stderr;
module.exports = function status(str) {
  if (stderr.isTTY) {
    stderr.cursorTo(0);
    stderr.write((str || '\n').substr(0, stderr.columns - 1));
    stderr.clearLine(1);
  }
}
