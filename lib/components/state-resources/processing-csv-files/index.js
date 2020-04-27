'use strict'
const smithereens = require('@wmfs/smithereens')
const debug = require('debug')('processingCsvFiles')

class ProcessingCsvFiles {
  init (resourceConfig, env) {
    this.parser = resourceConfig.parser
    this.dirSplits = resourceConfig.dirSplits
    this.fileSplits = resourceConfig.fileSplits
  } // init

  async run (event, context) {
    debug(`Execution ${context.executionName} is entering state 'processingCsvFiles - enabling debug for 'smithereens' is a good idea too!`)

    try {
      const manifest = await smithereens(
        event.sourceFilePaths,
        {
          outputDirRootPath: event.outputDirRootPath,
          parser: this.parser,
          dirSplits: this.dirSplits,
          fileSplits: this.fileSplits
        }
      )
      context.sendTaskSuccess()
    } catch (err) {
      context.sendTaskFailure({
        error: 'smithereenFail',
        cause: err
      })
    }
  } // run
} // ProcessingCsvFiles

module.exports = ProcessingCsvFiles
