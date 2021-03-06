const config = require('./config')
    , log = require('./log')
    , ui = require('./ui')
    , chokidar = require('chokidar')
    , childProcess = require('child_process')

module.exports = function() {

  config.execute.forEach(execute)
  config.execute.filter(s => s.watch).forEach((s, i) => {
    chokidar.watch(s.watch, {
      ignoreInitial: true
    }).on('add', () => changed(s, i)).on('change', () => changed(s, i))
  })

}

function changed(obj, i) {
  const notification = ui.notification('Executing', 'From ' + obj.watch)

  setTimeout(notification.close, 5000)

  execute(obj, i)
  obj.process && obj.process.on('exit', notification.done)
}

function execute(obj, i) {
  if (typeof obj.command === 'function')
    return obj.command()

  log.debug('Spawning', obj.command)

  if (obj.process) {
    log.debug('Exiting', obj.command)
    obj.process.kill()
  }

  obj.process = childProcess.spawn(obj.command.split(' ')[0], obj.command.split(' ').slice(1), {
    shell: process.platform === 'win32'
  })
  obj.process.on('error', log.error)
  obj.process.stdout.on('data', b => log('PS' + (i + 1), b.toString().replace(/\n$/, '')))
  obj.process.stderr.on('data', b => log.error('PS' + (i + 1), b.toString().replace(/\n$/, '')))
}

process.on('exit', () => {
  (config.execute || []).filter(s => s.process).forEach(s => s.process.kill())
})
