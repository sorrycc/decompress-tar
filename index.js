'use strict';

var archiveType = require('archive-type');
var sbuff = require('simple-bufferstream');
var path = require('path');
var tar = require('tar');

/**
 * tar decompress plugin
 *
 * @param {Object} opts
 * @api public
 */

module.exports = function (opts) {
    opts = opts || {};
    opts.strip = +opts.strip || 0;

    return function (file, decompress, cb) {
        var files = [];

        if (archiveType(file.contents) !== 'tar') {
            return cb();
        }

        sbuff(file.contents).pipe(tar.Parse())
            .on('error', function (err) {
                return cb(err);
            })
            .on('entry', function (file) {
                var chunk = '';

                file.on('data', function (data) {
                    chunk += data.toString();
                });

                file.on('end', function () {
                    chunk = new Buffer(chunk, 'utf8');

                    if (opts.strip) {
                        var f = path.basename(file.path);
                        var p = path.dirname(file.path.split('/'));

                        if (Array.isArray(p)) {
                            p = p.slice(opts.strip).join(path.sep);
                        }

                        file.path = path.join(p, f);
                    }

                    files.push({ contents: chunk, path: file.path });
                });
            })
            .on('end', function () {
                decompress.files = files;
                cb();
            });
    };
};
