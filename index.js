#!/usr/bin/env node

'use strict';
const program = require('commander');
const co = require('co');
const prompt = require('co-prompt');
const chalk = require('chalk');
const fs = require('fs');
// const Progress = require('progress');
const shell = require('shelljs');
const figlet = require('figlet');
const plist = require('simple-plist');

const cyan = chalk.bold.cyan;
const home = process.env.HOME;
const store = home + '/.npm/taco-cloner/preferences.json';

const project = {};

const globals = {
  shortName: null,
  dbName: ''
};

function extractProjectName(url) {
  const urlName = url.replace('.git', '');
  return urlName.slice(urlName.lastIndexOf('/') + 1, urlName.length);
}

console.log(
  chalk.red(
    figlet.textSync('vermilion', {
      font: 'doom',
      horizontalLayout: 'full'
    })
  )
);

program
  .arguments('<gitRepo>')
  .action(siteName => {
    const gitURL = siteName;
    siteName = extractProjectName(gitURL);

    co(function * () {
      console.log('accessing preferences...');
      // check to see if preference file already exists
      if (fs.existsSync(store)) {
        console.log('preferences loaded.');
      } else {
        // make the parent folder and create the file
        console.log('no preferences file detected...');
        fs.mkdir(home + '/.npm/taco-cloner');
        fs.writeFileSync(store, '', console.log('preferences file created at ' + store));
      }
      console.log(`Initializing local copy of ${siteName}...`);

      if (gitURL) {
        shell.exec(`git clone ${gitURL}`);
        shell.cd(siteName);
      }

      // Production Server credentials
      const addToSSHConfig = yield prompt(cyan('Add prod credentials to ssh config? [y/n]: '));
      if (addToSSHConfig.toLowerCase() == 'y') {
        const shortName = yield prompt(cyan('Shortcut: '));
        globals.shortName = shortName;
        const serverAddress = yield prompt(cyan('Server address: '));
        const serverUser = yield prompt(cyan('Server user: '));
        let port = yield prompt(cyan('port number:') + ' [22]: ');
        port = port ? `port   ${port} \n` : '\n';

        const sshconfigTemplate = `Host ${shortName}
          hostName ${serverAddress}
          user ${serverUser}
          ${port}
        `;

        // write configuration into file
        shell.exec(`echo "${sshconfigTemplate}" >> ~/.ssh/config`);
        !shell.error() ? console.log(chalk.green('✔ ssh shortcut created')) : console.log('Something went wrong.');
        shell.exec(`ssh-copy-id ${shortName}`);

        // console.log('please choose the location of the uploads folder on the production server');

        // connect to remote server
      }

      // Create vHost File
      const makeVhost = yield prompt(cyan('setup vHost? [y/n]: '));
      if (makeVhost.toLowerCase() == 'y') {
        let serverType = yield prompt(cyan('http or https:') + '[https]');
        serverType = serverType || 'https';
        const localAddress = yield prompt(cyan('enter a local address: '));
        // https server
        if (serverType == 'https') {
          const vHostTemplate = `<VirtualHost *:443>
              DocumentRoot "${home + '/Sites/' + siteName}/html"
              ServerName ${localAddress}
              SSLEngine on
              SSLCertificateFile "/usr/local/etc/httpd/ssl/server.crt"
              SSLCertificateKeyFile "/usr/local/etc/httpd/ssl/server.key"

              CustomLog /usr/local/var/log/httpd/${siteName}/_access_log common
              ErrorLog /usr/local/var/log/httpd/${siteName}/_error_log
            </VirtualHost>
            `;

          shell.exec(` echo "${vHostTemplate}" >> /usr/local/etc/httpd/vhosts/${siteName}.conf`);
          shell.mkdir(`/usr/local/var/log/httpd/${siteName}/`);
          shell.exec('sudo apachectl restart');
          console.log(chalk.green('✔ vHost added'));

          // http server
        } else if (serverType == 'http') {
          const vHostTemplate = `<VirtualHost *:80>
              DocumentRoot "${home + '/Sites/' + siteName}/html"
              ServerName ${localAddress}

              CustomLog /usr/local/var/log/httpd/${siteName}/_access_log common
              ErrorLog /usr/local/var/log/httpd/${siteName}/_error_log
            </VirtualHost>`;

          shell.exec(`echo "${vHostTemplate}" >> /usr/local/etc/httpd/vhosts/${siteName}.conf`);
          shell.mkdir(`/usr/local/var/log/httpd/${siteName}/`);
          shell.exec('sudo apachectl restart');
          console.log(chalk.green('✔ vHost added.'));
        }
      }

      // add mySQL credentials
      const addMySQLCreds = yield prompt(cyan('Add mySQL Credentials? [y/n]: '));
      if (addMySQLCreds.toLowerCase() == 'y') {
        const hostName = yield prompt(cyan('Database host: '));
        const dbUser = yield prompt(cyan('Database user: '));
        const dbName = yield prompt(cyan('Database name: '));
        globals.dbName = dbName;
        const dbPass = yield prompt(cyan('Database pass: '));
        const tablePrefix = yield prompt(cyan('Table prefix: '));
        let sshTunnel = yield prompt(cyan('Use SSH tunnel? [y/n]: '));
        sshTunnel = sshTunnel.toLowerCase() === 'y';

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
        // if using SSH tunnel, add the ssh shortcut from earlier to the object.
        if (sshTunnel && globals.shortName) {
          project[siteName].mysql.sshUser = globals.shortName;
        }

        const json = JSON.stringify(project);
        fs.writeFileSync(store, json, console.log('saved configuration'));

        // Sequel Pro Favorites.plist lives at
        // ~/Library/Application Support/Sequel Pro/Data/Favorites.plist
        plist.readFileSync(home + '/Library/Application Support/Sequel Pro/Data/Favorites.plist', (err, data) => {
          if (err) {
            throw err;
          }
          const sequelProPlist = JSON.parse(data);
          console.log(sequelProPlist);
        });
      }

      const runPostInstaller = yield prompt(cyan('Run composer and npm? [y/n]: '));
      if (runPostInstaller.toLowerCase() == 'y') {
        shell.cd(`~/Sites/${siteName}/`);
        shell.exec(
          `printf "<?php \n  define(CLIENT_DB_USER, 'root');\n  define(CLIENT_DB_PASSWORD, 'root');\n  define(CLIENT_DB_HOSTNAME, '127.0.0.1');\n  define(CLIENT_DB_NAME, '${globals.dbName}');" > db.php`
        );
        shell.exec('composer install');
        shell.cd('html/wp-content/themes/taco-theme/app/core/');
        shell.exec('composer install --optimize-autoloader');
        console.log(chalk.green('✔ Composer.'));

        shell.cd(`~/Sites/${siteName}/html/wp-content/themes/taco-theme`);
        shell.exec('npm install && webpack -p');
        console.log(chalk.green('✔ npm & webpack'));
      }

      console.log(chalk.green('✔ Setup is now complete.'));
      process.exit(0);
    });
  })
  .parse(process.argv);
