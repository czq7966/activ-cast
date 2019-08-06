const path = require('path');
var fs = require('fs');
var archiver = require('archiver');
var NODE_MODE = !!process.env.NODE_MODE ? "-" + process.env.NODE_MODE : "";
class Archiver {
    constructor() {
        var manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../activ-cast/manifest.json")));
        var source = "activ-cast"
        var inputDir = path.resolve(__dirname , "../../../dist", source);
        var outputFile = path.resolve(__dirname , "../../../dist", source + "-" + manifest.version + NODE_MODE + ".zip")
        var output = fs.createWriteStream(outputFile);
        var archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', function() {
            console.log(archive.pointer() + ' total bytes:', outputFile);
            console.log('archiver has been finalized and the output file descriptor has closed.');
        });

        output.on('end', function() {
            console.log('Data has been drained');
        });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function(err) {
            if (err.code === 'ENOENT') {
              // log warning
            } else {
              // throw error
              throw err;
            }
        });     
        
        // good practice to catch this error explicitly
        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(output);

        // append files from a sub-directory and naming it `new-subdir` within the archive
        archive.directory(inputDir, source);
        archive.finalize();
    }
}

new Archiver();