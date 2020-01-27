const path = require("path");
const fs = require("fs");
const nodecipher = require("node-cipher");

// joining path of directory
const directoryPath = path.join(__dirname, "secure-src");
// passsing directoryPath and callback function
const config = JSON.parse(
  fs.readFileSync("./.nodecipherrc", "utf8", (err, jsonString) => {
    if (err) {
      console.log("File read failed:", err);
    }
  })
);
const decrypt = inputFile => {
    console.log(inputFile)
  nodecipher.decrypt(
    {
      input: inputFile,
      output: `${inputFile.replace("secure-", "")}.js`,
      password: config.password
    },
    function(err, opts) {
      if (err) throw err;
    }
  );
};

const loopDirectory = directoryPath => {
  fs.readdir(directoryPath, function(err, files) {
    // handling error
    if (err) {
      return console.log(`Unable to scan directory: ${err}`);
    }
    // listing all files using forEach
    files.forEach(function(file) {
      const stat = fs.lstatSync(path.join(directoryPath, file));
      if (stat.isDirectory()) {
        return loopDirectory(path.join(directoryPath, file));
      }
      // Do whatever you want to do with the file
      decrypt(path.relative(process.cwd(), path.join(directoryPath, file)));
    });
  });
};
loopDirectory(directoryPath);
