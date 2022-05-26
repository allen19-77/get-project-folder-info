import fs from 'fs'
const fsp = fs.promises,  {stat, readdir, copyFile} = fsp

const {assign, fromEntries} = Object

const all = Promise.all.bind(Promise)

const {stringify} = JSON


export {fs, stat}


// ISO-format dates
const date2str = date => stringify(date).slice(1,20).replace('T',' ')


// custom fs functions
export const mkdir = path => fsp.mkdir(path, {recursive: true})

const [copy, move] = [copyFile, fsp.rename]
  .map(fn => (path1, path2=path1.replace(/(^|[\\/]+)[^\\/]*$/, ''),
    name=path1.match(/(^|[\\/])([^\\/]*)$/)[2])=>
      mkdir(path2||'.').then(()=> fn(path1, (path2||'.')+'/'+name)))

const [dup, rename] = [copy, move]
  .map(fn => (path, name)=> fn(path, undefined, name))

export const remove = path => fsp.unlink(path)
  .catch(()=> fsp.rmdir(path, {recursive: true}))


// fs functions to gather intelligence
export const explore =(path, depth=32)=> stat(path).then(stats => {
  const name = path.match(/[^/\\]*$/)[0],
        {mtime, size} = stats,  dir = stats.isDirectory(),
        report = {name, date: date2str(mtime)}
  return !dir? assign(report, {size}) : depth? readdir(path)
    .then(list => all(list.map(name => explore(path+'/'+name, depth-1)))
      .then(reports => assign(report, {subs: reports}))) :
        assign(report, {subs: '...'})
})

const recon =(path, depth=32)=> stat(path).then(stats => {
  const {size} = stats,  dir = stats.isDirectory()
  return !dir? size : !depth? '...' : readdir(path)
    .then(list => all(list.map(name => recon(path+'/'+name, depth-1)
      .then(report => [name, report]))).then(fromEntries))
})

export const scout =(path, depth=32)=>
  recon(path, depth).then(report => ({[path.match(/[^/\\]*$/)[0]]: report}))


// namespace for custom fs functions
export const ops = {mkdir, copy, move, dup, rename, remove}