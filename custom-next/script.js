#!/usr/bin/env node
const childProcess = require("child_process");
const path = require("path");
const fs = require("fs");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

let appName = process.argv[2];
const presetsPath = path.resolve(__dirname, 'presets');
let useMongoDB = false

if (!appName || appName.includes(" ") || appName !== appName.toLowerCase()) {
  const askAppName = () => {
    readline.question("Provide a name for the app: ", (answer) => {

      // if app name has a space or capital letter ask again
      if (answer.includes(" ") || answer !== answer.toLowerCase()) {
        console.log("App name cannot contain spaces or capital letters")
        askAppName()
        return
      }

      appName = answer
      runCommands()
    })
  }
  askAppName()
}
else {
  runCommands()
}

function runCommands(){
  readline.question("Do you want to use MongoDB (y/n)? ", (answer) => {
    useMongoDB = answer === "y" || answer === "Y"

    process.stdout.write('\n');
    
    // create the nextjs app using npx
    childProcess.execSync(`npx create-next-app@latest ${appName} --ts --eslint --use-npm --no-src-dir --no-experimental-app --import-alias @/*`, {
      stdio: "inherit",
    });
    
    // navigate into the app directory
    const appDirectory = path.join(process.cwd(), appName);
    process.chdir(appName);
    
    // install dependencies
    childProcess.execSync(`npm install tailwindcss postcss cssnano autoprefixer --save`, {
      stdio: "inherit",
    });
    
    // run tailwindcss init
    childProcess.execSync(`npx tailwindcss init`, {
      stdio: "inherit",
    });
    
    // delete all files in directory before copying
    const deleteFiles = (directory) => {
      if (!fs.existsSync(directory)) {
        return;
      }
    
      fs.readdirSync(directory).forEach(file => {
        const curPath = path.join(directory, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          deleteFiles(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(directory);
    };
    
    const copyFiles = (sourceDir, destDir) => {
      fs.readdir(sourceDir, (err, files) => {
        if (err) {
          console.error(`Could not read files from ${sourceDir}:`, err);
          process.exit(1);
        }
    
        files.forEach((file) => {
          const sourceFile = path.join(sourceDir, file);
          const destFile = path.join(destDir, file);
    
          fs.stat(sourceFile, (err, stats) => {
            if (err) {
              console.error(`Could not stat file ${file}:`, err);
              return;
            }
    
            if (stats.isDirectory()) {
              fs.mkdir(destFile, { recursive: true }, (err) => {
                if (err) {
                  console.error(`Could not create directory ${destFile}:`, err);
                  return;
                }
                deleteFiles(destFile);
    
                fs.mkdir(destFile, { recursive: true }, (err) => {
                  if (err) {
                    console.error(`Could not create directory ${destFile}:`, err);
                    return;
                  }
                });
    
                copyFiles(sourceFile, destFile);
              });
            } else {
              fs.copyFile(sourceFile, destFile, (copyErr) => {
                if (copyErr) {
                  console.error(`Could not copy file ${file}:`, copyErr);
                }
              });
            }
          });
        });
      });
    };
    
    if (useMongoDB) {
      // install mongodb and mongodb-client dependencies
      childProcess.execSync(`npm install mongodb mongodb`, {
        stdio: "inherit",
      });
      // copy the MongoDB preset files
      const mongodbPresetPath = path.resolve(__dirname, 'mongodb-preset');
      copyFiles(mongodbPresetPath, appDirectory);
    }
    else {
      // copy the default preset files
      copyFiles(presetsPath, appDirectory);
    }
    
    console.log(`Custom Next.js app created in ${appDirectory}!${useMongoDB ? "\n Remember to add your MongoDB connection string to the .env.local file and set up your db and connections in the api route" : ""}`)

    readline.close()
  })
}
