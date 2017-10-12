#!/usr/bin/env node

"use strict";
const program = require('commander');
const co = require('co');
const prompt = require('co-prompt');
const chalk = require('chalk');
const fs = require('fs');
const Progress = require('progress');
const shell = require('shelljs');
const figlet = require('figlet');

const cyan = chalk.bold.cyan;
const home = process.env['HOME'];
const store = home + '/.npm/taco-cloner/preferences.json';

var project = {};

console.log(chalk.red(
  figlet.textSync('vermilion', {
    font: 'doom',
    horizontalLayout: 'full'
  })
));


program
  .arguments('<siteName>')
  .action((siteName) => {
    co(function*() {
      console.log('accessing preferences...');

      // check to see if preference file already exists
      if (fs.existsSync(store)) {
        console.log('preferences loaded.');
      } else {
        // make the parent folder and create the file
        console.log("no preferences file detected...");
        fs.mkdir(home + '/.npm/taco-cloner');
        fs.writeFileSync(store, "", console.log("preferences file created at " + store));
      }
      console.log(`Initializing local copy of ${siteName}...`);

      // Production Server credentials
      let addToSSHConfig = yield prompt(cyan('Add prod credentials to ssh config? [y/n]: '));
      if (addToSSHConfig.toLowerCase() == 'y') {
        let shortName = yield prompt(cyan('Shortcut: '));
        let serverAddress = yield prompt(cyan('Server address: '));
        let serverUser = yield prompt(cyan('Server user: '));
        let port = yield prompt(cyan('port number:') + ' [22]: ');
        port = (port) ? `port   ${port} \n` : '\n';

        let sshconfigTemplate =
          `Host ${shortName}
          hostName ${serverAddress}
          user ${serverUser}
          ${port}`;

        //write configuration into file  
        shell.exec(`echo "${sshconfigTemplate}" >> ~/.ssh/config`);
        (!shell.error()) ? console.log(chalk.green('✔ Complete')): console.log('Something went wrong.');
        // shell.exec(`ssh-copy-id ${shortName}`);

        console.log("please choose the location of the uploads folder on the production server");
        
        //connect to remote server

          
      }

      // Create vHost File
      let makeVhost = yield prompt(cyan('setup vHost? [y/n]: '));
      if (makeVhost.toLowerCase() == 'y') {
        let serverType = yield prompt(cyan('http or https:') + '[https]');
        serverType = (serverType) ? serverType : 'https';
        let localAddress = yield prompt(cyan('enter a local address: '));
        //https server
        if (serverType == 'https') {
          let vHostTemplate =
            `<VirtualHost *:443>
              DocumentRoot "${__dirname}/html"
              ServerName ${localAddress}
              SSLEngine on
              SSLCertificateFile "/usr/local/etc/apache2/2.4/ssl/server.crt"
              SSLCertificateKeyFile "/usr/local/etc/apache2/2.4/ssl/server.key"

              CustomLog /usr/local/var/log/apache2/${siteName}/_access_log common
              ErrorLog /usr/local/var/log/apache2/${siteName}/_error_log
            </VirtualHost>
            `;

          shell.exec(` echo "${vHostTemplate}" >> /usr/local/etc/apache2/2.4/vhosts/${siteName}.conf`);
          shell.mkdir(`/usr/local/var/log/apache2/${siteName}/`);
          console.log(chalk.green('✔ Complete. Please restart Apache.'));


          //http server
        } else if (serverType == 'http') {
          let vHostTemplate =
            `<VirtualHost *:80>
              DocumentRoot "${__dirname}/html"
              ServerName ${localAddress}

              CustomLog /usr/local/var/log/apache2/${siteName}/_access_log common
              ErrorLog /usr/local/var/log/apache2/${siteName}/_error_log
            </VirtualHost>`;

          shell.exec(`echo "${vHostTemplate}" >> /usr/local/etc/apache2/2.4/vhosts/${siteName}.conf`);
          shell.mkdir(`/usr/local/var/log/apache2/${siteName}/`);
          console.log(chalk.green('✔ Complete. Please restart Apache.'));

        }
      }

      //add mySQL credentials
      let addMySQLCreds = yield prompt(cyan('Add mySQL Credentials? [y/n]: '));
      if (addMySQLCreds.toLowerCase() == 'y') {
        let hostName = yield prompt(cyan('Database host: '));
        let dbUser = yield prompt(cyan('Database user: '));
        let dbName = yield prompt(cyan('Database name: '));
        let dbPass = yield prompt(cyan('Database pass: '));
        let tablePrefix = yield prompt(cyan('Table prefix: '));
        let sshTunnel = yield prompt(cyan('Use SSH tunnel? [y/n]: '));
        sshTunnel = (sshTunnel.toLowerCase() === 'y') ? true : false;

        project[siteName] = {
          mysql: {
            hostName,
            dbUser,
            dbName,
            dbPass,
            tablePrefix,
            sshTunnel
          }
        };

        let json = JSON.stringify(project);
        fs.writeFileSync(store, json, console.log("saved configuration"));
      }
      

      console.log(chalk.green('✔ Setup is now complete.'));
      process.exit(0);
    });
  })
  .parse(process.argv);