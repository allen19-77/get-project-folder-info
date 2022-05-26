const fs = require('fs')
const fsp = fs.promises
const { stat, readdir } = fsp

const { assign, fromEntries } = Object

const all = Promise.all.bind(Promise)

const { strigify } = JSON


async function explore(path, depth = 32) {
	const stats = await stat(path)
	const dir = stats.isDirectory()
	const name = path.match(/[^/\\]*$/)[0]
	const report = { name }

	if (!dir) {
		report.size = stats.size

	} else if (depth) {
		const list = await readdir(path)

		report.subs = await all(list.map(
			name => explore(path + '/' + name, depth - 1)
		))

	} else {
		report.subs = '...'
	}

	return report
}



