import { BrowserWindow } from 'electron'
import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { expect, config } from 'chai'
import { closeAllWindows } from './window-helpers'

config.showDiff = true

function genSnapshot (browserWindow: BrowserWindow, features: string) {
  return new Promise((resolve) => {
    browserWindow.webContents.on('new-window', (...args: any[]) => {
      resolve(args)
    })
    browserWindow.webContents.executeJavaScript(`window.open('about:blank', 'frame name', '${features}')`)
  })
}

describe('native window.open', () => {
  const snapshotFile = resolve(__dirname, 'fixtures', 'snapshots', 'native-window-open.snapshot.txt')
  let browserWindow: BrowserWindow
  let existingSnapshots: any[]

  before(() => {
    existingSnapshots = JSON.parse(readFileSync(snapshotFile, { encoding: 'utf8' }))
  })

  beforeEach((done) => {
    browserWindow = new BrowserWindow({
      show: false,
      width: 200,
      title: 'cool',
      backgroundColor: 'blue',
      focusable: false,
      webPreferences: {
        nativeWindowOpen: true,
        sandbox: true
      }
    })

    browserWindow.loadURL('about:blank')
    browserWindow.on('ready-to-show', () => done())
  })

  afterEach(closeAllWindows)

  const newSnapshots: any[] = [];
  [
    'top=5,left=10,resizable=no',
    'zoomFactor=2,resizable=0,x=0,y=10',
    'backgroundColor=gray,webPreferences=0,x=100,y=100',
    'x=50,y=20,title=sup'
  ].forEach((features, index) => {
    it(`matches snapshot for ${features}`, async () => {
      const newSnapshot = await genSnapshot(browserWindow, features)
      newSnapshots.push(newSnapshot)
      expect(stringifySnapshots(newSnapshot)).to.equal(stringifySnapshots(existingSnapshots[index]))
    })
  })

  after(() => {
    const shouldOverwriteSnapshot = false
    if (shouldOverwriteSnapshot) writeFileSync(snapshotFile, stringifySnapshots(newSnapshots, true))
  })
})

describe('proxy window.open', () => {
  const snapshotFile = resolve(__dirname, 'fixtures', 'snapshots', 'proxy-window-open.snapshot.txt')
  let browserWindow: BrowserWindow
  let existingSnapshots: any[]

  before(() => {
    existingSnapshots = JSON.parse(readFileSync(snapshotFile, { encoding: 'utf8' }))
  })

  beforeEach((done) => {
    browserWindow = new BrowserWindow({
      show: false
    })

    browserWindow.loadURL('about:blank')
    browserWindow.on('ready-to-show', () => done())
  })

  afterEach(closeAllWindows)

  const newSnapshots: any[] = [];
  [
    'top=5,left=10,resizable=no',
    'zoomFactor=2,resizable=0,x=0,y=10',
    'backgroundColor=gray,webPreferences=0,x=100,y=100',
    'x=50,y=20,title=sup'
  ].forEach((features, index) => {
    it(`matches snapshot for ${features}`, async () => {
      const newSnapshot = await genSnapshot(browserWindow, features)
      newSnapshots.push(newSnapshot)
      expect(stringifySnapshots(newSnapshot)).to.equal(stringifySnapshots(existingSnapshots[index]))
    })
  })

  after(() => {
    const shouldOverwriteSnapshot = false
    if (shouldOverwriteSnapshot) writeFileSync(snapshotFile, stringifySnapshots(newSnapshots, true))
  })
})

function stringifySnapshots (snapshots: any, pretty = false) {
  return JSON.stringify(snapshots, (key, value) => {
    if (['sender', 'webContents'].includes(key)) {
      return '[WebContents]'
    }
    return value
  }, pretty ? 2 : undefined)
}
