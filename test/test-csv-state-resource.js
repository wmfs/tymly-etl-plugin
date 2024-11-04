/* eslint-env mocha */
'use strict'
const tymly = require('@wmfs/tymly')
const path = require('path')
const expect = require('chai').expect
const { globSync } = require('glob')
const _ = require('lodash')
const csv = require('csvtojson')
const STATE_MACHINE_NAME = 'tymlyTest_people_1_0'

describe('CSV and tymly test', function () {
  const fixture = path.resolve(__dirname, 'fixtures', 'people')

  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService
  let statebox

  it('start Tymly service', async () => {
    const tymlyServices = await tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          path.resolve(__dirname, '../node_modules/@wmfs/tymly-test-helpers/plugins/allow-everything-rbac-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/people/blueprints/people-blueprint')
        ]
      }
    )

    tymlyService = tymlyServices.tymly
    statebox = tymlyServices.statebox
  })

  it('process CSV file', async () => {
    const executionDescription = await statebox.startExecution(
      {
        sourceFilePaths: path.resolve(fixture, 'input', 'people.csv'),
        outputDirRootPath: path.resolve(fixture, 'output'),
        sourceDir: path.resolve(fixture, 'output')
      }, // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      } // options
    )

    expect(executionDescription.status).to.eql('SUCCEEDED')
    expect(executionDescription.currentStateName).to.eql('ProcessingCsvFiles')
  })

  it('create delete and upserts directories', () => {
    const files = globSync(path.resolve(fixture, 'output', '*'))

    expect(files).to.deep.equal([
      _.replace(path.resolve(fixture, 'output', 'delete'), /\\/g, '/'),
      _.replace(path.resolve(fixture, 'output', 'manifest.json'), /\\/g, '/'),
      _.replace(path.resolve(fixture, 'output', 'upserts'), /\\/g, '/')
    ])
  })

  it('check delete files have been split correctly', (done) => {
    const csvDeletesPath = path.resolve(fixture, 'output', 'delete', 'people.csv')
    csv()
      .fromFile(csvDeletesPath)
      .on('json', function (json) {
        expect(json.action).to.equal('d')
      })
      .on('done', function (err) {
        expect(err).to.eql(undefined)
        done()
      })
  })

  it('check upserts files have been split correctly', (done) => {
    const csvUpsertsPath = path.resolve(fixture, 'output', 'upserts', 'people.csv')
    csv()
      .fromFile(csvUpsertsPath)
      .on('json', function (json) {
        expect(json.action).to.satisfy(function (action) {
          if (action === 'x' || action === 'u' || action === 'i') {
            return true
          } else {
            return false
          }
        })
      })
      .on('done', function (err) {
        expect(err).to.eql(undefined)
        done()
      })
  })

  after('shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
